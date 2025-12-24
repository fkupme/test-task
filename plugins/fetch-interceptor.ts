/**
 * Плагин для обработки ошибок 401 (Unauthorized) и автоматического обновления токена
 */

import { defineNuxtPlugin, useRouter } from "nuxt/app";
import { FetchError } from "ofetch";
import { AuthService } from "@/classes/api/AuthService";
import { useGlobalStore } from "@/stores/global";
import type { ApiGatewayClient } from '@/types/api';

export default defineNuxtPlugin((nuxtApp: any) => {
  const globalStore = useGlobalStore();
  const { $apiGateway } = useNuxtApp();
  const apiGatewayClient = ($apiGateway as { apiGateway: ApiGatewayClient }).apiGateway;
  const authService = new AuthService(apiGatewayClient);
  let isRefreshing = false;
  let pendingRequests: (() => void)[] = [];
  // (Откат) убран handledLogout

  const executeQueuedRequests = () => {
    pendingRequests.forEach((callback) => callback());
    pendingRequests = [];
  };

  const router = useRouter();
  const handleFetchError = async (error: unknown) => {
    if (!(error instanceof FetchError)) return Promise.reject(error);
    if (error.response?.status === 401) {
      const tokenRefreshed = error.response.headers?.get?.("X-Token-Refreshed");
      if (tokenRefreshed === "true") {
        if (error.response.headers instanceof Headers) {
          error.response.headers.set("X-Token-Refresh-Handled", "true");
        }
        return Promise.reject(error);
      }
      const request = error.request as Request | undefined;
      let originalConfig: any = {};
      let url = "";
      if (request && typeof request === "object" && "method" in request && "url" in request) {
        originalConfig = {
          method: (request as Request).method,
          body: (request as Request).body,
          headers: (request as Request).headers,
        };
        url = (request as Request).url;
      } else if (typeof request === "string") {
        url = request;
      }
      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingRequests.push(() => {
            resolve($fetch(url, originalConfig));
          });
        });
      }
      isRefreshing = true;
      try {
        const refreshResult = await authService.refreshToken();
        if (refreshResult.success) {
          executeQueuedRequests();
          return $fetch(url, originalConfig);
        } else {
          pendingRequests = [];
          return Promise.reject(error);
        }
      } catch (refreshError) {
        pendingRequests = [];
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  };

  nuxtApp.hook("app:error", async (error: unknown) => {
    if (error instanceof FetchError) {
      try {
        return await handleFetchError(error);
      } catch (e) {
        console.error("Ошибка при обработке FetchError:", e);
      }
    }
  });

  nuxtApp.hook("fetch:error", async (error: unknown) => {
    try {
      return await handleFetchError(error);
    } catch (e) {
      return Promise.reject(error);
    }
  });

  console.log("Плагин перехвата 401 ошибок и обновления токена инициализирован");
});