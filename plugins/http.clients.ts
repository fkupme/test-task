import { defineNuxtPlugin, navigateTo } from 'nuxt/app'
import { useAuthStore } from '../stores/auth'

export default defineNuxtPlugin(() => {
    const auth = useAuthStore()
    let refreshing: Promise<void> | null = null
  
    const api = $fetch.create({
      credentials: 'include',
      onRequest({ options }) {
        if (auth.accessToken) {
          options.headers = {
            ...(options.headers as any),
            Authorization: `Bearer ${auth.accessToken}`,
          }
        }
      },
      async onResponseError({ response, request, options }: any) {
        if (response.status !== 401) {
          throw (response._data || response)
        }

        // дедупликация refresh-запроса
        if (!refreshing) {
          refreshing = auth.refresh().finally(() => (refreshing = null))
        }
        await refreshing

        if (!auth.accessToken) {
          // refresh не удался
          navigateTo(`/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`)
          throw new Error('Unauthorized')
        }

        // повтор исходного запроса с новым AT (без возврата значения из хука)
        const retryOptions: any = { ...(options || {}) }
        retryOptions.headers = { ...(options?.headers || {}), Authorization: `Bearer ${auth.accessToken}` }
        retryOptions.credentials = 'include'
        // убрать потенциально конфликтующие hook-поля и метод
        delete retryOptions.onResponseError
        delete retryOptions.onRequest
        delete retryOptions.method
        await $fetch.raw(request as any, retryOptions)
        // не возвращаем ничего (void), чтобы удовлетворить тип хука
      },
    })
  
    return { provide: { api } }
  })