/**
 * Абстрактный класс для всех API сервисов
 * Обеспечивает базовую функциональность для работы с API Gateway
 */

import type { ApiGatewayClient } from "@/types/api";
import { ApiError } from "@/types/api";

/**
 * Абстрактный базовый класс для всех API сервисов
 */
export abstract class AbstractApiService {
  /**
   * @param apiGateway - Клиент для работы с API Gateway
   */
  constructor(protected apiGateway: ApiGatewayClient) {}

  /**
   * Отправка запроса к API Gateway
   * @param method - Метод API
   * @param body - Тело запроса
   * @param serviceName - Имя сервиса (опционально, если не указано берется из getServiceName())
   * @returns - Результат запроса
   * @throws - ApiError в случае ошибки
   */
  protected async sendRequest<T = any>(
    method: string,
    body?: any,
    serviceName?: string,
  ): Promise<T> {
    // Получаем имя сервиса из параметра или из наследника
    const service = serviceName || this.getServiceName();

    // Отправляем запрос через API Gateway
    const response = await this.apiGateway.sendRequest({
      service,
      method,
      requestBody: body || {},
    });

    // Проверяем наличие ошибки
    if (response.error) {
      // Нормализуем ошибку для создания ApiError
      let errorData = response.error;

      // Если ошибка - это строка, преобразуем в объект
      if (typeof errorData === "string") {
        errorData = {
          message: errorData,
          code: -1,
        };
      }

      // Если ошибка - объект, но нет message, добавляем дефолтное сообщение
      if (typeof errorData === "object" && !errorData.message) {
        errorData = {
          ...errorData,
          message:
            errorData.message || "Произошла ошибка при выполнении запроса",
          code: errorData.code || -1,
        };
      }

      throw new ApiError(errorData);
    }

    // Возвращаем тело ответа
    return response.responseBody as T;
  }

  /**
   * Абстрактный метод, который должен быть реализован наследниками
   * @returns - Имя сервиса в API Gateway
   */
  protected abstract getServiceName(): string;
}
