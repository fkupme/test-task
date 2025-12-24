import { ref } from 'vue';
import type { ImageProcessingOptions, ProcessedImage } from '~/types/api';

export interface ImageValidationOptions {
	maxSizeMB?: number;
	maxSizeKB?: number;
	maxWidth?: number;
	maxHeight?: number;
	allowedFormats?: string[];
	quality?: number;
}

export interface ImageProcessingResult {
	success: boolean;
	processedImage?: ProcessedImage;
	base64?: string;
	error?: string;
}

export function useImageProcessing() {
	const isProcessing = ref(false);
	const processingProgress = ref(0);

	/**
	 * Валидация изображения перед обработкой
	 */
	const validateImage = (
		file: File,
		options: ImageValidationOptions = {}
	): { valid: boolean; error?: string } => {
		const {
			maxSizeMB = 50,
			maxSizeKB = 0,
			allowedFormats = ['jpg', 'jpeg', 'png', 'webp'],
		} = options;

		// Проверка типа файла
		if (!file.type.startsWith('image/')) {
			return { valid: false, error: 'Файл должен быть изображением' };
		}

		// Проверка формата
		const fileExtension = file.name.split('.').pop()?.toLowerCase();
		if (!fileExtension || !allowedFormats.includes(fileExtension)) {
			return {
				valid: false,
				error: `Разрешены только форматы: ${allowedFormats.join(', ')}`,
			};
		}

		// Проверка размера
		const maxSize = maxSizeKB > 0 ? maxSizeKB * 1024 : maxSizeMB * 1024 * 1024;
		if (file.size > maxSize) {
			const sizeText = maxSizeKB > 0 ? `${maxSizeKB}КБ` : `${maxSizeMB}МБ`;
			return {
				valid: false,
				error: `Размер файла не должен превышать ${sizeText}`,
			};
		}

		return { valid: true };
	};

	/**
	 * Загрузка изображения из файла
	 */
	const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
		return new Promise((resolve, reject) => {
			const img = new Image();
			const url = URL.createObjectURL(file);

			img.onload = () => {
				URL.revokeObjectURL(url);
				resolve(img);
			};

			img.onerror = () => {
				URL.revokeObjectURL(url);
				reject(new Error('Не удалось загрузить изображение'));
			};

			img.src = url;
		});
	};

	/**
	 * Вычисление новых размеров с сохранением пропорций
	 */
	const calculateNewDimensions = (
		originalWidth: number,
		originalHeight: number,
		maxWidth?: number,
		maxHeight?: number
	): { width: number; height: number } => {
		let { width, height } = { width: originalWidth, height: originalHeight };

		if (maxWidth && width > maxWidth) {
			height = (height * maxWidth) / width;
			width = maxWidth;
		}

		if (maxHeight && height > maxHeight) {
			width = (width * maxHeight) / height;
			height = maxHeight;
		}

		return { width: Math.round(width), height: Math.round(height) };
	};

	/**
	 * Сжатие изображения с помощью Canvas
	 */
	const compressImage = async (
		file: File,
		options: ImageProcessingOptions = {}
	): Promise<ImageProcessingResult> => {
		const {
			maxWidth = 1920,
			maxHeight = 1080,
			quality = 0.8,
			format = 'auto',
			enableResize = true,
			enableCompression = true,
		} = options;

		try {
			isProcessing.value = true;
			processingProgress.value = 0;

			// Валидация
			const validation = validateImage(file, { maxSizeMB: 100 });
			if (!validation.valid) {
				return { success: false, error: validation.error };
			}

			processingProgress.value = 20;

			// Загрузка изображения
			const img = await loadImageFromFile(file);
			processingProgress.value = 40;

			// Вычисление новых размеров
			const { width, height } = enableResize
				? calculateNewDimensions(
						img.naturalWidth,
						img.naturalHeight,
						maxWidth,
						maxHeight
					)
				: { width: img.naturalWidth, height: img.naturalHeight };

			processingProgress.value = 60;

			// Создание canvas
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');

			if (!ctx) {
				throw new Error('Не удалось создать 2D контекст');
			}

			canvas.width = width;
			canvas.height = height;

			// Рисование изображения
			ctx.drawImage(img, 0, 0, width, height);
			processingProgress.value = 80;

			// Определение формата вывода
			let outputFormat = 'image/jpeg';
			if (format === 'auto') {
				outputFormat = file.type.includes('png') ? 'image/png' : 'image/jpeg';
			} else if (format === 'webp') {
				outputFormat = 'image/webp';
			} else if (format === 'png') {
				outputFormat = 'image/png';
			}

			// Создание blob
			const blob = await new Promise<Blob>(resolve => {
				canvas.toBlob(
					result => resolve(result!),
					outputFormat,
					enableCompression ? quality : 1.0
				);
			});

			processingProgress.value = 90;

			// Создание base64 без префикса
			const base64Full = canvas.toDataURL(
				outputFormat,
				enableCompression ? quality : 1.0
			);
			const base64 = base64Full.split(',')[1]; // Убираем data:image/...;base64,

			processingProgress.value = 100;

			const processedImage: ProcessedImage = {
				blob,
				url: URL.createObjectURL(blob),
				width,
				height,
				size: blob.size,
				format: outputFormat.split('/')[1] as any,
			};

			return {
				success: true,
				processedImage,
				base64,
			};
		} catch (error) {
			console.error('Ошибка при сжатии изображения:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Неизвестная ошибка',
			};
		} finally {
			isProcessing.value = false;
			processingProgress.value = 0;
		}
	};

	/**
	 * Конвертация файла в base64 без сжатия
	 */
	const fileToBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = () => {
				const result = reader.result as string;
				resolve(result.split(',')[1]); // Убираем data:image/...;base64,
			};

			reader.onerror = () => reject(new Error('Ошибка при чтении файла'));
			reader.readAsDataURL(file);
		});
	};

	/**
	 * Создание превью изображения
	 */
	const createImagePreview = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = () => resolve(reader.result as string);
			reader.onerror = () => reject(new Error('Ошибка при создании превью'));
			reader.readAsDataURL(file);
		});
	};

	/**
	 * Пакетная обработка изображений
	 */
	const processBatch = async (
		files: File[],
		options: ImageProcessingOptions = {}
	): Promise<ImageProcessingResult[]> => {
		const results: ImageProcessingResult[] = [];

		for (let i = 0; i < files.length; i++) {
			const result = await compressImage(files[i], options);
			results.push(result);

			// Обновляем общий прогресс
			processingProgress.value = Math.round(((i + 1) / files.length) * 100);
		}

		return results;
	};

	/**
	 * Очистка URL объектов для освобождения памяти
	 */
	const cleanup = (processedImages: ProcessedImage[]) => {
		processedImages.forEach(img => {
			if (img.url) {
				URL.revokeObjectURL(img.url);
			}
		});
	};

	return {
		// Состояние
		isProcessing,
		processingProgress,

		// Методы
		validateImage,
		compressImage,
		fileToBase64,
		createImagePreview,
		processBatch,
		cleanup,

		// Утилиты
		loadImageFromFile,
		calculateNewDimensions,
	};
}
