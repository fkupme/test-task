/**
 * Типы для работы с API Gateway через REST API
 */

// Базовый интерфейс для запроса к API Gateway
export interface ApiGatewayRequest {
  service: string;
  method: string;
  requestBody: Record<string, unknown> | string;
}

// Интерфейс для ответа от API Gateway
export interface ApiGatewayResponse {
  responseBody?: Record<string, unknown> | null;
  error?: ApiError | null;
}

// Интерфейс для ошибки
export interface ApiError {
  code: string | number;
  message: string;
  details?: unknown;
}

// Интерфейсы для аутентификации
export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface FieldUniqueRequest {
  email?: string;
  phone?: string;
}

export interface PasswordRecoveryRequest {
  email?: string;
  phone?: string;
}

// Тип данных пользователя
export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  token?: string;
  role?: string;

  // Дополнительные поля для API интеграции
  tariffId?: string;
  createdAt?: string;

  // Массив ролей
  roles?: Array<{
    id: string;
    name: string;
    permissions?: Array<{
      id: string;
      name: string;
    }>;
  }>;

  // Оригинальные данные с API
  _originalData?: Record<string, any>;

  // Другие возможные поля
  [key: string]: any;
}

// Тип интерфейса API Gateway клиента
export interface ApiGatewayClient {
  sendRequest: (request: ApiGatewayRequest) => Promise<ApiGatewayResponse>;
  getAuthToken: () => string | null;
  setAuthToken: (token: string | null) => void;
  onUnauthorized: (handler: () => Promise<boolean>) => void;
}

// После генерации кода из proto-файлов, здесь будут добавлены
// автоматически сгенерированные типы
