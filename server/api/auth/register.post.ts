/**
 * Серверный обработчик регистрации
 * Использует прокси-сервер для отправки запроса к API Gateway и обрабатывает результат,
 * сохраняя токен в cookies для дальнейшего использования
 */

import {
  ApiGatewayRequest,
  ApiGatewayResponse,
} from "@/generated/proto/apigateway_pb";
import { Struct } from "@bufbuild/protobuf";
import { defineEventHandler, readBody, setCookie } from "h3";

// Тип для ответа от сервера регистрации
interface RegisterResponse {
  token?: string;
  user?: {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
    [key: string]: any;
  };
}

// Тип для данных регистрации
interface RegisterData {
  email?: string;
  phone?: string;
  phoneNumber?: string;
  countryCode?: string;
  locale?: string;
  firstName?: string;
  lastName?: string;
  password: string;
  name?: string;
  [key: string]: any;
}

export default defineEventHandler(async (event) => {
  // Создаем уникальный ID для отслеживания запроса
  const requestId =
    Date.now().toString() + Math.random().toString(36).substring(2, 5);

  console.log(
    `[Server][RequestID:${requestId}] ======= НАЧАЛО РЕГИСТРАЦИИ ПАРТНЕРА =======`,
  );

  try {
    console.log(
      `[Server][RequestID:${requestId}] Начало обработки запроса регистрации`,
    );

    // Получаем данные запроса
    const requestData = (await readBody(event)) as RegisterData;
    console.log(
      `[Server][RequestID:${requestId}] Данные для регистрации:`,
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
    console.log(`[Server][RequestID:${requestId}] Валидация входных данных`);

    if (!requestData.email) {
      console.log(`[Server][RequestID:${requestId}] Ошибка: Email не указан`);
      return {
        success: false,
        error: "Необходимо указать email",
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

    if (!requestData.phoneNumber && !requestData.phone) {
      console.log(
        `[Server][RequestID:${requestId}] Ошибка: Номер телефона не указан`,
      );
      return {
        success: false,
        error: "Необходимо указать номер телефона",
        status: 400,
      };
    }

    // Преобразуем данные в формат для API RegistrationPartner
    const partnerData = {
      phoneNumber: requestData.phoneNumber || requestData.phone || "",
      locale: requestData.locale || "ru-RU",
      countryCode: requestData.countryCode || "+7",
      firstName: requestData.firstName || requestData.name || "",
      lastName: requestData.lastName || "",
      email: requestData.email || "",
      password: requestData.password,
    };

    console.log(
      `[Server][RequestID:${requestId}] Подготовленные данные партнера:`,
      JSON.stringify(
        {
          ...partnerData,
          password: "***",
        },
        null,
        2,
      ),
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
    const bodyContentJson = JSON.stringify(partnerData);
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
      method: "RegistrationPartner",
      requestBody: requestBody,
    });

    console.log(
      `[Server][RequestID:${requestId}] Создано gRPC сообщение:`,
      JSON.stringify({
        service: "IdentityService",
        method: "RegistrationPartner",
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

    // Получаем данные ответа
    console.log(`[Server][RequestID:${requestId}] Чтение тела ответа...`);
    const responseBuffer = await response.arrayBuffer();
    const responseArray = new Uint8Array(responseBuffer);

    // Пропускаем первые 5 байт (gRPC заголовок)
    const messageBytes = responseArray.slice(5);

    // Декодируем сообщение
    try {
      console.log(
        `[Server][RequestID:${requestId}] Декодирование protobuf ответа...`,
      );
      const responseMessage = ApiGatewayResponse.fromBinary(messageBytes);

      console.log(
        `[Server][RequestID:${requestId}] Тип результата: ${responseMessage.result.case}`,
      );

      if (responseMessage.result.case === "error") {
        console.error(
          `[Server][RequestID:${requestId}] Ошибка в ответе API: ${responseMessage.result.value}`,
        );
        return {
          success: false,
          error: responseMessage.result.value,
          status: 400,
        };
      }

      // Получаем тело ответа и преобразуем в обычный объект JavaScript
      if (!responseMessage.result.value) {
        console.error(
          `[Server][RequestID:${requestId}] Пустое значение результата`,
        );
        return {
          success: false,
          error: "Пустой ответ от сервера",
          status: 500,
        };
      }

      // Преобразуем Struct в обычный объект
      console.log(
        `[Server][RequestID:${requestId}] Преобразование Struct в JSON...`,
      );
      const responseBodyRaw = responseMessage.result.value.toJson();

      console.log(
        `[Server][RequestID:${requestId}] Ответ от API:`,
        JSON.stringify(responseBodyRaw, null, 2),
      );

      // Приводим к типу RegisterResponse
      const responseBody = responseBodyRaw as unknown as RegisterResponse;

      // Если есть токен, сохраняем его в cookie
      if (responseBody.token) {
        console.log(
          `[Server][RequestID:${requestId}] Получен токен, сохраняем в cookie`,
        );
        // Устанавливаем httpOnly cookie с токеном
        setCookie(event, "auth_token", responseBody.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7, // 7 дней
          path: "/",
          sameSite: "strict",
        });

        console.log(
          `[Server][RequestID:${requestId}] Токен сохранен в cookie после регистрации`,
        );
      } else {
        console.log(
          `[Server][RequestID:${requestId}] В ответе нет токена после регистрации`,
        );
      }

      // Возвращаем ответ клиенту (без токена в теле ответа для безопасности)
      const safeResponse = {
        success: true,
        user: responseBody.user,
      };

      console.log(
        `[Server][RequestID:${requestId}] Возвращаем успешный ответ:`,
        JSON.stringify(safeResponse, null, 2),
      );
      console.log(
        `[Server][RequestID:${requestId}] ======= УСПЕШНО ЗАВЕРШЕНА РЕГИСТРАЦИЯ ПАРТНЕРА =======`,
      );

      return safeResponse;
    } catch (decodeError) {
      console.error(
        `[Server][RequestID:${requestId}] Ошибка декодирования ответа:`,
        decodeError,
      );
      return {
        success: false,
        error: "Ошибка обработки ответа от сервера",
        status: 500,
      };
    }
  } catch (error) {
    console.error(
      `[Server][RequestID:${requestId}] Ошибка при обработке регистрации:`,
      error,
    );
    console.log(
      `[Server][RequestID:${requestId}] ======= ОШИБКА РЕГИСТРАЦИИ ПАРТНЕРА =======`,
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Неизвестная ошибка регистрации",
      status: 500,
    };
  }
}); 