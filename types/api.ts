/**
 * Общие типы для API
 */
import type {
	ApiError as ApiGatewayError,
	ApiGatewayRequest,
	ApiGatewayResponse,
} from './api.gateway';

/**
 * Тип для обработчика неавторизованного доступа
 */
export type UnauthorizedHandler = () => Promise<boolean>;

/**
 * Клиент для работы с API Gateway
 */
export interface ApiGatewayClient {
	sendRequest: (request: ApiGatewayRequest) => Promise<ApiGatewayResponse>;
	setAuthToken: (token: string | null) => void;
	getAuthToken: () => string | null;
	onUnauthorized: (handler: UnauthorizedHandler) => void;
}

/**
 * Расширенный класс Error для ошибок API
 */
export class ApiError extends Error {
	code: string | number;
	details?: unknown;

	constructor(error: ApiGatewayError | any) {
		// Более безопасная обработка сообщения ошибки
		let message = 'Произошла ошибка API';

		if (typeof error === 'string') {
			message = error;
		} else if (error && typeof error === 'object') {
			if (typeof error.message === 'string' && error.message.length > 0) {
				message = error.message;
			} else if (typeof error.error === 'string' && error.error.length > 0) {
				message = error.error;
			} else if (
				typeof error.description === 'string' &&
				error.description.length > 0
			) {
				message = error.description;
			} else {
				// Последняя попытка - попробуем сериализовать объект
				try {
					message = JSON.stringify(error);
				} catch {
					message = 'Произошла неизвестная ошибка API';
				}
			}
		}

		super(message);
		this.name = 'ApiError';
		this.code = error?.code || error?.status || -1;
		this.details = error?.details;
	}
}

// === NEW IMAGE TYPES FOR API === START ===

/**
 * Тип файла в системе
 */
export enum FileType {
	Image = 0,
	Document = 1,
	Video = 2,
	Audio = 3,
	Archive = 4,
	Other = 5,
}

/**
 * Метаданные файла/изображения из API
 * Используется для логотипов, изображений позиций, и других ресурсов
 */
export interface FileMetadata {
	Key: string;
	Name: string;
	ParentId: string;
	Size: number;
	ContentType: string;
	LastModified: string;
	Url: string;
	Priority: number;
	FileType: FileType;
}

/**
 * Алиас для логотипа (используется в базах, партнерских зонах и т.д.)
 */
export type Logo = FileMetadata

/**
 * Алиас для изображений позиций/услуг
 */
export type PositionImage = FileMetadata

/**
 * Утилитарный тип для обработки изображений в старых компонентах
 * Позволяет работать как с новой структурой FileMetadata, так и со старыми base64 строками
 */
export type ImageSource = FileMetadata | string | null | undefined;

/**
 * Интерфейс для обработанного изображения (после сжатия/конвертации)
 */
export interface ProcessedImage {
	blob: Blob;
	url: string;
	width: number;
	height: number;
	size: number;
	format: 'webp' | 'png' | 'jpeg';
}

/**
 * Настройки для обработки изображения
 */
export interface ImageProcessingOptions {
	maxWidth?: number;
	maxHeight?: number;
	quality?: number; // 0-1 для JPEG/WebP
	format?: 'webp' | 'png' | 'jpeg' | 'auto';
	enableResize?: boolean;
	enableCompression?: boolean;
}

// === NEW IMAGE TYPES FOR API === END ===
