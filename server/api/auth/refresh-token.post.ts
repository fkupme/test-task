/**
 * Серверный обработчик обновления токена
 * Использует refresh_token из куки для получения нового токена через API Gateway
 */

import {
  ApiGatewayRequest,
  ApiGatewayResponse,
} from "@/generated/proto/apigateway_pb";
import { Struct } from "@bufbuild/protobuf";
import { defineEventHandler, deleteCookie, getCookie, setCookie } from "h3";

// Интерфейс для ответа с токенами
interface TokenResponse {
  AccessToken: string;
  RefreshToken: string;
  ExpiresAt: string;
}

export default defineEventHandler(async (event) => {
  const requestId =
    Date.now().toString() + Math.random().toString(36).substring(2, 5);

  console.log(
    `[Server][RequestID:${requestId}] Начало обработки запроса обновления токена`,
  );

  // Получаем источник запроса на обновление (клиент или другой компонент)
  const requestSource =
    event.node.req.headers["x-token-refresh-request-from"] || "unknown";
  console.log(
    `[Server][RequestID:${requestId}] Источник запроса обновления токена: ${requestSource}`,
  );

  try {
    // Получаем refresh_token из куки
    const refreshToken = getCookie(event, "refresh_token");
    console.log(refreshToken);
    if (!refreshToken) {
      console.log(
        `[Server][RequestID:${requestId}] RefreshToken отсутствует в куках`,
      );
      return {
        success: false,
        error: "Токен обновления отсутствует",
        status: 401,
      };
    }

    console.log(
      `[Server][RequestID:${requestId}] RefreshToken получен из куки`,
    );

    // Получаем URL API Gateway из конфигурации
    const config = useRuntimeConfig(event);
    const baseUrl = config.public.apiGatewayUrl;
    console.log(
      `[Server][RequestID:${requestId}] Используем API Gateway: ${baseUrl}`,
    );

    // URL для отправки gRPC запроса
    const targetUrl = `${baseUrl}/apigateway.GatewayService/SendApiGatewayRequest`;

    // Формируем тело запроса с RefreshToken
    const bodyContent = {
      RefreshToken: refreshToken,
    };

    // Преобразуем объект в JSON-строку
    const bodyContentJson = JSON.stringify(bodyContent);

    // Создаем protobuf структуру для запроса
    const requestBody = Struct.fromJson({
      Body: bodyContentJson,
    });

    // Создаем сообщение в формате protobuf
    const message = new ApiGatewayRequest({
      service: "IdentityService",
      method: "RefreshToken",
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

    console.log(
      `[Server][RequestID:${requestId}] Отправка запроса обновления токена...`,
    );
    console.log(
      `[Server][RequestID:${requestId}] Тело запроса для обновления токена:`,
      bodyContentJson,
    );
    // Добавляем логирование сырого Cookie хедера
    console.log(
      `[Server][RequestID:${requestId}] Сырой Cookie хедер, полученный сервером:`,
      event.node.req.headers.cookie,
    );

    // Для метода RefreshToken НЕ НУЖЕН Authorization заголовок!
    // Используем только refresh token в теле запроса
    const requestHeaders = {
      "Content-Type": "application/grpc",
      Accept: "application/grpc",
      "User-Agent": "MUSbooking-Personal-Account-Proxy/1.0",
      "Connect-Protocol-Version": "1",
      // Authorization заголовок НЕ добавляем для refresh запроса
    };
    console.log(
      `[Server][RequestID:${requestId}] Заголовки запроса для обновления токена:`,
      requestHeaders,
    );

    // Выполняем запрос к API Gateway
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: requestHeaders,
      body: finalMessage,
    });

    // Проверяем статус gRPC
    const grpcStatus = response.headers.get("grpc-status");
    const grpcMessage = response.headers.get("grpc-message");

    if (grpcStatus && grpcStatus !== "0") {
      console.error(
        `[Server][RequestID:${requestId}] gRPC ошибка при обновлении токена: ${grpcStatus} - ${grpcMessage}`,
      );
      return {
        success: false,
        error: "Не удалось обновить токен",
        status: 401,
      };
    }

    // Получаем данные ответа
    const responseBuffer = await response.arrayBuffer();
    const responseArray = new Uint8Array(responseBuffer);

    // Пропускаем первые 5 байт (gRPC заголовок)
    const messageBytes = responseArray.slice(5);

    // Декодируем сообщение
    const responseMessage = ApiGatewayResponse.fromBinary(messageBytes);

    console.log(
      `[Server][RequestID:${requestId}] Ответ API Gateway декодирован:`,
      {
        resultCase: responseMessage.result.case,
      },
    );

    // Обработка ошибки
    if (responseMessage.result.case === "error") {
      const errorValue = responseMessage.result.value;
      console.error(
        `[Server][RequestID:${requestId}] Ошибка API Gateway:`,
        errorValue,
      );
      return {
        success: false,
        error: "Ошибка обновления токена",
        status: 401,
      };
    }

    // Обработка успешного ответа
    if (
      responseMessage.result.case === "responseBody" &&
      responseMessage.result.value
    ) {
      try {
        // Преобразуем Struct в обычный объект
        const responseBodyRaw = responseMessage.result.value.toJson();
        console.log(
          `[Server][RequestID:${requestId}] Результат преобразования ответа:`,
          responseBodyRaw,
        );

        // Извлекаем токены из ответа
        let accessToken = "";
        let newRefreshToken = "";
        let expiresAt = "";

        // Проверяем, есть ли поле response в ответе и является ли responseBodyRaw подходящим объектом
        if (
          typeof responseBodyRaw === "object" &&
          responseBodyRaw !== null &&
          "response" in responseBodyRaw &&
          typeof responseBodyRaw.response === "string"
        ) {
          try {
            // Парсим вложенный JSON
            const tokenData = JSON.parse(
              responseBodyRaw.response, // Теперь это безопасно
            ) as TokenResponse;

            if (tokenData.AccessToken) {
              accessToken = tokenData.AccessToken;
            }

            if (tokenData.RefreshToken) {
              newRefreshToken = tokenData.RefreshToken;
            }

            if (tokenData.ExpiresAt) {
              expiresAt = tokenData.ExpiresAt;
            }

            console.log(
              `[Server][RequestID:${requestId}] Получены новые токены:`,
              {
                accessToken: accessToken ? "***" : "отсутствует",
                refreshToken: newRefreshToken ? "***" : "отсутствует",
                expiresAt,
              },
            );
          } catch (parseError) {
            console.error(
              `[Server][RequestID:${requestId}] Ошибка при парсинге данных токенов:`,
              parseError,
            );
            return {
              success: false,
              error: "Ошибка обработки ответа сервера",
              status: 500,
            };
          }
        }

        // Проверяем наличие AccessToken
        if (accessToken) {
          // Удаляем старый AccessToken перед установкой нового
          deleteCookie(event, "auth_token", {
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          });

          // Устанавливаем AccessToken в cookie
          setCookie(event, "auth_token", accessToken, {
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 30, // 30 дней
            sameSite: "lax",
          });

          // Если получен новый RefreshToken, обновляем его в куках
          if (newRefreshToken) {
            // Удаляем старый RefreshToken перед установкой нового
            deleteCookie(event, "refresh_token", {
              httpOnly: true,
              path: "/",
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
            });

            setCookie(event, "refresh_token", newRefreshToken, {
              httpOnly: true,
              path: "/",
              secure: process.env.NODE_ENV === "production",
              maxAge: 60 * 60 * 24 * 90, // 90 дней
              sameSite: "lax",
            });
          }

          // ВАЖНО: Дополнительно формируем Set-Cookie заголовки для proxy
          const secureFlag =
            process.env.NODE_ENV === "production" ? "; Secure" : "";
          const authTokenCookie = `auth_token=${accessToken}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax${secureFlag}`;

          if (newRefreshToken) {
            const refreshTokenCookie = `refresh_token=${newRefreshToken}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 90}; SameSite=Lax${secureFlag}`;
            event.node.res.setHeader("Set-Cookie", [
              authTokenCookie,
              refreshTokenCookie,
            ]);
          } else {
            event.node.res.setHeader("Set-Cookie", authTokenCookie);
          }

          console.log(
            `[Server][RequestID:${requestId}] Токены успешно обновлены и Set-Cookie заголовки сформированы`,
          );

          // Устанавливаем специальный заголовок, указывающий, что токен был обновлен
          event.node.res.setHeader("X-Token-Refreshed", "true");
          event.node.res.setHeader(
            "X-Token-Refreshed-At",
            new Date().toISOString(),
          );
          event.node.res.setHeader(
            "X-Token-Refreshed-By",
            "refresh-token-endpoint",
          );
          event.node.res.setHeader(
            "X-Token-Refresh-Requested-By",
            requestSource,
          );

          // Возвращаем успешный ответ
          return {
            success: true,
            message: "Токен успешно обновлен",
            accessToken: accessToken,
          };
        } else {
          console.error(
            `[Server][RequestID:${requestId}] AccessToken отсутствует в ответе`,
          );
          return {
            success: false,
            error: "Не удалось получить новый токен доступа",
            status: 500,
          };
        }
      } catch (e) {
        console.error(
          `[Server][RequestID:${requestId}] Ошибка при обработке ответа:`,
          e,
        );
        return {
          success: false,
          error: "Ошибка при обработке ответа сервера",
          status: 500,
        };
      }
    }

    // Если не получили ни ошибку, ни ответ
    console.error(
      `[Server][RequestID:${requestId}] Неизвестный формат ответа от API Gateway`,
    );
    return {
      success: false,
      error: "Неизвестный ответ от сервера",
      status: 500,
    };
  } catch (error) {
    console.error(
      `[Server][RequestID:${requestId}] Ошибка при обновлении токена:`,
      error,
    );
    return {
      success: false,
      error: "Произошла ошибка при обновлении токена",
      status: 500,
    };
  }
});
