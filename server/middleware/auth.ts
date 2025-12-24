/**
 * Middleware для обработки авторизации
 * Добавляет заголовок Authorization из cookie для проксируемых запросов
 */

import { defineEventHandler, getCookie, getRequestURL } from 'h3'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  const token = getCookie(event, 'auth_token')

  if (token && (path.startsWith('/api/gateway') || path.startsWith('/api'))) {
    event.headers.set('Authorization', `Bearer ${token}`)
  }
}) 