/**
 * Сервис для работы с авторизацией
 * Использует серверные эндпоинты вместо прямых запросов к API Gateway
 */

import type { User } from "~/types/api.gateway";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
} from "~/types/services/auth";
import { AbstractApiService } from "./AbstractApiService";

/**
 * Сервис для работы с авторизацией
 */
export class AuthService extends AbstractApiService {
  /**
   * Получение имени сервиса для API Gateway
   */
  protected getServiceName(): string {
    return "auth";
  }

  /**
   * Авторизация пользователя
   * @param credentials - Учетные данные
   * @returns - Данные пользователя
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Валидация входных данных
    if (!credentials.email && !credentials.phone) {
      throw new Error("Необходимо указать email или телефон");
    }

    if (!credentials.password) {
      throw new Error("Необходимо указать пароль");
    }

    try {
      // Подготавливаем строго нужные данные и больше ничего
      const loginData = {
        fullPhoneNumber: credentials.phone || "",
        email: credentials.email || "",
        password: credentials.password,
      };

      // Используем метод fetch для запроса к /api/auth/login
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Ошибка авторизации");
      }

      return {
        user: data.user,
        // Токен не возвращается, он сохранен в httpOnly cookie на сервере
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Ошибка авторизации",
      );
    }
  }

  /**
   * Регистрация нового пользователя
   * @param userData - Данные пользователя
   * @returns - Данные пользователя
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    // Используем специальный эндпоинт для регистрации
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Ошибка регистрации");
    }

    return {
      user: data.user,
      // Токен не возвращается, он сохранен в httpOnly cookie
    };
  }

  /**
   * Выход из системы
   */
  async logout(): Promise<void> {
    // Используем специальный эндпоинт для выхода
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!data.success) {
    }
  }

  /**
   * Проверка уникальности email
   * @param email - Email для проверки
   * @returns - true если email уникален, false если уже занят
   */
  async isEmailUnique(email: string): Promise<boolean> {
    if (!email) {
      throw new Error("Email не указан");
    }

    // Используем новый сервис IdentityService
    const response = await this.sendRequest<{ response: string }>(
      "IsEmailUnique",
      { Email: email },
      "IdentityService",
    );

    // Проверяем структуру ответа - в API может быть response: "true" или unique: true
    if (response.response !== undefined) {
      // Преобразуем строку "true" в булево значение true
      return response.response === "true";
    } else if ((response as any).unique !== undefined) {
      return (response as any).unique;
    }

    // По умолчанию считаем, что email уникален, чтобы не блокировать форму
    return true;
  }

  /**
   * Проверка уникальности телефона
   * @param phoneNumber - Номер телефона (только цифры)
   * @param countryCode - Код страны (например, "+7")
   * @returns - true если телефон уникален, false если уже занят
   */
  async isPhoneUnique(
    phoneNumber: string,
    countryCode: string,
  ): Promise<boolean> {
    if (!phoneNumber) {
      throw new Error("Номер телефона не указан");
    }

    if (!countryCode) {
      throw new Error("Код страны не указан");
    }

    // Очищаем от форматирования (только цифры)
    const digitsOnly = phoneNumber.replace(/\D/g, "");

    // Используем новый сервис IdentityService
    const response = await this.sendRequest<{ response: string }>(
      "IsPhoneUnique",
      { PhoneNumber: digitsOnly, countryCode },
      "IdentityService",
    );

    // Проверяем структуру ответа - в API может быть response: "true" или unique: true
    if (response.response !== undefined) {
      // Преобразуем строку "true" в булево значение true
      return response.response === "true";
    } else if ((response as any).unique !== undefined) {
      return (response as any).unique;
    }

    // По умолчанию считаем, что телефон уникален, чтобы не блокировать форму
    return true;
  }

  /**
   * Запрос на восстановление пароля
   * @param email - Email пользователя
   * @returns - Результат операции
   */
  async requestPasswordRecovery(
    email: string,
  ): Promise<{ success: boolean; message?: string }> {
    // Валидация входных данных
    if (!email) {
      throw new Error("Необходимо указать email");
    }

    try {
      // Используем новый эндпоинт для восстановления пароля
      const response = await fetch("/api/auth/password-recovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Ошибка восстановления пароля");
      }

      return {
        success: true,
        message:
          data.message ||
          "На указанный email отправлена ссылка для восстановления пароля",
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Ошибка восстановления пароля",
      );
    }
  }

  /**
   * Установка нового пароля по токену
   * @param token - Токен восстановления (из URL)
   * @param newPassword - Новый пароль
   * @returns - Результат операции
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean; message?: string }> {
    // Валидация входных данных
    if (!token || !newPassword) {
      throw new Error("Необходимо указать токен и новый пароль");
    }

    try {
      // Используем новый эндпоинт для сброса пароля
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Ошибка сброса пароля");
      }

      return {
        success: true,
        message: data.message || "Пароль успешно изменен",
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Ошибка сброса пароля",
      );
    }
  }

  /**
   * Создает URL для сброса пароля с токеном
   * @param token - Токен восстановления пароля
   * @returns - URL с закодированным токеном
   */
  getPasswordResetUrl(token: string): string {
    // Кодируем токен, чтобы избежать проблем с URL (особенно если токен содержит слеш)
    const encodedToken = encodeURIComponent(token);
    return `/auth/password-recovery/${encodedToken}`;
  }

  /**
   * Устаревший метод проверки кода восстановления пароля
   * @deprecated Используйте resetPassword с токеном из URL
   */
  async verifyRecoveryCode(
    email: string,
    code: string,
  ): Promise<{ success: boolean }> {
    if (!email || !code) {
      throw new Error("Необходимо указать email и код");
    }

    return { success: false };
  }

  /**
   * Проверка валидности токена авторизации
   * @returns - true если токен валиден, false в противном случае
   */
  isTokenValid(): boolean {
    // В реальной реализации мы бы проверяли токен из cookie или localStorage
    // Например, можно проверить срок действия токена, если он хранится в JWT формате

    // Получаем куки с токеном (на клиенте)
    if (import.meta.client) {
      const cookies = document.cookie.split(";");
      const authCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("auth_token="),
      );

      // Если куки нет, токен невалиден
      if (!authCookie) {
        return false;
      }

      // Здесь можно дополнительно проверить срок действия JWT токена
      // Но для простой реализации просто проверяем наличие
      return true;
    }

    // На сервере возвращаем true, так как проверка должна выполняться на клиенте
    return true;
  }

  /**
   * Получение текущего пользователя
   * @returns - Данные пользователя
   */
  async getCurrentUser(): Promise<User> {
    // Используем эндпоинт для получения текущего пользователя
    const response = await fetch("/api/auth/account", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Ошибка получения данных пользователя");
    }

    return data.user;
  }

  /**
   * Обновление токена авторизации с использованием refresh токена
   * @returns Результат операции обновления токена
   */
  async refreshToken(): Promise<{ success: boolean }> {
    try {
      // Используем специальный эндпоинт для обновления токена
      const response = await fetch("/api/auth/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Добавляем заголовок, указывающий, что запрос на обновление идет с клиента
          "X-Token-Refresh-Request-From": "client",
        },
      });

      // Проверяем наличие заголовков обновления токена
      const tokenRefreshed = response.headers.get("X-Token-Refreshed");
      const refreshedAt = response.headers.get("X-Token-Refreshed-At");

      if (tokenRefreshed === "true") {
      }

      const data = await response.json();

      if (!data.success) {
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      return { success: false };
    }
  }

  /**
   * Верификация SMS кода для подтверждения аккаунта
   * @param phoneNumber - Номер телефона
   * @param countryCode - Код страны (например "+7")
   * @param verificationCode - Код верификации из SMS
   * @returns - Результат операции с данными пользователя
   */
  async verifyPartnerCode(
    phoneNumber: string,
    countryCode: string,
    verificationCode: string,
  ): Promise<AuthResponse> {
    if (!phoneNumber || !countryCode || !verificationCode) {
      throw new Error(
        "Необходимо указать номер телефона, код страны и код верификации",
      );
    }

    try {
      const response = await fetch("/api/auth/verify-partner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          countryCode,
          verificationCode,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Ошибка верификации SMS-кода");
      }

      return {
        user: data.user,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Ошибка верификации SMS-кода",
      );
    }
  }
} 