// Убираем ненужный импорт
// import { ConnectError } from '@connectrpc/connect';

// Импорт типов
import type { UnauthorizedHandler } from "@/types/api";
import { createLogger } from '@/utils/logger';
const apiLogger = createLogger('API', { domainColor: '#1f618d', scopeColors: { Request:'#8e44ad', Response:'#16a085', Token:'#d35400', Error:'#c0392b' }});
import type {
  ApiGatewayRequest as IApiRequest,
  ApiGatewayResponse as IApiResponse,
} from "~/types/api.gateway";

export default defineNuxtPlugin((_nuxtApp) => {
  // Конфигурация API
  const config = useRuntimeConfig();
  const gatewayUrl = config.public.apiGatewayUrl; // URL API Gateway на сервере
  const proxyUrl = "/api/proxy"; // URL прокси-эндпоинта в нашем приложении

  // Токен авторизации - получаем из куки
  let authToken = "";

  // Функция для получения токена из куки
  const getTokenFromCookie = (): string => {
    if (import.meta.server) return ""; // На сервере не используем куки

    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith("token=")) {
        return cookie.substring("token=".length);
      }
    }
    return "";
  };

  // Инициализация токена при загрузке плагина
  if (import.meta.client) {
    authToken = getTokenFromCookie();
  }

  apiLogger.log('Init', 'gateway urls', { gatewayUrl, proxyUrl });

  // Массив обработчиков неавторизованного доступа
  const unauthorizedHandlers: UnauthorizedHandler[] = [];

  // Функция для получения токена авторизации
  const getAuthToken = (): string | null => {
    // Обновляем из куки при каждом вызове на клиенте
    if (import.meta.client) {
      authToken = getTokenFromCookie();
    }
    return authToken || null;
  };

  // Функция для обновления токена авторизации
  const setAuthToken = (token: string | null): void => {
    authToken = token || "";
  apiLogger.log('Token', 'updated');
  };

  // Регистрация обработчика неавторизованного доступа
  const onUnauthorized = (handler: UnauthorizedHandler): void => {
    unauthorizedHandlers.push(handler);
  };

  // Функция для отправки запросов через API Gateway
  const sendRequest = async (request: IApiRequest): Promise<IApiResponse> => {
    try {
  apiLogger.log('Request', `${request.service}.${request.method}`, request.requestBody || {});

      // Получаем токен непосредственно перед запросом
      const currentToken = getAuthToken();

      // Подготовка requestBody
      let bodyJson = {};
      if (request.requestBody) {
        if (typeof request.requestBody === "string") {
          try {
            bodyJson = JSON.parse(request.requestBody);
          } catch (e) {
            bodyJson = { Body: request.requestBody };
          }
        } else {
          bodyJson = request.requestBody;
        }
      }

      // Отправляем запрос через прокси-сервер
      const response = await fetch(proxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: currentToken ? `Bearer ${currentToken}` : "",
        },
        body: JSON.stringify({
          service: request.service,
          method: request.method,
          requestBody: bodyJson,
        }),
      });

      // Если получили 401, пробуем обновить токен
      if (response.status === 401) {
        // Вызываем все обработчики неавторизованного доступа
        for (const handler of unauthorizedHandlers) {
          // Если обработчик успешно обработал ошибку, повторяем запрос
          const success = await handler();
          if (success) {
            return sendRequest(request);
          }
        }

        // Если не удалось обработать, возвращаем ошибку
        throw new Error("Unauthorized");
      }

      // Проверяем тип контента, чтобы знать как обрабатывать ответ
      const contentType = response.headers.get("Content-Type");

      // Если это не JSON, обрабатываем как текст для лучшей отладки
      if (contentType && !contentType.includes("application/json")) {
        const textResponse = await response.text();
        apiLogger.error('Response', 'non-json', textResponse);
        throw new Error(
          `Сервер вернул не JSON ответ: ${textResponse}...`,
        );
      }

      let responseData;
      try {
        responseData = await response.json();
      } catch (error) {
        // Если не удалось распарсить JSON, пробуем прочитать как текст
        const textResponse = await response.text();
        apiLogger.error('Response', 'invalid json', textResponse.slice(0,300));
        throw new Error(
          `Некорректный JSON в ответе: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      apiLogger.log('Response', `${request.service}.${request.method}`, responseData);

      // Обрабатываем ответ
      if (!response.ok) {
        throw new Error(
          `Ошибка при запросе: ${response.status} ${response.statusText}`,
        );
      }

      // Проверяем наличие поля success в ответе и используем его для определения успешности
      if (responseData.success === false) {
        return {
          responseBody: null,
          error: {
            code: response.status,
            message:
              responseData.message ||
              responseData.error ||
              "Неизвестная ошибка",
          },
        };
      }

      // Успешный ответ
      return {
        responseBody: responseData.responseBody || {},
        error: null,
      };
    } catch (error) {
  apiLogger.error('Error', `${request.service}.${request.method}`, error);

      // Обработка ошибок
      return {
        responseBody: null,
        error: {
          code: (error as any)?.code || "UNKNOWN",
          message: error instanceof Error ? error.message : String(error),
          details: (error as any)?.details,
        },
      };
    }
  };

  // Возвращаем API Gateway клиент
  return {
    provide: {
      apiGateway: {
        sendRequest,
        setAuthToken,
        getAuthToken,
        onUnauthorized,
      },
    },
  };
});
