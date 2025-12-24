// Утилита для получения URL изображения
export function useImageUrl(_unused: string, url: string, _unused2: string, options: { source?: string; nuxtImageOptions?: Record<string, any> } = {}): string {
  // В реальном проекте здесь может быть логика для Nuxt Image или CDN
  // Для простого случая возвращаем исходный URL
  return url;
}
