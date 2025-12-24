/// <reference types="nuxt" />
import {
  ApiGatewayRequest,
  ApiGatewayResponse,
} from "../generated/proto/apigateway_pb";
import { Struct } from "@bufbuild/protobuf";
import { defineEventHandler, getCookie, getRequestURL, readBody } from "h3";
import { useRuntimeConfig } from '#imports'

/**
 * Серверный обработчик для прокси-запросов к API Gateway
 * Принимает POST-запросы и проксирует их на целевой сервер через gRPC Connect протокол
 */
export default defineEventHandler(async (event) => {
  // Базовый URL API Gateway: runtimeConfig.public.apiGatewayUrl -> env -> дефолт
  const config = useRuntimeConfig();
  const baseUrl = (config?.public?.apiGatewayUrl as string) || process.env.API_GATEWAY_URL || 'https://dev5.musbooking.com/apigateway';

  // Полный URL для отправки gRPC запроса
  const targetUrl = `${baseUrl}/apigateway.GatewayService/SendApiGatewayRequest`;

  // Получаем информацию о запросе
  const requestUrl = getRequestURL(event);
  const requestId =
    Date.now().toString() + Math.random().toString(36).substring(2, 10);

  console.log(`[Server][RequestID:${requestId}] ====== НАЧАЛО ЗАПРОСА ======`);
  console.log(
    `[Server][RequestID:${requestId}] Входящий запрос: ${event.method} ${requestUrl.pathname}`,
  );
  console.log(
    `[Server][RequestID:${requestId}] Полный URL: ${requestUrl.toString()}`,
  );
  console.log(
    `[Server][RequestID:${requestId}] Цель проксирования: ${targetUrl}`,
  );

  try {
    // Читаем тело запроса
    const requestData = await readBody(event);
    console.log(
      `[Server][RequestID:${requestId}] Заголовки запроса:`,
      JSON.stringify(event.headers, null, 2),
    );
    console.log(
      `[Server][RequestID:${requestId}] Тело запроса:`,
      JSON.stringify(requestData, null, 2),
    );

    console.log(
      `[Server][RequestID:${requestId}] Отправка запроса к API Gateway...`,
    );
    const startTime = Date.now();

    // Собираем заголовки для проксирования
    const proxyHeaders: Record<string, string> = {
      "Content-Type": "application/grpc",
      Accept: "application/grpc",
      "User-Agent": "MUSbooking-Personal-Account-Proxy/1.0",
      "Connect-Protocol-Version": "1",
    };

    // Добавляем заголовок авторизации, если он есть
    const authHeader = event.headers.get("authorization");

    if (authHeader) {
      console.log(
        `[Server][RequestID:${requestId}] Получен заголовок авторизации, передаем его дальше`,
      );
      proxyHeaders["Authorization"] = authHeader;
    } else if (requestData.token) {
      // Для обратной совместимости - если токен передан в теле запроса
      console.log(
        `[Server][RequestID:${requestId}] Токен передан в теле запроса`,
      );
      proxyHeaders["Authorization"] = `Bearer ${requestData.token}`;
    } else {
      // Проверяем наличие cookie с токеном
      const cookieHeader = event.node.req.headers.cookie;
      if (cookieHeader) {
        const cookies = cookieHeader.split(";").reduce(
          (acc, cookie) => {
            const [key, value] = cookie.trim().split("=");
            acc[key] = value;
            return acc;
          },
          {} as Record<string, string>,
        );

        if (cookies.auth_token) {
          console.log(`[Server][RequestID:${requestId}] Токен найден в cookie`);
          proxyHeaders["Authorization"] = `Bearer ${cookies.auth_token}`;
        } else {
          console.log(
            `[Server][RequestID:${requestId}] Токен не найден в cookie`,
          );
        }
      } else {
        console.log(`[Server][RequestID:${requestId}] Cookie не найдены`);
      }
    }

    // Проверяем нужен ли токен для этого запроса
    const noAuthRequired = [
      "IsEmailUnique",
      "IsPhoneUnique",
      "RegistrationPartner",
      "VerifyCodePartner",
    ].includes(requestData.method);

    if (!proxyHeaders["Authorization"] && !noAuthRequired) {
      console.log(
        `[Server][RequestID:${requestId}] ⚠️ Запрос без авторизации для метода, требующего авторизации`,
      );
    } else if (noAuthRequired) {
      console.log(
        `[Server][RequestID:${requestId}] Метод не требует авторизации: ${requestData.method}`,
      );
      // Устанавливаем пустой заголовок авторизации для методов, не требующих авторизации
      // Это решает проблему с NullReferenceException на сервере
      if (!proxyHeaders["Authorization"]) {
        proxyHeaders["Authorization"] = "";
        console.log(
          `[Server][RequestID:${requestId}] Установлен пустой заголовок авторизации`,
        );
      }
    }

    // Логируем заголовки запроса
    console.log(
      `[Server][RequestID:${requestId}] Заголовки запроса к API Gateway:`,
      JSON.stringify(proxyHeaders, null, 2),
    );

    let requestBody;

    // Проверяем, имеет ли запрос структуру полей с учетом AccountId
    if (
      requestData.requestBody &&
      typeof requestData.requestBody === "object" &&
      requestData.requestBody.fields &&
      requestData.requestBody.fields.Body &&
      requestData.requestBody.fields.Body.string_value
    ) {
      console.log(
        `[Server][RequestID:${requestId}] Обнаружена структура с полями fields.Body.string_value, преобразуем в Struct`,
      );

      // Создаем JSON-объект из структуры fields
      const structFields: Record<string, any> = {};

      // Добавляем Body
      if (
        requestData.requestBody.fields.Body &&
        requestData.requestBody.fields.Body.string_value
      ) {
        structFields.Body = requestData.requestBody.fields.Body.string_value;
      }

      // Добавляем AccountId, если он есть
      if (
        requestData.requestBody.fields.AccountId &&
        requestData.requestBody.fields.AccountId.string_value
      ) {
        structFields.AccountId =
          requestData.requestBody.fields.AccountId.string_value;
      }

      // Создаем Struct из полей
      requestBody = Struct.fromJson(structFields);

      console.log(
        `[Server][RequestID:${requestId}] Преобразованная структура:`,
        structFields,
      );
    } else {
      // Используем напрямую requestBody если он есть
      let bodyContent = {};

      if (requestData.requestBody) {
        if (typeof requestData.requestBody === "object") {
          bodyContent = requestData.requestBody;
        } else if (typeof requestData.requestBody === "string") {
          try {
            bodyContent = JSON.parse(requestData.requestBody);
          } catch (e) {
            bodyContent = { rawData: requestData.requestBody };
          }
        }
      }

      // Проверка на вложенное поле Body (для обратной совместимости)
      if (requestData.requestBody?.Body) {
        // Если Body - строка, пробуем распарсить как JSON
        if (typeof requestData.requestBody.Body === "string") {
          try {
            bodyContent = JSON.parse(requestData.requestBody.Body);
          } catch (e) {
            // Если не удалось распарсить, используем как есть
            bodyContent = requestData.requestBody.Body;
          }
        }
        // Если Body - объект, проверяем на двойную вложенность
        else if (typeof requestData.requestBody.Body === "object") {
          // Проверяем на вложенное поле Body
          if (requestData.requestBody.Body.Body) {
            // Если вложенный Body - строка, пробуем распарсить
            if (typeof requestData.requestBody.Body.Body === "string") {
              try {
                bodyContent = JSON.parse(requestData.requestBody.Body.Body);
              } catch (e) {
                bodyContent = requestData.requestBody.Body.Body;
              }
            } else {
              bodyContent = requestData.requestBody.Body.Body;
            }
          } else {
            bodyContent = requestData.requestBody.Body;
          }
        }
      }

      // Логируем обработанное содержимое Body и добавляем идентификатор запроса
      console.log(
        `[Server][RequestID:${requestId}] Нормализованное содержимое Body:`,
        JSON.stringify(bodyContent, null, 2),
      );

      // Преобразуем объект в JSON-строку, так как сервер ожидает строку, а не объект
      const bodyContentJson =
        typeof bodyContent === "string"
          ? bodyContent
          : JSON.stringify(bodyContent);

      console.log(
        `[Server][RequestID:${requestId}] Body в формате JSON-строки:`,
        bodyContentJson,
      );

      // Создаем protobuf структуру для запроса
      requestBody = Struct.fromJson({
        Body: bodyContentJson, // Отправляем как строку
      });
    }

    // Создаем сообщение в формате protobuf
    const message = new ApiGatewayRequest({
      service: requestData.service,
      method: requestData.method,
      requestBody: requestBody,
    });

    // Получаем бинарные данные
    const binaryMessage = message.toBinary();

    // Создаем gRPC заголовок (5 байт)
    const header = new Uint8Array(5);
    header[0] = 0; // Флаг сжатия (0 = без сжатия)

    // Длина сообщения (4 байта)
    const messageLength = binaryMessage.length;
    header[1] = (messageLength >> 24) & 0xff;
    header[2] = (messageLength >> 16) & 0xff;
    header[3] = (messageLength >> 8) & 0xff;
    header[4] = messageLength & 0xff;

    // Объединяем заголовок и сообщение
    const finalMessage = new Uint8Array(5 + messageLength);
    finalMessage.set(header);
    finalMessage.set(binaryMessage, 5);

    // Выполняем запрос к внешнему API
    let response = await fetch(targetUrl, {
      method: "POST",
      headers: proxyHeaders,
      body: finalMessage,
    });

    const endTime = Date.now();
    console.log(
      `[Server][RequestID:${requestId}] Запрос выполнен за ${endTime - startTime}ms`,
    );
    console.log(
      `[Server][RequestID:${requestId}] Статус ответа: ${response.status} ${response.statusText}`,
    );
    const headersRecord: Record<string, string> = {};
    response.headers.forEach((value: string, key: string) => {
      headersRecord[key] = value;
    });
    console.log(
      `[Server][RequestID:${requestId}] Заголовки ответа:`,
      JSON.stringify(headersRecord, null, 2),
    );

    // Проверяем на ошибку авторизации и пробуем обновить токен
    if (response.status === 401 && !requestData.skipTokenRefresh) {
      console.log(
        `[Server][RequestID:${requestId}] Получена ошибка авторизации 401, пробуем обновить токен...`,
      );

      const refreshToken = getCookie(event, "refresh_token");

      if (refreshToken) {
        try {
          // Вызываем API для обновления токена
          const currentRequestUrl = getRequestURL(event);
          const refreshUrl = `${currentRequestUrl.protocol}//${currentRequestUrl.host}/api/auth/refresh-token`;

          console.log(
            `[Server][RequestID:${requestId}] Вызов API обновления токена по URL: ${refreshUrl}`,
          );

          const headersForRefresh: Record<string, string> = {
            "Content-Type": "application/json",
            "X-Token-Refresh-Request-From": "proxy",
          };

          // Собираем куки для передачи
          let cookiesForRefresh = "";
          if (refreshToken) {
            cookiesForRefresh += `refresh_token=${refreshToken}`;
          }

          // Получаем оригинальный auth_token из кук текущего события (event)
          const originalAuthToken = getCookie(event, "auth_token");
          if (originalAuthToken) {
            if (cookiesForRefresh) {
              cookiesForRefresh += "; "; // Добавляем разделитель, если refresh_token уже есть
            }
            cookiesForRefresh += `auth_token=${originalAuthToken}`;
            console.log(
              `[Server][RequestID:${requestId}] Добавляем originalAuthToken в Cookie для запроса на refresh: ${originalAuthToken ? "***" : "не найден"}`,
            );
          }

          if (cookiesForRefresh) {
            headersForRefresh["Cookie"] = cookiesForRefresh;
          }
          console.log(
            `[Server][RequestID:${requestId}] Заголовки для запроса на refresh-token:`,
            headersForRefresh,
          );

          const refreshResponse = await fetch(refreshUrl, {
            method: "POST",
            headers: headersForRefresh,
          });

          if (refreshResponse.ok) {
            const refreshResult = await refreshResponse.json();

            if (refreshResult.success && refreshResult.accessToken) {
              console.log(
                `[Server][RequestID:${requestId}] Токен успешно обновлен, повторяем исходный запрос`,
              );

              // Используем новый токен из ответа refresh-token эндпоинта
              const newToken = refreshResult.accessToken;

              // Обновляем заголовок авторизации
              proxyHeaders["Authorization"] = `Bearer ${newToken}`;

              // Повторяем исходный запрос с новым токеном
              console.log(
                `[Server][RequestID:${requestId}] Повторная отправка запроса с новым токеном...`,
              );

              // Повторно отправляем запрос
              response = await fetch(targetUrl, {
                method: "POST",
                headers: proxyHeaders,
                body: finalMessage,
              });

              console.log(
                `[Server][RequestID:${requestId}] Статус повторного запроса: ${response.status}`,
              );

              // Пересылаем заголовки, установленные refresh-token эндпоинтом, клиенту
              // Они содержат информацию об обновлении токена
              refreshResponse.headers.forEach((value, key) => {
                if (
                  key.toLowerCase().startsWith("x-token-") ||
                  key.toLowerCase() === "set-cookie"
                ) {
                  event.node.res.setHeader(key, value);
                  console.log(
                    `[Server][RequestID:${requestId}] Пересылаем заголовок ${key}: ${value}`,
                  );
                }
              });

              // Дополнительная проверка для Set-Cookie заголовков
              const setCookieHeaders =
                refreshResponse.headers.get("set-cookie");
              if (setCookieHeaders) {
                console.log(
                  `[Server][RequestID:${requestId}] Найдены Set-Cookie заголовки: ${setCookieHeaders}`,
                );
                // Устанавливаем каждый Set-Cookie заголовок отдельно
                if (Array.isArray(setCookieHeaders)) {
                  setCookieHeaders.forEach((cookie, index) => {
                    event.node.res.setHeader("Set-Cookie", cookie);
                    console.log(
                      `[Server][RequestID:${requestId}] Установлен Set-Cookie[${index}]: ${cookie}`,
                    );
                  });
                } else {
                  event.node.res.setHeader("Set-Cookie", setCookieHeaders);
                  console.log(
                    `[Server][RequestID:${requestId}] Установлен единичный Set-Cookie: ${setCookieHeaders}`,
                  );
                }
              } else {
                console.log(
                  `[Server][RequestID:${requestId}] ⚠️ Set-Cookie заголовки НЕ найдены в ответе refresh endpoint!`,
                );
              }

              // Устанавливаем заголовки, сообщающие клиенту, что токен был обновлен сервером
              event.node.res.setHeader("X-Token-Refreshed", "true");
              event.node.res.setHeader("X-Token-Refreshed-By", "server");
              event.node.res.setHeader(
                "X-Token-Refreshed-At",
                new Date().toISOString(),
              );
              console.log(
                `[Server][RequestID:${requestId}] Установлены заголовки о обновлении токена`,
              );
            } else {
              console.log(
                `[Server][RequestID:${requestId}] Новый токен не был получен от эндпоинта обновления или в ответе нет accessToken.`,
              );

              // Возвращаем ответ, который будет обрабатываться на клиенте для редиректа на логин
              return {
                success: false,
                httpStatus: 401,
                error: "auth_required",
                message: "Сессия истекла, требуется повторная авторизация",
                redirectTo: "/auth/login",
              };
            }
          } else {
            console.log(
              `[Server][RequestID:${requestId}] Не удалось выполнить запрос на обновление токена (${refreshResponse.status}). Требуется повторная авторизация.`,
            );

            return {
              success: false,
              httpStatus: 401,
              error: "auth_required",
              message: "Требуется повторная авторизация",
              redirectTo: "/auth/login",
            };
          }
        } catch (refreshError) {
          console.error(
            `[Server][RequestID:${requestId}] Ошибка при обновлении токена:`,
            refreshError,
          );
        }
      } else {
        console.log(
          `[Server][RequestID:${requestId}] RefreshToken отсутствует, невозможно обновить токен`,
        );
      }
    }

    // Проверяем HTTP-статус
    if (!response.ok) {
      console.error(
        `[Server][RequestID:${requestId}] HTTP ошибка: ${response.status} ${response.statusText}`,
      );

      // Создаем базовую структуру ответа с ошибкой
      const errorResponse: {
        success: boolean;
        httpStatus: number;
        message?: string;
        error?: string;
        [key: string]: any;
      } = {
        success: false,
        httpStatus: response.status,
      };

      try {
        // Пытаемся получить тело ответа
        const errorBody = await response.text();
        if (errorBody) {
          try {
            // Если это JSON, используем его как основу ответа
            const parsedError = JSON.parse(errorBody);
            // Объединяем с базовыми полями
            Object.assign(errorResponse, parsedError);
          } catch {
            // Если не JSON, сохраняем как сообщение об ошибке
            errorResponse.message = errorBody;
          }
        } else {
          // Если тело пустое, используем стандартное сообщение
          errorResponse.message = response.statusText;
        }
      } catch (e) {
        // В случае ошибки при чтении тела
        errorResponse.message = response.statusText;
        errorResponse.error = "Ошибка при получении деталей";
      }

      console.log(
        `[Server][RequestID:${requestId}] Возвращаем ответ с ошибкой:`,
        errorResponse,
      );
      console.log(
        `[Server][RequestID:${requestId}] ====== КОНЕЦ ЗАПРОСА (ОШИБКА) ======`,
      );
      return errorResponse;
    }

    // Проверяем статус gRPC
    const grpcStatus = response.headers.get("grpc-status");
    const grpcMessage = response.headers.get("grpc-message");

    if (grpcStatus && grpcStatus !== "0") {
      console.error(
        `[Server][RequestID:${requestId}] gRPC ошибка: ${grpcStatus} - ${grpcMessage}`,
      );
      return {
        success: false,
        error: "gRPC ошибка",
        message: grpcMessage || "Неизвестная ошибка gRPC",
        grpcStatus,
      };
    }

    // Получаем данные ответа
    const responseBuffer = await response.arrayBuffer();
    const responseArray = new Uint8Array(responseBuffer);

    // Пропускаем первые 5 байт (gRPC заголовок)
    const messageBytes = responseArray.slice(5);

    // Декодируем сообщение с помощью ApiGatewayResponse
    const responseMessage = ApiGatewayResponse.fromBinary(messageBytes);

    let responseData;

    try {
      // Логируем ответ в читаемом виде
      console.log(`[Server][RequestID:${requestId}] Ответ gRPC:`, {
        type: responseMessage.result.case,
        value: responseMessage.result.value
          ? typeof responseMessage.result.value.toJson === "function"
            ? responseMessage.result.value.toJson()
            : responseMessage.result.value
          : null,
      });

      // Проверяем тип результата
      if (responseMessage.result.case === "error") {
        return {
          success: false,
          error: "Ошибка API Gateway",
          message: responseMessage.result.value,
        };
      }

      // Получаем тело ответа
      responseData = {
        success: true,
        responseBody: responseMessage.result.value
          ? responseMessage.result.value.toJson()
          : {},
      };
    } catch (e) {
      console.log(
        `[Server][RequestID:${requestId}] Ошибка декодирования ответа: ${e}`,
      );
      responseData = {
        success: false,
        error: "Ошибка обработки ответа",
        message: e instanceof Error ? e.message : "Неизвестная ошибка",
      };
    }

    // Логируем часть ответа (может быть большим)
    const responsePreview =
      JSON.stringify(responseData).length > 500
        ? JSON.stringify(responseData).substring(0, 500) + "..."
        : JSON.stringify(responseData);
    console.log(
      `[Server][RequestID:${requestId}] Тело ответа: ${responsePreview}`,
    );
    console.log(`[Server][RequestID:${requestId}] ====== КОНЕЦ ЗАПРОСА ======`);

    return responseData;
  } catch (error) {
    console.error(
      `[Server][RequestID:${requestId}] ❌ ОШИБКА: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
    );
    console.error(`[Server][RequestID:${requestId}] Стек ошибки:`, error);
    console.log(
      `[Server][RequestID:${requestId}] ====== ОШИБКА ЗАПРОСА ======`,
    );

    // Возвращаем структурированную ошибку
    return {
      success: false,
      error: "Ошибка прокси-сервера",
      message: error instanceof Error ? error.message : "Неизвестная ошибка",
      timestamp: new Date().toISOString(),
    };
  }
});
