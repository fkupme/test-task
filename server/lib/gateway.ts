import {
  ApiGatewayRequest,
  ApiGatewayResponse,
} from "../../generated/proto/apigateway_pb";
import { Struct } from "@bufbuild/protobuf";
import { useRuntimeConfig } from 'nuxt/app';

export class ServerApiGatewayClient {
  private readonly baseUrl: string;

  constructor() {
    const { public: { apiGatewayUrl } } = useRuntimeConfig() as any;
    this.baseUrl = apiGatewayUrl as string;
  }

  /**
   * Отправка запроса к API Gateway
   */
  async sendRequest<T>(
    service: string,
    method: string,
    data: any,
    token?: string,
  ): Promise<T> {
    const targetUrl = `${this.baseUrl}/apigateway.GatewayService/SendApiGatewayRequest`;

    // Создаем protobuf структуру для запроса
    const requestBody = Struct.fromJson(data);

    // Создаем сообщение в формате protobuf
    const message = new ApiGatewayRequest({
      service,
      method,
      requestBody,
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

    // Формируем заголовки запроса
    const headers: Record<string, string> = {
      "Content-Type": "application/grpc",
      Accept: "application/grpc",
      "User-Agent": "MUSbooking-Personal-Account-Proxy/1.0",
      "Connect-Protocol-Version": "1",
    };

    // Добавляем токен, если он есть
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Выполняем запрос к API Gateway
    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: finalMessage,
    });

    // Проверяем статус gRPC
    const grpcStatus = response.headers.get("grpc-status");
    const grpcMessage = response.headers.get("grpc-message");

    if (grpcStatus && grpcStatus !== "0") {
      throw new Error(grpcMessage || `gRPC ошибка: ${grpcStatus}`);
    }

    // Получаем данные ответа
    const responseBuffer = await response.arrayBuffer();
    const responseArray = new Uint8Array(responseBuffer);

    // Пропускаем первые 5 байт (gRPC заголовок)
    const messageBytes = responseArray.slice(5);

    // Декодируем сообщение
    const responseMessage = ApiGatewayResponse.fromBinary(messageBytes);

    if (responseMessage.result.case === "error") {
      throw new Error(responseMessage.result.value.toString());
    }

    // Получаем тело ответа
    if (!responseMessage.result.value) {
      throw new Error("Пустой ответ от сервера");
    }

    // Преобразуем Struct в обычный объект
    return responseMessage.result.value.toJson() as T;
  }

  /**
   * Авторизация пользователя
   */
  async login(credentials: {
    email?: string;
    phone?: string;
    password: string;
  }) {
    return this.sendRequest<{
      token?: string;
      user: any;
    }>("auth", "login", credentials);
  }

  /**
   * Регистрация пользователя
   */
  async register(userData: any) {
    return this.sendRequest<{
      token?: string;
      user: any;
    }>("auth", "register", userData);
  }

  /**
   * Выход из системы
   */
  async logout(token: string) {
    return this.sendRequest<{ success: boolean }>("auth", "logout", { token });
  }

  /**
   * Получение текущего пользователя
   */
  async getCurrentUser(token: string) {
    return this.sendRequest<any>("auth", "getCurrentUser", {}, token);
  }

  /**
   * Запрос на восстановление пароля
   */
  async requestPasswordRecovery(email: string) {
    return this.sendRequest<{ success: boolean }>(
      "auth",
      "requestPasswordRecovery",
      { email },
    );
  }

  /**
   * Проверка кода восстановления пароля
   */
  async verifyRecoveryCode(email: string, code: string) {
    return this.sendRequest<{ isValid: boolean }>(
      "auth",
      "verifyRecoveryCode",
      { email, code },
    );
  }

  /**
   * Установка нового пароля
   */
  async resetPassword(email: string, code: string, newPassword: string) {
    return this.sendRequest<{ success: boolean }>("auth", "resetPassword", {
      email,
      code,
      newPassword,
    });
  }
}
