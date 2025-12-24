import { defineStore } from 'pinia';
import type { User } from '~/types/api.gateway';
import { useAuthStore } from './auth';
// (Откат) Убраны дополнительные импорты стор для deep очистки

/**
 * Интерфейс для глобального хранилища состояния
 */
interface GlobalState { user: User | null; currentPartnerZoneId: string | null }

/**
 * Глобальное хранилище для общего состояния приложения
 */
export const useGlobalStore = defineStore('global', {
	state: (): GlobalState => ({ user: null, currentPartnerZoneId: null }),

	getters: {
// (Откат) удалён геттер активности пользователя
		/**
		 * Проверка авторизации пользователя
		 */
		isAuthenticated(): boolean {
			return !!document.cookie
				.split(';')
				.some(row => row.trim().startsWith('auth_token'));
		},

		/**
		 * Полное имя пользователя
		 */
		userFullName(): string {
			if (!this.user) return '';

			const firstName = this.user.firstName || '';
			const lastName = this.user.lastName || '';

			return `${firstName} ${lastName}`.trim();
		},

		/**
		 * Email пользователя
		 */
		userEmail(): string {
			return this.user?.email || '';
		},

		/**
		 * Телефон пользователя
		 */
		userPhone(): string {
			return this.user?.phone || '';
		},
		userId(): string {
			// Поддерживаем как нормализованный формат (id), так и API формат (Id)
			return this.user?.id || (this.user as any)?.Id || '';
		},
		/**
		 * Объединённый список всех доступных партнёрских зон (owned + allowed, без дублей)
		 */
		allPartnerZones(): any[] {
			const owned = this.user?.ownedPartnerZones || this.user?._originalData?.OwnedPartnerZones || [];
			const allowed = this.user?.allowedPartnerZones || this.user?._originalData?.AllowedPartnerZones || [];
			const all = [...owned, ...allowed];
			const seen = new Set();
			const result = all.filter(z => {
				const id = z.partnerZoneId || z.id || z.PartnerZoneId || z.Id;
				if (!id || seen.has(id)) return false;
				seen.add(id);
				return true;
			});
			return result;
		},
	},

	actions: {
		/**
		 * Установить текущий ID партнерской зоны
		 * @param zoneId ID партнерской зоны
		 */
		setPartnerZoneId(zoneId: string | null): void {
			if (zoneId && typeof zoneId === 'string') {
				this.currentPartnerZoneId = zoneId;
			} else {
				this.currentPartnerZoneId = null;
			}
		},

		/**
		 * Установить данные пользователя
		 * @param user - Данные пользователя
		 */
		setUser(user: User | null): void {
			// Если передан объект с API-формата, нормализуем его
			if (
				user &&
				('Id' in user ||
					'Name' in user ||
					'Email' in user ||
					'PhoneNumber' in user)
			) {
				const normalizedUser = this.normalizeUserData(user);

				user = normalizedUser;
			}

			this.user = user;

			// Устанавливаем первую доступную партнерскую зону при установке пользователя
			if (user) {
				// Поддерживаем как нормализованный формат, так и API формат
				const ownedZones =
					user.ownedPartnerZones || (user as any).OwnedPartnerZones || [];
				const allowedZones =
					user.allowedPartnerZones || (user as any).AllowedPartnerZones || [];

					console.log('ownedZones', ownedZones)
				let partnerZoneId = null;

				// Сначала пробуем owned zones
				if (ownedZones && ownedZones.length > 0) {
					partnerZoneId =
						ownedZones[0]?.partnerZoneId ||
						ownedZones[0]?.PartnerZoneId ||
						null;
					console.log('partnerZoneId', partnerZoneId);
				}
				// Если не найдено, пробуем allowed zones
				else if (allowedZones && allowedZones.length > 0) {
					partnerZoneId = allowedZones[0]?.id || allowedZones[0]?.Id || null;
				}
				this.setPartnerZoneId(partnerZoneId);
			} else {
				this.setPartnerZoneId(null);
			}
		},

		/**
		 * Обновить данные пользователя
		 * @param userData - Частичные данные пользователя для обновления
		 */
		refreshUser(userData: Partial<User> | Record<string, any>): void {
			// Если данные в API-формате, нормализуем их
			if (
				'Id' in userData ||
				'Name' in userData ||
				'Email' in userData ||
				'PhoneNumber' in userData
			) {
				userData = this.normalizeUserData(userData);
			}

			if (!this.user) {
				// Если пользователя нет, устанавливаем новые данные как полный объект
				if ('id' in userData) {
					this.setUser(userData as User);
				}
				return;
			}

			// Обновляем существующие данные пользователя
			this.user = {
				...this.user,
				...userData,
			};
		},

		/**
		 * Нормализует данные пользователя из API-формата в формат интерфейса User
		 * @param apiUser - Данные пользователя в формате API (с заглавными буквами)
		 * @returns - Данные пользователя в формате интерфейса User
		 */
		normalizeUserData(apiUser: Record<string, any>): User {
			// Копируем объект для безопасной работы с ним
			const result: Record<string, any> = {};

			// Сохраняем оригинальные данные в отдельном поле
			result._originalData = { ...apiUser };

			// Преобразуем все поля объекта к camelCase
			Object.keys(apiUser).forEach(key => {
				// Пропускаем, если ключ пустой или null
				if (!key) return;

				// Преобразуем первый символ ключа к нижнему регистру
				const newKey = key.charAt(0).toLowerCase() + key.slice(1);
				const value = apiUser[key];

				// Обрабатываем массивы рекурсивно
				if (Array.isArray(value)) {
					result[newKey] = value.map(item => {
						// Если элемент массива - объект, обрабатываем его рекурсивно
						if (item && typeof item === 'object' && !Array.isArray(item)) {
							const newItem: Record<string, any> = {};
							Object.keys(item).forEach(itemKey => {
								if (!itemKey) return;
								const newItemKey =
									itemKey.charAt(0).toLowerCase() + itemKey.slice(1);

								// Рекурсивно обрабатываем вложенные объекты и массивы
								if (item[itemKey] && typeof item[itemKey] === 'object') {
									if (Array.isArray(item[itemKey])) {
										// Для массивов
										newItem[newItemKey] = this.normalizeArray(item[itemKey]);
									} else {
										// Для объектов
										newItem[newItemKey] = this.normalizeObject(item[itemKey]);
									}
								} else {
									// Для примитивов
									newItem[newItemKey] = item[itemKey];
								}
							});
							return newItem;
						}
						// Если элемент массива не объект, возвращаем как есть
						return item;
					});
				}
				// Обрабатываем объекты рекурсивно
				else if (value && typeof value === 'object' && !Array.isArray(value)) {
					result[newKey] = this.normalizeObject(value);
				}
				// Примитивные значения оставляем как есть
				else {
					result[newKey] = value;
				}
			});

			// Специальная обработка для некоторых полей
			if (result.name && typeof result.name === 'string') {
				// Если Name выглядит как GUID или UUID, не используем его как имя
				const guidRegex =
					/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
				if (!guidRegex.test(result.name)) {
					// Пытаемся разделить на имя и фамилию по пробелу
					const nameParts = result.name.split(' ');
					if (nameParts.length > 1) {
						result.firstName = nameParts[0];
						result.lastName = nameParts.slice(1).join(' ');
					} else {
						result.firstName = result.name;
					}
				}
			}

			// Преобразуем телефон
			if (result.phoneNumber && !result.phone) {
				result.phone = result.phoneNumber;
			}

			// Если есть роли, добавляем основную роль
			if (
				result.roles &&
				Array.isArray(result.roles) &&
				result.roles.length > 0 &&
				result.roles[0].name
			) {
				result.role = result.roles[0].name;
			}

			return result as User;
		},

		/**
		 * Нормализует объект, преобразуя все ключи к camelCase
		 * @param obj - Объект для нормализации
		 * @returns - Нормализованный объект
		 */
		normalizeObject(obj: Record<string, any>): Record<string, any> {
			if (!obj || typeof obj !== 'object') return obj;

			const result: Record<string, any> = {};

			Object.keys(obj).forEach(key => {
				if (!key) return;
				const newKey = key.charAt(0).toLowerCase() + key.slice(1);
				const value = obj[key];

				if (value && typeof value === 'object') {
					if (Array.isArray(value)) {
						result[newKey] = this.normalizeArray(value);
					} else {
						result[newKey] = this.normalizeObject(value);
					}
				} else {
					result[newKey] = value;
				}
			});

			return result;
		},

		/**
		 * Нормализует массив объектов
		 * @param arr - Массив для нормализации
		 * @returns - Нормализованный массив
		 */
		normalizeArray(arr: any[]): any[] {
			if (!Array.isArray(arr)) return arr;

			return arr.map(item => {
				if (item && typeof item === 'object') {
					if (Array.isArray(item)) {
						return this.normalizeArray(item);
					} else {
						return this.normalizeObject(item);
					}
				}
				return item;
			});
		},

		/**
		 * Удалить данные пользователя
		 */
		removeUser(): void { this.user = null; this.setPartnerZoneId(null) },

		/**
		 * Инициализация хранилища
		 * Загружает данные пользователя с сервера
		 */
		async init(): Promise<void> {
			const authStore = useAuthStore();

			console.log(
				'[GlobalStore] 🚀 Начинаем инициализацию глобального хранилища...'
			);

			try {
				// Загружаем данные пользователя с сервера
				// fetchUser автоматически вызывает setUser, который устанавливает currentPartnerZoneId
				await authStore.fetchUser();

				console.log('[GlobalStore] ✅ Данные пользователя загружены');
				console.log('[GlobalStore] 👤 userId:', this.userId);
				console.log(
					'[GlobalStore] 🏢 currentPartnerZoneId:',
					this.currentPartnerZoneId
				);

				// НЕ загружаем календарь здесь!
				// Календарь должен загружаться в calendar store при его инициализации
				// Это избежит race condition и дублирования запросов

				console.log(
					'[GlobalStore] ✅ Глобальное хранилище полностью инициализировано'
				);
			} catch (error) {
				console.error(
					'[GlobalStore] ❌ Ошибка инициализации глобального хранилища:',
					error
				);
				throw error;
			}
		},
	},
});
