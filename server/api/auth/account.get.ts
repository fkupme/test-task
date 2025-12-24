/**
 * Серверный обработчик для получения данных текущего пользователя
 * Отправляет запрос к API Gateway используя токен из cookie
 */

import {
  ApiGatewayRequest,
  ApiGatewayResponse,
} from "@/generated/proto/apigateway_pb";
import { Struct } from "@bufbuild/protobuf";
import { defineEventHandler, getCookie } from "h3";

export default defineEventHandler(async (event) => {
  try {
    console.log(
      "[Server] Начало обработки запроса получения текущего пользователя",
    );

    // Получаем токен из cookie
    const token = getCookie(event, "auth_token");

    if (!token) {
      console.log(
        "[Server] Токен не найден в cookie, пользователь не авторизован",
      );
      return {
        success: false,
        error: "Пользователь не авторизован",
        status: 401,
      };
    }

    // Получаем URL API Gateway из конфигурации
    const config = useRuntimeConfig(event);
    const baseUrl = config.public.apiGatewayUrl;

    // URL для отправки gRPC запроса
    const targetUrl = `${baseUrl}/apigateway.GatewayService/SendApiGatewayRequest`;

    // Создаем protobuf структуру для запроса (пустое тело)
    const requestBody = Struct.fromJson({
      Body: "{}",
    });

    // Создаем сообщение в формате protobuf
    const message = new ApiGatewayRequest({
      service: "IdentityService",
      method: "GetAccount",
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

    // Выполняем запрос к API Gateway
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/grpc",
        Accept: "application/grpc",
        "User-Agent": "MUSbooking-Personal-Account-Proxy/1.0",
        "Connect-Protocol-Version": "1",
        Authorization: `Bearer ${token}`, // Отправляем токен в заголовке
      },
      body: finalMessage,
    });

    // Проверяем статус gRPC
    const grpcStatus = response.headers.get("grpc-status");
    const grpcMessage = response.headers.get("grpc-message");

    if (grpcStatus && grpcStatus !== "0") {
      console.error(
        `[Server] gRPC ошибка при получении пользователя: ${grpcStatus} - ${grpcMessage}`,
      );
      return {
        success: false,
        error: grpcMessage || "Ошибка получения данных пользователя",
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

    if (responseMessage.result.case === "error") {
      return {
        success: false,
        error: responseMessage.result.value,
        status: 401,
      };
    }

    // Получаем тело ответа
    if (!responseMessage.result.value) {
      return {
        success: false,
        error: "Пустой ответ от сервера",
        status: 500,
      };
    }

    // Преобразуем Struct в обычный объект
    const responseData = responseMessage.result.value.toJson();

    // Парсим строку response, если она есть
    let user = responseData;
    if (
      responseData &&
      typeof responseData === "object" &&
      "response" in responseData &&
      typeof responseData.response === "string"
    ) {
      try {
        user = JSON.parse(responseData.response);
        console.log("[Server] Данные пользователя успешно извлечены из ответа");
      } catch (e) {
        console.error("[Server] Ошибка при парсинге ответа:", e);
      }
    }

    console.log("[Server] Данные пользователя получены успешно");

    // Не нормализуем данные на сервере, просто передаем как есть,
    // чтобы клиентское приложение могло нормализовать их через глобальное хранилище

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error(
      "[Server] Ошибка при получении текущего пользователя:",
      error,
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Неизвестная ошибка получения пользователя",
      status: 500,
    };
  }
});
