/**
 * Серверный обработчик для выхода из системы
 * Удаляет cookie с токенами (auth_token и refresh_token) и отправляет запрос на logout в API Gateway
 */

import { ApiGatewayRequest } from "@/generated/proto/apigateway_pb";
import { Struct } from "@bufbuild/protobuf";
import { defineEventHandler, deleteCookie, getCookie } from "h3";

export default defineEventHandler(async (event) => {
  try {
    console.log("[Server] Начало обработки запроса выхода из системы");

    // Получаем токены из cookie
    const token = getCookie(event, "auth_token");
    const refreshToken = getCookie(event, "refresh_token");

    if (!token && !refreshToken) {
      console.log(
        "[Server] Токены не найдены в cookie, пользователь уже разлогинен",
      );
      return {
        success: true,
        message: "Пользователь уже вышел из системы",
      };
    }

    // Получаем URL API Gateway из конфигурации
    const config = useRuntimeConfig(event);
    const baseUrl = config.public.apiGatewayUrl;

    // URL для отправки gRPC запроса
    const targetUrl = `${baseUrl}/apigateway.GatewayService/SendApiGatewayRequest`;

    // Создаем protobuf структуру для запроса
    const requestBody = Struct.fromJson({
      token: token ?? "", // Передаем строку, исключая undefined
    });

    // Создаем сообщение в формате protobuf
    const message = new ApiGatewayRequest({
      service: "auth",
      method: "logout",
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

    // В любом случае удаляем cookie auth_token
    deleteCookie(event, "auth_token", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Удаляем cookie refresh_token
    deleteCookie(event, "refresh_token", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    console.log("[Server] Cookie с токенами удалены");

    // Проверяем статус gRPC
    const grpcStatus = response.headers.get("grpc-status");

    if (grpcStatus && grpcStatus !== "0") {
      const grpcMessage = response.headers.get("grpc-message");
      console.warn(
        `[Server] gRPC предупреждение при выходе: ${grpcStatus} - ${grpcMessage}`,
      );
      // Даже если есть ошибка, мы всё равно разлогинили пользователя локально
    }

    return {
      success: true,
      message: "Выход из системы выполнен успешно",
    };
  } catch (error) {
    console.error("[Server] Ошибка при обработке выхода из системы:", error);

    // Даже при ошибке удаляем cookie
    deleteCookie(event, "auth_token", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Удаляем cookie refresh_token
    deleteCookie(event, "refresh_token", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return {
      success: true, // Считаем успешным даже при ошибке бэкенда
      message: "Выход из системы выполнен локально",
      details: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
});
