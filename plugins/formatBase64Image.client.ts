/**
 * Форматирует Base64 строку изображения для использования в src.
 * @param base64String - Исходная Base64 строка (может быть с префиксом data:image/ или без).
 * @param defaultMimeType - MIME-тип по умолчанию, если префикс отсутствует (например, 'image/png').
 * @returns Отформатированная строка для src или null, если исходная строка некорректна.
 */
export function formatBase64Image(base64String: string | null | undefined, defaultMimeType: string = "image/png"): string | null {
  if (!base64String || typeof base64String !== "string") {
    return null;
  }
  if (base64String.startsWith("data:image/")) {
    return base64String;
  }
  return `data:${defaultMimeType};base64,${base64String}`;
}

export default defineNuxtPlugin(() => {});
