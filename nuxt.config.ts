import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  alias: {
    "~": "./",
    // Исправлено: alias '@' теперь абсолютный путь, чтобы избежать дублирования модулей
    "@": process.cwd(),
    "@components": "./components",
    "@assets": "./assets",
    "@composables": "./composables",
    "@constants": "./constants",
    "@stores": "./stores",
    "@plugins": "./plugins",
    "@types": "./types",
    "@enums": "./enums",
    "@server": "./server",
    "@public": "./public",
    "@layouts": "./layouts",
    "@pages": "./pages",
    "@utils": "./utils",
    "@middleware": "./middleware",
  },
  devtools: { enabled: true },
  ssr: false,
  css: ['~/assets/scss/global.scss'],
  
  // Runtime конфигурация
  runtimeConfig: {
    public: {
      apiGatewayUrl: process.env.API_GATEWAY_URL || 'https://dev5.musbooking.com/apigateway',
    },
  },

  compatibilityDate: '2025-09-29',

  // Типы/шеймы для Nitro composables
  typescript: {
    tsConfig: {
      include: [
        "types",
      ]
    }
  },
  
  // Плагины
  plugins: [
    '~/plugins/api.gateway.client.ts',
    '~/plugins/http.clients.ts',
    '~/plugins/fetch-interceptor.ts',
    '~/plugins/navigation-history.client.ts',
  ],
  
  modules: [
    "@nuxt/content",
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/image",
    // '@nuxt/scripts', // Отключено для избежания конфликтов импортов
    // "@nuxt/test-utils",
    "vuetify-nuxt-module",
    "@pinia/nuxt",
    "@vueuse/nuxt",
  ],
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' }
  },
  components: {
    dirs: [
      { 
        path: '~/components/auth', 
        prefix: 'Auth', 
        pathPrefix: false 
      },
      {
        path: "~/components/UI/modals",
        prefix: "UI",
        pathPrefix: false,
      },
      {
        path: "~/components/UI/cards",
        prefix: "UI",
        pathPrefix: false,
      },
      {
        path: "~/components/UI/display",
        prefix: "UI",
        pathPrefix: false,
      },
      {
        path: "~/components/UI/fields",
        prefix: "UI",
        pathPrefix: false,
      },
      {
        path: "~/components/UI/controls",
        prefix: "UI",
        pathPrefix: false,
      },
      {
        path: "~/components/UI/pickers",
        prefix: "UI",
        pathPrefix: false,
      },
      {
        path: "~/components/UI/icons",
        prefix: "UI",
        pathPrefix: false,
      },
      {
        path: "~/components/UI/filters",
        prefix: "UI",
        pathPrefix: false,
      },
      {
        path: "~/components/UI/layout",
        prefix: "UI",
        pathPrefix: false,
      },
      {
        path: "~/components/UI/navigation",
        prefix: "UI",
        pathPrefix: false,
      },
      {
        path: "~/components/UI/notifications",
        prefix: "UI",
        pathPrefix: false,
      },
      {
        path: "~/components/UI/Meta",
        prefix: "UI",
        pathPrefix: false,
      }
    ]
  }
});
