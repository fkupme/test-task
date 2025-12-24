import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app'
import { useGlobalStore } from '../stores/global'

export default defineNuxtRouteMiddleware(async (to, from) => {
	// Пропускаем middleware на сервере для избежания дублирования
	if (import.meta.server) {
		return;
	}

	console.log(`[Global Auth Middleware] Проверка доступа к роуту: ${to.path}`);

	// Роуты авторизации и публичные роуты, которые не требуют проверки
	const publicRoutes = [
		'/auth/authorization',
		'/auth/registration',
		'/auth/password-recovery',
		'/auth/verify-code',
		'/auth/partner-registration',
	];

	// Если это публичный роут или начинается с /auth/, пропускаем проверку
	if (publicRoutes.includes(to.path) || to.path.startsWith('/auth/')) {
		console.log(`[Global Auth Middleware] Публичный роут, пропускаем проверку`);
		return;
	}

	const globalStore = useGlobalStore();

	// Проверяем наличие токена в куках
	const isAuthenticated = globalStore.isAuthenticated;

	if (!isAuthenticated) {
		console.log(
			`[Global Auth Middleware] Токен отсутствует или истек, пробуем обновить`
		);
		try {
			// Пытаемся обновить токен через API
			const refreshResponse = await $fetch('/api/auth/refresh-token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Token-Refresh-Request-From': 'global-middleware',
				},
			});

			console.log(
				`[Global Auth Middleware] Результат обновления токена:`,
				refreshResponse
			);

			// Если токен успешно обновлен
			if (refreshResponse?.success) {
				console.log(
					`[Global Auth Middleware] Токен успешно обновлен, продолжаем навигацию`
				);
				return;
			} else {
				// Если не удалось обновить токен - перенаправляем на авторизацию
				console.log(
					`[Global Auth Middleware] Не удалось обновить токен, перенаправляем на авторизацию`
				);
				globalStore.removeUser();
				return navigateTo('/auth/authorization');
			}
		} catch (error: any) {
			console.error(
				`[Global Auth Middleware] Ошибка при обновлении токена:`,
				error
			);
			globalStore.removeUser();
			return navigateTo('/auth/authorization');
		}
	}

	console.log(
		`[Global Auth Middleware] Пользователь авторизован, доступ разрешен к ${to.path}`
	);
});