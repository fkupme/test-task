/**
 * Серверный обработчик верификации партнера
 * Проксирует запрос к API Gateway для верификации кода SMS
 */

import {
  ApiGatewayRequest,
  ApiGatewayResponse,
} from "@/generated/proto/apigateway_pb";
import { Struct } from "@bufbuild/protobuf";
import { defineEventHandler, readBody, setCookie } from "h3";

// Интерфейс для данных проверки кода
interface VerifyCodeData {
  phoneNumber: string;
  countryCode: string;
  verificationCode: string;
}

// Интерфейс для ответа от сервера
interface VerifyResponse {
  token?: string;
  user?: {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
    [key: string]: any;
  };
  response?: string; // Поле response с строкой JSON
}

// Интерфейс для токенов, вложенных в поле response
interface TokenResponse {
  AccessToken: string;
  RefreshToken: string;
  ExpiresAt: string;
}

export default defineEventHandler(async (event) => {
  try {
    console.log("[Server] Начало обработки запроса верификации SMS партнера");

    // Получаем данные запроса
    const requestData = (await readBody(event)) as VerifyCodeData;
    console.log(
      "[Server] Данные для верификации SMS партнера:",
      JSON.stringify(requestData, null, 2),
    );

    // Проверка данных
    if (!requestData.phoneNumber || !requestData.countryCode) {
      console.log("[Server] Ошибка: не указан номер телефона или код страны");
      return {
        success: false,
        error: "Необходимо указать номер телефона и код страны",
        status: 400,
      };
    }

    if (!requestData.verificationCode) {
      console.log("[Server] Ошибка: не указан код верификации");
      return {
        success: false,
        error: "Необходимо указать код верификации",
        status: 400,
      };
    }

    // Получаем URL API Gateway из конфигурации
    const config = useRuntimeConfig(event);
    const baseUrl = config.public.apiGatewayUrl;
    console.log("[Server] Используем API Gateway:", baseUrl);

    // URL для отправки gRPC запроса
    const targetUrl = `${baseUrl}/apigateway.GatewayService/SendApiGatewayRequest`;

    // Преобразуем объект в JSON-строку, как требуется формату API
    const bodyContentJson = JSON.stringify({
      phoneNumber: requestData.phoneNumber,
      countryCode: requestData.countryCode,
      verificationCode: requestData.verificationCode,
    });

    console.log("[Server] Подготовка запроса к API Gateway");

    // Создаем protobuf структуру для запроса согласно формату POSTMAN
    const requestBody = Struct.fromJson({
      Body: bodyContentJson,
    });

    // Создаем сообщение в формате protobuf
    const message = new ApiGatewayRequest({
      service: "IdentityService",
      method: "VerifyCodePartner",
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

    console.log("[Server] Отправка запроса к API Gateway");

    // Выполняем запрос к API Gateway
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/grpc",
        Accept: "application/grpc",
        "User-Agent": "MUSbooking-Personal-Account-Proxy/1.0",
        "Connect-Protocol-Version": "1",
        Authorization: "", // Добавляем пустой заголовок авторизации
      },
      body: finalMessage,
    });

    // Проверяем статус gRPC
    const grpcStatus = response.headers.get("grpc-status");
    const grpcMessage = response.headers.get("grpc-message");

    console.log("[Server] Получен ответ от API Gateway:", {
      status: response.status,
      grpcStatus,
      grpcMessage,
    });

    if (grpcStatus && grpcStatus !== "0") {
      console.error(
        `[Server] gRPC ошибка при верификации SMS партнера: ${grpcStatus} - ${grpcMessage}`,
      );

      // Возвращаем пользовательскую ошибку
      return {
        success: false,
        error: "Не удалось проверить код. Пожалуйста, попробуйте позже.",
        status: 400,
      };
    }

    // Получаем данные ответа
    const responseBuffer = await response.arrayBuffer();
    const responseArray = new Uint8Array(responseBuffer);

    // Проверка на пустой ответ
    if (responseArray.length <= 5) {
      console.error("[Server] Получен пустой ответ от API Gateway");
      return {
        success: false,
        error: "Сервер вернул пустой ответ",
        status: 500,
      };
    }

    // Пропускаем первые 5 байт (gRPC заголовок)
    const messageBytes = responseArray.slice(5);

    // Декодируем сообщение
    const responseMessage = ApiGatewayResponse.fromBinary(messageBytes);

    console.log("[Server] Ответ API Gateway декодирован:", {
      resultCase: responseMessage.result.case,
    });

    // Обработка ошибки
    if (responseMessage.result.case === "error") {
      const errorValue = responseMessage.result.value;
      console.error("[Server] Ошибка API Gateway:", errorValue);

      // Пытаемся определить, содержит ли ошибка структуру _Error с shortMessage
      try {
        // Проверяем, есть ли в ошибке JSON строка или объект
        let errorObj;
        if (typeof errorValue === "string") {
          // Проверяем, может ли это быть JSON
          if (String(errorValue).trim().startsWith("{")) {
            try {
              errorObj = JSON.parse(errorValue);
            } catch (e) {
              // Не JSON, используем как строку
              errorObj = { message: errorValue };
            }
          } else {
            // Просто строка
            errorObj = { message: errorValue };
          }
        } else {
          // Уже объект
          errorObj = errorValue;
        }

        // Проверяем наличие shortMessage (на основе логов это характерно для ошибок API)
        if (errorObj && errorObj.shortMessage) {
          console.log(
            "[Server] Найдено shortMessage в ошибке:",
            errorObj.shortMessage,
          );

          // Проверяем сообщение на наличие ключевых фраз
          const msg = errorObj.shortMessage.toLowerCase();
          if (msg.includes("не найден") || msg.includes("сессия истекла")) {
            // Это ошибка авторизации
            return {
              success: false,
              error: errorObj.shortMessage,
              status: 401,
            };
          } else if (msg.includes("неверный код")) {
            // Это ошибка неверного кода
            return {
              success: false,
              error: "Неверный код подтверждения",
              status: 400,
            };
          } else {
            // Другая понятная ошибка
            return {
              success: false,
              error: errorObj.shortMessage,
              status: 400,
            };
          }
        }
      } catch (e) {
        console.error("[Server] Ошибка при анализе структуры ошибки:", e);
      }

      // Проверяем на технические ошибки, чтобы не передавать их клиенту
      let errorMessage = String(errorValue);
      if (
        errorMessage.includes("System.") ||
        errorMessage.includes("Exception")
      ) {
        console.error("[Server] Техническая ошибка:", errorMessage);
        errorMessage =
          "Сервис временно недоступен. Пожалуйста, попробуйте позже.";
      }

      return {
        success: false,
        error: errorMessage,
        status: 500,
      };
    }

    // Обработка успешного ответа
    if (
      responseMessage.result.case === "responseBody" &&
      responseMessage.result.value
    ) {
      try {
        console.log("[Server] Получен успешный ответ от API Gateway");

        // Преобразуем Struct в обычный объект, как в register.post.ts
        const responseBodyRaw = responseMessage.result.value.toJson();
        console.log(
          "[Server] Результат преобразования ответа:",
          responseBodyRaw,
        );

        // Приводим к нужному типу
        const responseBody = responseBodyRaw as unknown as VerifyResponse;

        // Извлекаем токены из поля response (если есть)
        let accessToken = "";
        let refreshToken = "";

        if (responseBody.response) {
          try {
            // Парсим вложенный JSON из строки response
            const tokenData = JSON.parse(
              responseBody.response,
            ) as TokenResponse;
            console.log("[Server] Извлечены данные токенов:", {
              accessToken: tokenData.AccessToken ? "***" : "отсутствует",
              refreshToken: tokenData.RefreshToken ? "***" : "отсутствует",
              expiresAt: tokenData.ExpiresAt,
            });

            if (tokenData.AccessToken) {
              accessToken = tokenData.AccessToken;
            }

            if (tokenData.RefreshToken) {
              refreshToken = tokenData.RefreshToken;
            }
          } catch (parseError) {
            console.error(
              "[Server] Ошибка при парсинге данных токенов:",
              parseError,
            );
          }
        }

        // Проверяем наличие AccessToken
        if (accessToken) {
          console.log("[Server] AccessToken получен! Устанавливаем в куки...");
          // Устанавливаем AccessToken в cookie
          setCookie(event, "auth_token", accessToken, {
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 30, // 30 дней
            sameSite: "lax",
          });
          console.log("[Server] AccessToken успешно установлен в куки");

          // Устанавливаем RefreshToken в отдельную куку, если есть
          if (refreshToken) {
            console.log(
              "[Server] RefreshToken получен! Устанавливаем в куки...",
            );
            setCookie(event, "refresh_token", refreshToken, {
              httpOnly: true,
              path: "/",
              secure: process.env.NODE_ENV === "production",
              maxAge: 60 * 60 * 24 * 90, // 90 дней
              sameSite: "lax",
            });
            console.log("[Server] RefreshToken успешно установлен в куки");
          }
        } else if (responseBody.token) {
          // Для обратной совместимости с прежним форматом ответа
          console.log(
            "[Server] Токен получен напрямую! Устанавливаем в куки...",
          );
          setCookie(event, "auth_token", responseBody.token, {
            httpOnly: true,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 30, // 30 дней
            sameSite: "lax",
          });
          console.log("[Server] Токен успешно установлен в куки");
        } else {
          console.warn("[Server] Внимание: токены отсутствуют в ответе!");
        }

        console.log("[Server] Верификация SMS успешна");
        if (responseBody.user) {
          console.log("[Server] Пользователь:", responseBody.user);
        } else {
          console.warn(
            "[Server] Предупреждение: Данные пользователя отсутствуют в ответе",
          );
        }

        // Возвращаем ответ клиенту
        return {
          success: true,
          user: responseBody.user || null,
          message: "Верификация успешно завершена",
        };
      } catch (e) {
        console.error("[Server] Ошибка при обработке ответа:", e);
        console.error("[Server] Оригинальный ответ:", responseMessage.result);

        return {
          success: false,
          error: "Ошибка при обработке ответа сервера",
          status: 500,
        };
      }
    }

    // Если не получили ни ошибку, ни ответ
    console.error("[Server] Неизвестный формат ответа от API Gateway");
    return {
      success: false,
      error: "Неизвестный ответ от сервера",
      status: 500,
    };
  } catch (error) {
    console.error("[Server] Ошибка при обработке верификации партнера:", error);

    // Не передаем технические детали ошибки клиенту
    return {
      success: false,
      error:
        "Произошла ошибка при проверке кода. Пожалуйста, попробуйте позже.",
      status: 500,
    };
  }
});
