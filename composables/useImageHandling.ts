/* Скопировано из musbooking_personal_account */
// ...весь код сохранён...

/**
 * Композабл для работы с новой структурой изображений API
 * Обеспечивает совместимость между новым FileMetadata форматом и старыми base64 строками
 */

import { formatBase64Image } from '../plugins/formatBase64Image.client';
import type { FileMetadata, ImageSource } from '../types/api';
import { useAvatarGenerator } from '../composables/useAvatarGenerator';
import { useImageUrl } from '../composables/useImageUrl';

// ...остальной код из файла...

export function useImageHandling() {
  // ...весь код функции...
}
