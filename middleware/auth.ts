import { defineNuxtRouteMiddleware } from "nuxt/app";

export default defineNuxtRouteMiddleware(async (to) => {
  // Пропускаем middleware на сервере
  if (import.meta.server) {
    return;
  }

  console.log(`[Auth Middleware] Проверка доступа к роуту: ${to.path}`);

  // Роуты авторизации, которые не требуют проверки
  const publicRoutes = [
    "/auth/authorization",
    "/auth/registration",
    "/auth/password-recovery",
    "/auth/verify-code",
  ];

  // Если это публичный роут, пропускаем проверку
  if (publicRoutes.includes(to.path) || to.path.startsWith("/auth/")) {
    console.log(`[Auth Middleware] Публичный роут, пропускаем проверку`);
    return;
  }

  const globalStore = useGlobalStore();

  // Проверяем наличие токена в куках
  const isAuthenticated = globalStore.isAuthenticated;

  if (!isAuthenticated) {
    console.log(`[Auth Middleware] Токен отсутствует, пробуем обновить`);

    try {
      // Пытаемся обновить токен
      const refreshResponse = await $fetch("/api/auth/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Token-Refresh-Request-From": "middleware",
        },
      });

      console.log(
        `[Auth Middleware] Результат обновления токена:`,
        refreshResponse,
      );

      // Если токен успешно обновлен
      if (refreshResponse?.success) {
        console.log(`[Auth Middleware] Токен успешно обновлен, продолжаем`);
        return;
      } else {
        // Если не удалось обновить токен
        console.log(
          `[Auth Middleware] Не удалось обновить токен, редирект на авторизацию`,
        );

        // Очищаем данные пользователя
        globalStore.removeUser();

        // Перенаправляем на страницу авторизации
        return navigateTo("/auth/authorization");
      }
    } catch (error) {
      console.error(`[Auth Middleware] Ошибка при обновлении токена:`, error);

      // Очищаем данные пользователя
      globalStore.removeUser();

      // Перенаправляем на страницу авторизации
      return navigateTo("/auth/authorization");
    }
  }

  console.log(`[Auth Middleware] Пользователь авторизован, доступ разрешен`);
}); 