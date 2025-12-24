/**
 * Типы для сервиса авторизации
 */
import type { User } from "../api.gateway";

/**
 * Интерфейс для ответа авторизации
 */
export interface AuthResponse {
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  user: User;
}

/**
 * Интерфейс для данных входа
 */
export interface LoginCredentials {
  email?: string;
  phone?: string;
  password: string;
}

/**
 * Интерфейс для данных регистрации
 */
export interface RegisterData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password: string;
  confirmPassword?: string;
  acceptTerms?: boolean;
  phoneNumber?: string;
  countryCode?: string;
  locale?: string;
}

/**
 * Интерфейс для проверки уникальности поля
 */
export interface FieldUniqueRequest {
  email?: string;
  phone?: string;
}

/**
 * Интерфейс для восстановления пароля
 */
export interface PasswordRecoveryRequest {
  email?: string;
  phone?: string;
} 