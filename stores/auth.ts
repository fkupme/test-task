import { defineStore } from 'pinia';
import { AuthService } from '@/classes/api/AuthService';
import { useGlobalStore } from '@/stores/global';
import type { ApiGatewayClient } from '@/types/api';
import type { User } from '@/types/api.gateway';
import type { LoginCredentials, RegisterData } from '@/types/services/auth';

// Ключ для хранения данных формы в localStorage
const REGISTRATION_FORM_KEY = 'registration_form_data';

// Интерфейс для состояния хранилища авторизации
interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  error: { shortMessage: string; longMessage: string } | null;
  registrationData: RegisterData | null;
  tokenRefreshing: boolean;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isLoggedIn: false,
    user: null,
    loading: false,
    error: null,
    registrationData: null,
    tokenRefreshing: false,
  }),

  getters: {
    userFullName: state => {
      if (!state.user) return '';

      const firstName = state.user.firstName || '';
      const lastName = state.user.lastName || '';

      return `${firstName} ${lastName}`.trim();
    },

    userEmail: state => state.user?.email || '',
    userPhone: state => state.user?.phone || '',
  },

  actions: {
    /**
     * Получение данных текущего пользователя
     */
    async fetchUser(): Promise<User | null> {
      this.loading = true;
      this.error = null;
      const globalStore = useGlobalStore();

      try {
        const authService = this.getAuthService();
        const user = await authService.getCurrentUser();

        if (user) {
          this.isLoggedIn = true;
          this.user = user;
          globalStore.setUser(user);
          console.log('[AuthStore] Пользователь успешно получен', user);
          return user;
        } else {
          // Если getCurrentUser вернул что-то falsy без ошибки
          throw new Error('Данные пользователя не получены');
        }
      } catch (error) {
        console.error('[AuthStore] Ошибка при получении пользователя:', error);
        this.isLoggedIn = false;
        this.user = null;
        this.error = {
          shortMessage: 'Ошибка получения пользователя',
          longMessage:
            error instanceof Error
              ? error.message
              : 'Неизвестная ошибка при получении данных пользователя',
        };
        globalStore.removeUser(); // Удаляем пользователя из глобального стора при ошибке
        return null;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Создание экземпляра сервиса авторизации
     */
    getAuthService(): AuthService {
      const nuxtApp = useNuxtApp();
      const apiGateway = nuxtApp.$apiGateway as ApiGatewayClient;
      return new AuthService(apiGateway);
    },

    /**
     * Инициализация состояния авторизации
     * Получает данные текущего пользователя из API
     */
    async init() {
      try {
        this.loading = true;
        const authService = this.getAuthService();

        // Восстанавливаем данные регистрации из localStorage при инициализации
        this.restoreRegistrationData();

        // Инициализируем глобальное хранилище
        const globalStore = useGlobalStore();
        globalStore.init();

        // Проверяем валидность токена (если метод существует)
        const isTokenValid =
          typeof authService.isTokenValid === 'function'
            ? authService.isTokenValid()
            : true;

        if (!isTokenValid) {
          // Пробуем обновить токен, если он невалиден
          this.tokenRefreshing = true;

          const refreshed =
            typeof authService.refreshToken === 'function'
              ? await authService.refreshToken()
              : false;

          this.tokenRefreshing = false;

          if (!refreshed) {
            // Если не удалось обновить токен, считаем пользователя не авторизованным
            this.isLoggedIn = false;
            this.user = null;

            // Очищаем данные в глобальном хранилище
            globalStore.removeUser();

            return;
          }
        }

        // Всегда получаем актуальные данные с сервера
        try {
          const user = await authService.getCurrentUser();

          if (user) {
            this.isLoggedIn = true;
            this.user = user;

            // Обновляем данные в глобальном хранилище
            globalStore.setUser(user);
          }
        } catch (error) {
          console.log('Ошибка при получении данных пользователя', error);
          this.isLoggedIn = false;
          this.user = null;
          globalStore.removeUser();
        }
      } catch (error) {
        console.log('Пользователь не авторизован', error);
        this.isLoggedIn = false;
        this.user = null;

        // Очищаем данные в глобальном хранилище
        const globalStore = useGlobalStore();
        globalStore.removeUser();
      } finally {
        this.loading = false;
      }
    },

    /**
     * Авторизация пользователя
     * @param credentials - Учетные данные
     */
    async login(credentials: LoginCredentials) {
      this.loading = true;
      this.error = null;

      try {
        const authService = this.getAuthService();
        const response = await authService.login(credentials);

        // После успешного логина запрашиваем актуальные данные пользователя
        try {
          const user = await authService.getCurrentUser();

          // Сохраняем данные в auth store
          this.user = user;

          // Сохраняем данные в глобальное хранилище
          const globalStore = useGlobalStore();
          globalStore.setUser(user);

          console.log(
            '[AuthStore] Данные пользователя получены после авторизации'
          );
        } catch (userError) {
          console.error(
            '[AuthStore] Ошибка получения данных пользователя после авторизации:',
            userError
          );
          // Используем данные пользователя из ответа логина, если не удалось запросить
          this.user = response.user;

          // Сохраняем доступные данные в глобальное хранилище
          if (response.user) {
            const globalStore = useGlobalStore();
            globalStore.setUser(response.user);
          }
        }

        this.isLoggedIn = true;

        return response;
      } catch (error) {
        this.isLoggedIn = false;
        this.user = null;
        this.error = {
          shortMessage: 'Ошибка авторизации',
          longMessage:
            error instanceof Error
              ? error.message
              : 'Неизвестная ошибка авторизации',
        };
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Регистрация нового пользователя
     * @param userData - Данные пользователя
     */
    async register(userData: RegisterData) {
      this.loading = true;
      this.error = null;

      try {
        // Сохраняем данные формы напрямую в localStorage и состояние
        this.registrationData = userData;
        console.log(this.registrationData);

        try {
          localStorage.setItem(REGISTRATION_FORM_KEY, JSON.stringify(userData));
          console.log(
            '[AuthStore.register] Данные регистрации сохранены в localStorage'
          );
        } catch (storageError) {
          console.error(
            '[AuthStore.register] Ошибка сохранения в localStorage:',
            storageError
          );
        }

        console.log('[AuthStore.register] Данные формы сохранены:', {
          ...userData,
          password: '***', // Маскируем пароль для логов
        });

        const authService = this.getAuthService();
        const response = await authService.register(userData);

        // Пользователь не существует в базе до момента подтверждения SMS
        // Просто сохраняем предварительные данные из ответа
        this.user = response.user;

        // Не устанавливаем isLoggedIn = true
        // Авторизация будет установлена после верификации SMS в методе verifyPartnerCode

        return response;
      } catch (error) {
        this.error = {
          shortMessage: 'Ошибка регистрации',
          longMessage:
            error instanceof Error
              ? error.message
              : 'Неизвестная ошибка регистрации',
        };
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Сохранение данных регистрации
     * @param data - Данные для регистрации
     */
    saveRegistrationData(data: RegisterData) {
      this.registrationData = data;

      try {
        localStorage.setItem(REGISTRATION_FORM_KEY, JSON.stringify(data));
        console.log('[AuthStore] Данные регистрации сохранены в localStorage');
      } catch (error) {
        console.error(
          '[AuthStore] Ошибка сохранения данных регистрации:',
          error
        );
      }
    },

    /**
     * Получение данных регистрации
     */
    getRegistrationData(): RegisterData | null {
      // Если данные уже есть в хранилище, просто возвращаем их
      if (this.registrationData) {
        return this.registrationData;
      }

      // Если данных нет, пробуем восстановить их из localStorage
      this.restoreRegistrationData();

      // Возвращаем данные (они могли быть восстановлены или остаться null)
      return this.registrationData;
    },

    /**
     * Восстановление данных регистрации из localStorage
     */
    restoreRegistrationData() {
      if (this.registrationData) return; // Уже загружены

      try {
        const storedData = localStorage.getItem(REGISTRATION_FORM_KEY);
        if (storedData) {
          this.registrationData = JSON.parse(storedData);
          console.log(
            '[AuthStore] Данные регистрации восстановлены из localStorage'
          );
        }
      } catch (error) {
        console.error(
          '[AuthStore] Ошибка восстановления данных регистрации:',
          error
        );
      }
    },

    /**
     * Очистка данных регистрации
     */
    clearRegistrationData() {
      this.registrationData = null;

      try {
        localStorage.removeItem(REGISTRATION_FORM_KEY);
        console.log('[AuthStore] Данные регистрации удалены из localStorage');
      } catch (error) {
        console.error('[AuthStore] Ошибка удаления данных регистрации:', error);
      }
    },

    /**
     * Выход из системы
     */
    async logout() {
      if (this.loading) return;
      this.loading = true;
      const globalStore = useGlobalStore();
      try {
        const authService = this.getAuthService();
        if (typeof authService.logout === 'function') {
          await authService.logout();
        }
      } catch (e) {
        console.warn('[AuthStore.logout] error', e);
      } finally {
        this.isLoggedIn = false;
        this.user = null;
        this.error = null;
        globalStore.removeUser();
        this.loading = false;
        try { navigateTo('/auth/authorization'); } catch {}
      }
    },

    /**
     * Проверка авторизации пользователя
     * @returns true, если пользователь авторизован
     */
    checkAuth() {
      const authService = this.getAuthService();
      const isTokenValid =
        typeof authService.isTokenValid === 'function'
          ? authService.isTokenValid()
          : true;

      return this.isLoggedIn && !!this.user && isTokenValid;
    },

    /**
     * Обновление токена авторизации
     * @returns Promise с результатом обновления
     */
    async refreshToken() {
      try {
        this.tokenRefreshing = true;
        const authService = this.getAuthService();

        // Проверяем наличие метода refreshToken в сервисе
        if (typeof authService.refreshToken !== 'function') {
          console.error('Метод refreshToken не найден в AuthService');
          return false;
        }

        const result = await authService.refreshToken();

        if (!result) {
          // Если не удалось обновить токен, выходим из системы
          await this.logout();
        }

        return result;
      } catch (error) {
        console.error('Ошибка при обновлении токена:', error);
        return false;
      } finally {
        this.tokenRefreshing = false;
      }
    },

    /**
     * Сброс состояния после ошибки
     */
    resetError() {
      this.error = null;
    },

    /**
     * Запрос на восстановление пароля
     * @param email - Email пользователя
     */
    async requestPasswordRecovery(email: string) {
      this.loading = true;
      this.error = null;

      try {
        const authService = this.getAuthService();
        const result = await authService.requestPasswordRecovery(email);
        return result;
      } catch (error) {
        this.error = {
          shortMessage: 'Ошибка восстановления пароля',
          longMessage:
            error instanceof Error
              ? error.message
              : 'Неизвестная ошибка запроса восстановления пароля',
        };
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Проверка кода восстановления пароля (устаревший метод)
     * @deprecated Используйте resetPassword с токеном из URL
     */
    async verifyRecoveryCode(email: string, code: string) {
      console.warn(
        'Метод verifyRecoveryCode устарел. Используйте resetPassword с токеном из URL'
      );
      this.loading = true;
      this.error = null;

      try {
        const authService = this.getAuthService();
        return await authService.verifyRecoveryCode(email, code);
      } catch (error) {
        this.error = {
          shortMessage: 'Ошибка проверки кода',
          longMessage:
            error instanceof Error
              ? error.message
              : 'Неизвестная ошибка проверки кода восстановления',
        };
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Установка нового пароля с использованием токена из URL
     * @param token - Токен восстановления из URL
     * @param newPassword - Новый пароль
     */
    async resetPassword(token: string, newPassword: string) {
      this.loading = true;
      this.error = null;

      try {
        const authService = this.getAuthService();
        return await authService.resetPassword(token, newPassword);
      } catch (error) {
        this.error = {
          shortMessage: 'Ошибка сброса пароля',
          longMessage:
            error instanceof Error
              ? error.message
              : 'Неизвестная ошибка установки нового пароля',
        };
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Создает URL для сброса пароля с токеном
     * @param token - Токен восстановления
     */
    getPasswordResetUrl(token: string): string {
      const authService = this.getAuthService();
      return authService.getPasswordResetUrl(token);
    },

    /**
     * Верификация SMS кода для подтверждения аккаунта
     * @param phoneNumber - Номер телефона
     * @param countryCode - Код страны
     * @param verificationCode - Код верификации из SMS
     */
    async verifyPartnerCode(
      phoneNumber: string,
      countryCode: string,
      verificationCode: string
    ) {
      this.loading = true;
      this.error = null;

      try {
        const authService = this.getAuthService();
        const response = await authService.verifyPartnerCode(
          phoneNumber,
          countryCode,
          verificationCode
        );

        // После успешной верификации получаем актуальные данные пользователя
        try {
          const user = await authService.getCurrentUser();

          // Сохраняем данные в auth store
          this.user = user;
          this.isLoggedIn = true;

          // Сохраняем данные в глобальное хранилище
          const globalStore = useGlobalStore();
          globalStore.setUser(user);

          console.log(
            '[AuthStore] Данные пользователя получены после верификации SMS'
          );
        } catch (userError) {
          console.error(
            '[AuthStore] Ошибка получения данных пользователя после верификации:',
            userError
          );
          // Используем данные пользователя из ответа верификации, если не удалось запросить
          this.user = response.user;
          this.isLoggedIn = !!response.user;

          // Сохраняем доступные данные в глобальное хранилище
          if (response.user) {
            const globalStore = useGlobalStore();
            globalStore.setUser(response.user);
          }
        }

        return response;
      } catch (error) {
        this.error = {
          shortMessage: 'Ошибка верификации',
          longMessage:
            error instanceof Error
              ? error.message
              : 'Неизвестная ошибка верификации SMS-кода',
        };
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
