/**
 * Серверный обработчик авторизации
 * Проксирует запрос к API Gateway и обрабатывает результат,
 * сохраняя токен в cookies для дальнейшего использования
 */

import {
  ApiGatewayRequest,
  ApiGatewayResponse,
} from "@/generated/proto/apigateway_pb";
import { Struct } from "@bufbuild/protobuf";
import { defineEventHandler, readBody, setCookie } from "h3";
import { ERROR_MESSAGES } from "@/constants/error-messages";

// Тип для ответа от сервера авторизации
interface AuthResponse {
  token?: string;
  user?: {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
    [key: string]: any;
  };
}

export default defineEventHandler(async (event) => {
  // Создаем уникальный ID для отслеживания запроса
  const requestId =
    Date.now().toString() + Math.random().toString(36).substring(2, 5);

  console.log(
    `[Server][RequestID:${requestId}] ======= НАЧАЛО АВТОРИЗАЦИИ ПАРТНЕРА =======`,
  );

  try {
    console.log(
      `[Server][RequestID:${requestId}] Начало обработки запроса авторизации`,
    );

    // Получаем данные запроса
    const requestData = await readBody(event);
    console.log(
      `[Server][RequestID:${requestId}] Данные для авторизации:`,
      JSON.stringify(
        {
          ...requestData,
          password: requestData.password ? "***" : undefined,
        },
        null,
        2,
      ),
    );

    // Проверка данных
    if (!requestData.email && !requestData.fullPhoneNumber) {
      console.log(
        `[Server][RequestID:${requestId}] Ошибка: Email или телефон не указан`,
      );
      return {
        success: false,
        error: "Необходимо указать email или телефон",
        status: 400,
      };
    }

    if (!requestData.password) {
      console.log(`[Server][RequestID:${requestId}] Ошибка: Пароль не указан`);
      return {
        success: false,
        error: "Необходимо указать пароль",
        status: 400,
      };
    }

    // Используем данные запроса в формате, ожидаемом сервером
    const loginData = {
      fullPhoneNumber: requestData.fullPhoneNumber || "",
      email: requestData.email || "",
      password: requestData.password,
    };

    console.log(
      `[Server][RequestID:${requestId}] Подготовленные данные для входа:`,
      JSON.stringify({ ...loginData, password: "***" }, null, 2),
    );

    // Получаем URL API Gateway из конфигурации
    const config = useRuntimeConfig(event);
    const baseUrl = config.public.apiGatewayUrl;

    // URL для отправки gRPC запроса
    const targetUrl = `${baseUrl}/apigateway.GatewayService/SendApiGatewayRequest`;
    console.log(
      `[Server][RequestID:${requestId}] Целевой URL запроса: ${targetUrl}`,
    );

    // Преобразуем объект в JSON-строку, как в proxy.ts
    const bodyContentJson = JSON.stringify(loginData);
    console.log(
      `[Server][RequestID:${requestId}] Body в формате JSON-строки:`,
      bodyContentJson,
    );

    // Создаем protobuf структуру для запроса точно как в proxy.ts
    const requestBody = Struct.fromJson({
      Body: bodyContentJson,
    });

    console.log(`[Server][RequestID:${requestId}] Структура Body создана`);

    // Создаем сообщение в формате protobuf
    const message = new ApiGatewayRequest({
      service: "IdentityService",
      method: "LoginPartner",
      requestBody,
    });

    console.log(
      `[Server][RequestID:${requestId}] Создано gRPC сообщение:`,
      JSON.stringify({
        service: "IdentityService",
        method: "LoginPartner",
        bodySize: bodyContentJson.length,
      }),
    );

    // Получаем бинарные данные
    const binaryMessage = message.toBinary();
    console.log(
      `[Server][RequestID:${requestId}] Бинарное сообщение создано, размер: ${binaryMessage.length} байт`,
    );

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
      `[Server][RequestID:${requestId}] Финальное gRPC сообщение подготовлено, размер: ${finalMessage.length} байт`,
    );

    // Выполняем запрос к API Gateway с пустым заголовком Authorization
    console.log(`[Server][RequestID:${requestId}] Отправка запроса...`);
    const startTime = Date.now();

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/grpc",
        Accept: "application/grpc",
        "User-Agent": "MUSbooking-Personal-Account-Proxy/1.0",
        "Connect-Protocol-Version": "1",
        Authorization: "", // Явно указываем пустой заголовок авторизации
      },
      body: finalMessage,
    });

    const endTime = Date.now();
    console.log(
      `[Server][RequestID:${requestId}] Запрос выполнен за ${endTime - startTime}мс`,
    );
    console.log(
      `[Server][RequestID:${requestId}] HTTP статус ответа: ${response.status} ${response.statusText}`,
    );

    // Проверяем статус gRPC
    const grpcStatus = response.headers.get("grpc-status");
    const grpcMessage = response.headers.get("grpc-message");

    console.log(
      `[Server][RequestID:${requestId}] gRPC статус: ${grpcStatus || "отсутствует"}`,
    );
    if (grpcMessage) {
      console.log(
        `[Server][RequestID:${requestId}] gRPC сообщение: ${grpcMessage}`,
      );
    }

    if (grpcStatus && grpcStatus !== "0") {
      console.error(
        `[Server][RequestID:${requestId}] gRPC ошибка при авторизации: ${grpcStatus} - ${grpcMessage}`,
      );

      // Анализируем сообщение ошибки
      const errorMessage = ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS;

      // В журнал записываем полную ошибку для диагностики
      if (grpcMessage) {
        console.log(
          `[Server][RequestID:${requestId}] Детали ошибки: ${grpcMessage}`,
        );
      }

      return {
        success: false,
        error: errorMessage,
        status: 400,
      };
    }

    // Получаем данные ответа
    console.log(`[Server][RequestID:${requestId}] Чтение тела ответа...`);
    const responseBuffer = await response.arrayBuffer();
    const responseArray = new Uint8Array(responseBuffer);

    // Пропускаем первые 5 байт (gRPC заголовок)
    const messageBytes = responseArray.slice(5);

    // Декодируем сообщение с помощью ApiGatewayResponse
    const responseMessage = ApiGatewayResponse.fromBinary(messageBytes);

    // Проверяем тип результата
    if (responseMessage.result.case === "error") {
      console.error(
        `[Server][RequestID:${requestId}] Ошибка в ответе API:`,
        responseMessage.result.value,
      );

      // Получаем текст ошибки
      const errorValue = responseMessage.result.value || "Ошибка авторизации";

      // Логируем оригинальную ошибку для диагностики
      console.log(
        `[Server][RequestID:${requestId}] Детали ошибки: ${errorValue}`,
      );

      // Анализируем ошибку
      const errorMessage = ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS;

      return {
        success: false,
        error: errorMessage,
        status: 400,
      };
    }

    // Извлекаем данные из ответа
    const responseData =
      (responseMessage.result.value?.toJson() as Record<string, any>) || {};
    console.log(
      `[Server][RequestID:${requestId}] Данные ответа:`,
      JSON.stringify(
        {
          ...responseData,
          response:
            typeof responseData.response === "string"
              ? "[БОЛЬШОЙ ОБЪЕКТ JSON]"
              : undefined,
        },
        null,
        2,
      ),
    );

    // Парсим строку response, так как она содержит JSON в виде строки
    let parsedResponse: any = {};
    try {
      if (typeof responseData.response === "string") {
        parsedResponse = JSON.parse(responseData.response);
        console.log(
          `[Server][RequestID:${requestId}] Структура ответа:`,
          JSON.stringify(
            {
              ...parsedResponse,
              Tokens: parsedResponse.Tokens
                ? {
                    AccessToken: parsedResponse.Tokens.AccessToken
                      ? "[СКРЫТ]"
                      : undefined,
                    RefreshToken: parsedResponse.Tokens.RefreshToken
                      ? "[СКРЫТ]"
                      : undefined,
                    ExpiresAt: parsedResponse.Tokens.ExpiresAt,
                  }
                : undefined,
            },
            null,
            2,
          ),
        );
      }
    } catch (e) {
      console.error(
        `[Server][RequestID:${requestId}] Ошибка при парсинге ответа:`,
        e,
      );
    }

    // Проверяем наличие токенов
    if (!parsedResponse.Tokens || !parsedResponse.Tokens.AccessToken) {
      console.error(`[Server][RequestID:${requestId}] В ответе нет токенов`);
      return {
        success: false,
        error: ERROR_MESSAGES.AUTH_SERVER_ERROR,
        status: 500,
      };
    }

    // Если есть токен, сохраняем его в cookie
    setCookie(event, "auth_token", parsedResponse.Tokens.AccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: "/",
      sameSite: "strict",
    });

    console.log(`[Server][RequestID:${requestId}] Токен сохранен в cookie`);

    // Если есть refresh_token, сохраняем его тоже
    if (parsedResponse.Tokens.RefreshToken) {
      setCookie(event, "refresh_token", parsedResponse.Tokens.RefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 14, // 14 дней
        path: "/",
        sameSite: "strict",
      });
      console.log(
        `[Server][RequestID:${requestId}] Refresh токен сохранен в cookie`,
      );
    }

    // Декодируем JWT для получения информации о пользователе
    const tokenParts = parsedResponse.Tokens.AccessToken.split(".");
    let payload = {};
    try {
      if (tokenParts.length >= 2) {
        // Декодируем Base64 в UTF-8 строку и затем парсим JSON
        const base64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
        const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
        payload = JSON.parse(jsonStr);
        console.log(
          `[Server][RequestID:${requestId}] Данные из токена:`,
          payload,
        );
      }
    } catch (e) {
      console.error(
        `[Server][RequestID:${requestId}] Ошибка при декодировании токена:`,
        e,
      );
    }

    // Создаем объект пользователя из данных токена
    const user = {
      id: (payload as any).accountId || "",
      email: (payload as any).email || "",
      phone: (payload as any).phoneNumber || "",
      // Другие поля могут быть добавлены по мере необходимости
    };

    // Логируем информацию о пользователе (без чувствительных данных)
    console.log(
      `[Server][RequestID:${requestId}] Данные пользователя:`,
      JSON.stringify(user, null, 2),
    );

    // Возвращаем ответ клиенту (без токена в теле ответа для безопасности)
    console.log(
      `[Server][RequestID:${requestId}] ======= АВТОРИЗАЦИЯ ЗАВЕРШЕНА УСПЕШНО =======`,
    );
    return {
      success: true,
      user: user,
    };
  } catch (error) {
    console.error(
      `[Server][RequestID:${requestId}] Ошибка при обработке авторизации:`,
      error,
    );
    console.log(
      `[Server][RequestID:${requestId}] ======= АВТОРИЗАЦИЯ ЗАВЕРШЕНА С ОШИБКОЙ =======`,
    );

    // Логируем детали ошибки для отладки
    const errorDetails =
      error instanceof Error ? error.message : "Неизвестная ошибка авторизации";
    console.log(
      `[Server][RequestID:${requestId}] Детали ошибки: ${errorDetails}`,
    );

    return {
      success: false,
      error: ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS,
      status: 500,
    };
  }
});
