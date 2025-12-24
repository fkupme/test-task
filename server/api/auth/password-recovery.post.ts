/**
 * Серверный обработчик запроса восстановления пароля
 * Проксирует запрос к API Gateway, который отправляет email со ссылкой для восстановления пароля
 */

import {
  ApiGatewayRequest,
  ApiGatewayResponse,
} from "@/generated/proto/apigateway_pb";
import { Struct } from "@bufbuild/protobuf";
import { defineEventHandler, readBody } from "h3";
import { ERROR_MESSAGES } from "@/constants/error-messages";

export default defineEventHandler(async (event) => {
  // Создаем уникальный ID для отслеживания запроса
  const requestId =
    Date.now().toString() + Math.random().toString(36).substring(2, 5);

  console.log(
    `[Server][RequestID:${requestId}] ======= НАЧАЛО ЗАПРОСА ВОССТАНОВЛЕНИЯ ПАРОЛЯ =======`,
  );

  try {
    console.log(
      `[Server][RequestID:${requestId}] Начало обработки запроса восстановления пароля`,
    );

    // Получаем данные запроса
    const requestData = await readBody(event);
    console.log(
      `[Server][RequestID:${requestId}] Данные для восстановления пароля:`,
      JSON.stringify(requestData, null, 2),
    );

    // Проверка данных
    if (!requestData.email) {
      console.log(`[Server][RequestID:${requestId}] Ошибка: Email не указан`);
      return {
        success: false,
        error: "Необходимо указать email",
        status: 400,
      };
    }

    // Используем данные запроса в формате, ожидаемом сервером
    const recoveryData = {
      email: requestData.email,
    };

    console.log(
      `[Server][RequestID:${requestId}] Подготовленные данные для восстановления:`,
      JSON.stringify(recoveryData, null, 2),
    );

    // Получаем URL API Gateway из конфигурации
    const config = useRuntimeConfig(event);
    const baseUrl = config.public.apiGatewayUrl;

    // URL для отправки gRPC запроса
    const targetUrl = `${baseUrl}/apigateway.GatewayService/SendApiGatewayRequest`;
    console.log(
      `[Server][RequestID:${requestId}] Целевой URL запроса: ${targetUrl}`,
    );

    // Преобразуем объект в JSON-строку
    const bodyContentJson = JSON.stringify(recoveryData);
    console.log(
      `[Server][RequestID:${requestId}] Body в формате JSON-строки:`,
      bodyContentJson,
    );

    // Создаем protobuf структуру для запроса
    const requestBody = Struct.fromJson({
      Body: bodyContentJson,
    });

    console.log(`[Server][RequestID:${requestId}] Структура Body создана`);

    // Создаем сообщение в формате protobuf
    const message = new ApiGatewayRequest({
      service: "IdentityService",
      method: "RestorePasswordPartner",
      requestBody,
    });

    console.log(
      `[Server][RequestID:${requestId}] Создано gRPC сообщение:`,
      JSON.stringify({
        service: "IdentityService",
        method: "RestorePasswordPartner",
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
        `[Server][RequestID:${requestId}] gRPC ошибка при запросе восстановления пароля: ${grpcStatus} - ${grpcMessage}`,
      );

      // Анализируем сообщение ошибки
      const errorMessage = ERROR_MESSAGES.RECOVERY_EMAIL_NOT_FOUND;

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
      const errorValue =
        responseMessage.result.value || "Ошибка восстановления пароля";

      // Логируем оригинальную ошибку для диагностики
      console.log(
        `[Server][RequestID:${requestId}] Детали ошибки: ${errorValue}`,
      );

      // Анализируем ошибку
      const errorMessage = ERROR_MESSAGES.RECOVERY_EMAIL_NOT_FOUND;

      return {
        success: false,
        error: errorMessage,
        status: 400,
      };
    }

    // Возвращаем успешный ответ клиенту
    console.log(
      `[Server][RequestID:${requestId}] ======= ЗАПРОС ВОССТАНОВЛЕНИЯ ПАРОЛЯ ЗАВЕРШЕН УСПЕШНО =======`,
    );
    return {
      success: true,
      message: "На указанный email отправлена ссылка для восстановления пароля",
    };
  } catch (error) {
    console.error(
      `[Server][RequestID:${requestId}] Ошибка при обработке запроса восстановления пароля:`,
      error,
    );
    console.log(
      `[Server][RequestID:${requestId}] ======= ЗАПРОС ВОССТАНОВЛЕНИЯ ПАРОЛЯ ЗАВЕРШЕН С ОШИБКОЙ =======`,
    );

    // Логируем детали ошибки для отладки
    const errorDetails =
      error instanceof Error
        ? error.message
        : "Неизвестная ошибка восстановления пароля";
    console.log(
      `[Server][RequestID:${requestId}] Детали ошибки: ${errorDetails}`,
    );

    return {
      success: false,
      error: ERROR_MESSAGES.RECOVERY_SERVER_ERROR,
      status: 500,
    };
  }
}); 