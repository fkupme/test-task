<template>
  <div class="image-manager">
    <!-- Заголовок и кнопки управления -->
    <div v-if="showHeader" class="manager-header">
      <h4>{{ title }}</h4>
      <div class="manager-actions">
        <button
          v-if="images.length > 0"
          :disabled="isSaving"
          class="btn-save"
          @click="saveChanges"
        >
          {{ isSaving ? "Сохранение..." : "Сохранить" }}
        </button>
      </div>
    </div>

    <!-- Список изображений с drag & drop -->
    <div class="images-container" :class="{ 'is-draggable': isDraggable }">
      <div
        v-if="canAddMoreImages"
        class="add-image-button"
        :class="{ 'drag-over': isDragOver }"
        @click="triggerFileInput"
        @drop="onDrop"
        @dragover.prevent
        @dragenter.prevent
        @dragleave="onDragLeave"
      >
        <v-icon icon="mdi-plus" size="32" color="grey" />
        <p>{{ placeholderText }}</p>
        <span class="file-constraints">{{ constraintsText }}</span>
      </div>
      <draggable
        v-model="imagesList"
        item-key="Key"
        :disabled="!isDraggable"
        ghost-class="ghost"
        chosen-class="chosen"
        drag-class="drag"
        animation="200"
        handle=".drag-handle"
        @start="onDragStart"
        @end="onDragEnd"
      >
        <template #item="{ element: image, index }">
          <div v-if="index === 0">
            <!-- Section headers for grouped view -->
            <div v-if="groupedView && index === coverIndex" class="section-title">Заглавное фото</div>
            <div v-if="groupedView && index === firstPhotoIndex && hasMoreThanOneImage" class="section-title">Фото</div>
            <div v-if="groupedView && index === firstVideoIndex" class="section-title">Видео</div>

            <div :key="image.Key" class="image-card-wrapper">
              <!-- Drag handle - теперь в wrapper -->
              <!-- <div
                v-if="isDraggable && images.length > 1"
                class="drag-handle"
                title="Перетащите для изменения порядка"
              >
                <v-icon icon="mdi-drag" size="50" />
              </div> -->

              <!-- Карточка медиа -->
              <div class="image-item">
                <!-- Кнопка удаления -->
                <button
                  class="delete-btn"
                  title="Удалить"
                  @click="removeImage(index)"
                >
                  <v-icon icon="mdi-close" size="16" color="white" />
                </button>

                <!-- Превью -->
                <div class="image-preview">
                  <img
                    v-if="!isVideo(image)"
                    class="image-preview-img"
                    :src="image.Url"
                    :alt="image.Name"
                    @load="onImageLoad"
                    @error="onImageError"
                  >
                  <video
                    v-else
                    class="image-preview-video"
                    :src="image.Url"
                    muted
                    playsinline
                    preload="metadata"
                  />
                  <!-- Индикатор загрузки -->
                  <div v-if="isUploading[image.Key]" class="upload-overlay">
                    <v-progress-circular indeterminate color="white" size="24" />
                  </div>
                </div>

                <!-- Информация -->
                <div class="image-info">
                  <p class="image-name">{{ image.Name }}</p>
                  <p class="image-size">{{ mediaTypeLabel(image) }} | {{ formatFileSize(image.Size) }} | {{ mediaExt(image) }}</p>
                </div>
              </div>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Кнопка добавления (показывается когда не достигнут лимит) -->
    </div>

    <!-- Скрытый input для файлов -->
    <input
      ref="fileInput"
      type="file"
      multiple
      :accept="acceptedTypes"
      style="display: none"
      @change="onFileSelect"
    >

    <!-- Индикатор обработки -->
    <div v-if="isProcessing" class="processing-overlay">
      <div class="processing-content">
        <v-progress-circular
          :model-value="processingProgress"
          color="primary"
          size="48"
        />
        <p>Обработка изображений...</p>
        <span>{{ processingProgress }}%</span>
      </div>
    </div>

    <!-- Уведомления об ошибках -->
    <div v-if="errors.length > 0" class="error-messages">
      <div v-for="(error, index) in errors" :key="index" class="error-message">
        <v-icon icon="mdi-alert-circle" size="16" color="error" />
        {{ error }}
        <button @click="dismissError(index)">
          <v-icon icon="mdi-close" size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import draggable from "vuedraggable";
import type { ParentType } from "@/classes/api/ResourcesService";
import { useImageProcessing } from "@/composables/useImageProcessing";
import type { FileMetadata } from "@/types/api";

interface Props {
	// Данные для API
	accountId: string;
	parentType: ParentType;
	parentId: string;
	// Автозагрузка в ресурсы (если false — только локально, без API)
	autoUpload?: boolean;
	// Отложенный режим — удаление происходит только локально, реальное удаление при сохранении
	deferredMode?: boolean;

	// Изображения
	images: FileMetadata[];

	// Конфигурация
	isDraggable?: boolean;
	maxImagesCount?: number;
	minImagesCount?: number;

	// Ограничения файлов (изображения)
	maxSizeMB?: number;
	maxSizeKB?: number;
	acceptedFormats?: string[];

	// Обработка изображений
	enableCompression?: boolean;
	imageQuality?: number;
	maxImageWidth?: number;
	maxImageHeight?: number;

	// UI
	title?: string;
	showHeader?: boolean;
	placeholderText?: string;

	// Дополнительно: видео и секционный вид
	enableVideo?: boolean;
	acceptedVideoFormats?: string[];
	maxVideoSizeMB?: number;
	maxVideoSizeKB?: number;
	groupedView?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	autoUpload: true,
	deferredMode: false,
	isDraggable: true,
	maxImagesCount: 10,
	minImagesCount: 0,
	maxSizeMB: 50,
	maxSizeKB: 0,
	acceptedFormats: () => ["jpg", "jpeg", "png", "webp"],
	enableCompression: true,
	imageQuality: 0.8,
	maxImageWidth: 1920,
	maxImageHeight: 1080,
	title: "Управление изображениями",
	showHeader: true,
	placeholderText: "Добавить изображения",
	// New defaults to preserve current behavior
	enableVideo: false,
	acceptedVideoFormats: () => ["mp4", "mov", "webm"],
	maxVideoSizeMB: 500,
	maxVideoSizeKB: 0,
	groupedView: false,
});

const emit = defineEmits<{
	(e: "images-changed", images: FileMetadata[]): void;
	(e: "upload-complete", images: FileMetadata[]): void;
	(e: "upload-error", error: string): void;
	(e: "validation-error", error: string): void;
	(e: "local-files-added", files: { base64: string; name: string; contentType: string; size: number }[]): void;
	(e: "file-removed", file: FileMetadata): void;
}>();

// Состояние компонента
const imagesList = ref<FileMetadata[]>([...props.images]);
const fileInput = ref<HTMLInputElement>();
const isDragOver = ref(false);
const isUploading = ref<Record<string, boolean>>({});
const isSaving = ref(false);
const errors = ref<string[]>([]);

// Композаблы
const {
	compressImage,
	fileToBase64,
	validateImage,
	isProcessing,
	processingProgress,
} = useImageProcessing();

// Computed свойства
const canAddMoreImages = computed(() => {
	return imagesList.value.length < props.maxImagesCount;
});

const acceptedTypes = computed(() => {
	const imageTypes = props.acceptedFormats
		.map((format) => `image/${format === "jpg" ? "jpeg" : format}`);
	const videoTypes = props.enableVideo
		? props.acceptedVideoFormats.map((format) => `video/${format}`)
		: [];
	return [...imageTypes, ...videoTypes].join(",");
});

const constraintsText = computed(() => {
	const formats = props.acceptedFormats.map((f) => f.toUpperCase()).join(", ");
	const videoFormats = props.enableVideo
		? props.acceptedVideoFormats.map((f) => f.toUpperCase()).join(", ")
		: "";
	const sizeText =
		props.maxSizeKB > 0 ? `до ${props.maxSizeKB}КБ` : `до ${props.maxSizeMB}МБ`;
	const videoSizeText = props.enableVideo
		? (props.maxVideoSizeKB && props.maxVideoSizeKB > 0
			? `до ${props.maxVideoSizeKB}КБ`
			: `до ${props.maxVideoSizeMB}МБ`)
		: "";
	return props.enableVideo
		? `Фото: ${formats}, ${sizeText} • Видео: ${videoFormats}, ${videoSizeText}`
		: `${formats}, ${sizeText}`;
});

// Методы обработки файлов
const triggerFileInput = () => {
	fileInput.value?.click();
};

const onFileSelect = (event: Event) => {
	const target = event.target as HTMLInputElement;
	const files = Array.from(target.files || []);
	if (files.length > 0) {
		processFiles(files);
	}
	target.value = "";
};

const onDrop = (event: DragEvent) => {
	event.preventDefault();
	isDragOver.value = false;

	const files = Array.from(event.dataTransfer?.files || []);
	if (files.length > 0) {
		processFiles(files);
	}
};

const onDragLeave = () => {
	isDragOver.value = false;
};

// Обработка файлов с полной валидацией
const processFiles = async (files: File[]) => {
	// Проверяем минимальное количество
	if (imagesList.value.length < props.minImagesCount && files.length === 0) {
		addError(`Минимальное количество изображений: ${props.minImagesCount}`);
		return;
	}

	// Проверяем лимит количества
	const remainingSlots = props.maxImagesCount - imagesList.value.length;
	const filesToProcess = files.slice(0, remainingSlots);

	if (files.length > remainingSlots) {
		addError(`Можно добавить только ${remainingSlots} изображений`);
	}

	const localAdded: { base64: string; name: string; contentType: string; size: number }[] = [];
	for (const file of filesToProcess) {
		const isVid = file.type.startsWith("video/") || isVideoExtension(file.name);
		const res = isVid ? await processVideoFile(file) : await processFile(file);
		if (res) localAdded.push(res);
	}
	if (!props.autoUpload && localAdded.length) {
		emit("local-files-added", localAdded);
	}
};

const processFile = async (file: File) => {
	try {
		// Полная валидация файла (изображение)
		const validation = validateImage(file, {
			maxSizeMB: props.maxSizeMB,
			maxSizeKB: props.maxSizeKB,
			allowedFormats: props.acceptedFormats,
		});

		if (!validation.valid) {
			addError(validation.error!);
			return null;
		}

		// Сжатие изображения если включено
		let fileToUpload = file;
		let base64Data = "";

		if (props.enableCompression) {
			const compressionResult = await compressImage(file, {
				maxWidth: props.maxImageWidth,
				maxHeight: props.maxImageHeight,
				quality: props.imageQuality,
				enableCompression: true,
				enableResize: true,
			});

			if (compressionResult.success && compressionResult.processedImage) {
				fileToUpload = new File(
					[compressionResult.processedImage.blob],
					file.name,
					{ type: compressionResult.processedImage.blob.type }
				);
				base64Data = compressionResult.base64!;
			} else {
				throw new Error(compressionResult.error || "Ошибка сжатия");
			}
		} else {
			base64Data = await fileToBase64(file);
		}

		// Если отложенная загрузка — только локально, без API
		if (!props.autoUpload) {
			const tempMeta: FileMetadata = {
				Key: `temp_${Date.now()}_${Math.random()}`,
				Name: file.name,
				ParentId: props.parentId,
				Size: fileToUpload.size,
				ContentType: fileToUpload.type,
				LastModified: new Date().toISOString(),
				Url: URL.createObjectURL(fileToUpload),
				Priority: imagesList.value.length,
				FileType: 1,
			};
			imagesList.value.push(tempMeta);
			emit("images-changed", [...imagesList.value]);
			return { base64: base64Data, name: file.name, contentType: file.type, size: file.size };
		}

		// Иначе — сразу грузим на сервер
		await uploadFile(fileToUpload, base64Data);
		return { base64: base64Data, name: file.name, contentType: file.type, size: file.size };
	} catch (error) {
		console.error("Ошибка обработки файла:", error);
		addError(`Ошибка обработки файла ${file.name}: ${error}`);
		emit("upload-error", `Ошибка обработки файла ${file.name}`);
		return null;
	}
};

const processVideoFile = async (file: File) => {
	try {
		if (!props.enableVideo) {
			addError("Загрузка видео отключена");
			return null;
		}
		// Валидация видео по расширению и размеру
		const extOk = isVideoExtension(file.name, props.acceptedVideoFormats);
		const sizeLimit = props.maxVideoSizeKB && props.maxVideoSizeKB > 0
			? props.maxVideoSizeKB * 1024
			: props.maxVideoSizeMB! * 1024 * 1024;
		if (!extOk) {
			addError(`Недопустимый формат видео: ${file.name}`);
			return null;
		}
		if (file.size > sizeLimit) {
			addError(`Файл ${file.name} превышает допустимый размер`);
			return null;
		}

		const base64Data = await fileToBase64(file);

		if (!props.autoUpload) {
			const tempMeta: FileMetadata = {
				Key: `temp_${Date.now()}_${Math.random()}`,
				Name: file.name,
				ParentId: props.parentId,
				Size: file.size,
				ContentType: file.type || guessVideoMime(file.name),
				LastModified: new Date().toISOString(),
				Url: URL.createObjectURL(file),
				Priority: imagesList.value.length,
				FileType: 2,
			};
			imagesList.value.push(tempMeta);
			emit("images-changed", [...imagesList.value]);
			return { base64: base64Data, name: file.name, contentType: tempMeta.ContentType, size: file.size };
		}

		await uploadFile(file, base64Data);
		return { base64: base64Data, name: file.name, contentType: file.type || guessVideoMime(file.name), size: file.size };
	} catch (error) {
		console.error("Ошибка обработки видео:", error);
		addError(`Ошибка обработки видео ${file.name}: ${error}`);
		emit("upload-error", `Ошибка обработки видео ${file.name}`);
		return null;
	}
};

const uploadFile = async (file: File, base64Data: string) => {
	const tempKey = `temp_${Date.now()}_${Math.random()}`;
	isUploading.value[tempKey] = true;

	try {
		// Используем ResourcesService для загрузки
		const { $apiGateway } = useNuxtApp();
		const { ResourcesService } = await import("@/classes/api/ResourcesService");
		const resourcesService = new ResourcesService($apiGateway as any);

		const uploadResult = await resourcesService.uploadResource({
			FileData: base64Data,
			FileName: file.name,
			ContentType: file.type,
			ParentId: props.parentId,
			ParentType: props.parentType,
		});

		if (uploadResult.success) {
			// Создаем временный объект FileMetadata
			const tempMetadata: FileMetadata = {
				Key: tempKey,
				Name: file.name,
				ParentId: props.parentId,
				Size: file.size,
				ContentType: file.type,
				LastModified: new Date().toISOString(),
				Url: URL.createObjectURL(file),
				Priority: imagesList.value.length,
				FileType: file.type.startsWith("video/") ? 2 : 1,
			};

			imagesList.value.push(tempMetadata);
			emit("images-changed", [...imagesList.value]);
		} else {
			throw new Error("Ошибка загрузки на сервер");
		}
	} catch (error) {
		console.error("Ошибка загрузки файла:", error);
		addError(`Ошибка загрузки файла ${file.name}`);
		emit("upload-error", `Ошибка загрузки файла ${file.name}`);
	} finally {
		delete isUploading.value[tempKey];
	}
};

// Управление изображениями с ResourcesService
const removeImage = async (index: number) => {
	const image = imagesList.value[index];

	// В режиме отложенного удаления — только убираем из списка и уведомляем родителя
	if (props.deferredMode) {
		// Освобождаем URL если это временный объект
		if (image.Url.startsWith("blob:")) {
			URL.revokeObjectURL(image.Url);
		}

		imagesList.value.splice(index, 1);
		emit("file-removed", image);
		emit("images-changed", [...imagesList.value]);
		return;
	}

	// Обычный режим — удаляем сразу с сервера
	try {
		const { $apiGateway } = useNuxtApp();
		const { ResourcesService } = await import("@/classes/api/ResourcesService");
		const resourcesService = new ResourcesService($apiGateway as any);

		const deleteResult = await resourcesService.deleteResource(
			props.accountId,
			image.Key
		);

		if (deleteResult.success) {
			// Освобождаем URL если это временный объект
			if (image.Url.startsWith("blob:")) {
				URL.revokeObjectURL(image.Url);
			}

			imagesList.value.splice(index, 1);
			emit("images-changed", [...imagesList.value]);
		} else {
			throw new Error("Ошибка удаления с сервера");
		}
	} catch (error) {
		console.error("Ошибка удаления изображения:", error);
		addError(`Ошибка удаления изображения ${image.Name}`);
	}
};

const saveChanges = async () => {
	if (isSaving.value) return;

	// Валидация минимального количества
	if (imagesList.value.length < props.minImagesCount) {
		addError(`Минимальное количество изображений: ${props.minImagesCount}`);
		return;
	}

	isSaving.value = true;
	try {
		// Обновляем приоритеты изображений
		imagesList.value.forEach((image, index) => {
			image.Priority = index;
		});

		emit("upload-complete", [...imagesList.value]);
	} catch (error) {
		console.error("Ошибка сохранения:", error);
		addError("Ошибка сохранения изменений");
	} finally {
		isSaving.value = false;
	}
};

// Drag & Drop для сортировки
const onDragStart = () => {
	// Логика начала перетаскивания
};

const onDragEnd = () => {
	// Обновляем приоритеты изображений
	imagesList.value.forEach((image, index) => {
		image.Priority = index;
	});

	emit("images-changed", [...imagesList.value]);
};

// Обработка событий изображений
const onImageLoad = () => {
	// Изображение загружено
};

const onImageError = () => {
	// Ошибка загрузки изображения
};

// Управление ошибками
const addError = (message: string) => {
	errors.value.push(message);
	emit("validation-error", message);

	// Автоматическое удаление ошибки через 5 секунд
	setTimeout(() => {
		const index = errors.value.indexOf(message);
		if (index > -1) {
			errors.value.splice(index, 1);
		}
	}, 5000);
};

const dismissError = (index: number) => {
	errors.value.splice(index, 1);
};

// Утилиты
const formatFileSize = (bytes: number): string => {
	const sizes = ["Б", "КБ", "МБ"];
	if (bytes === 0) return "0 Б";
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
};

const isVideo = (meta: FileMetadata): boolean => {
	return (meta.ContentType && meta.ContentType.startsWith("video/")) || isVideoExtension(meta.Name);
};

const isVideoExtension = (name: string, allowed: string[] = props.acceptedVideoFormats): boolean => {
	const ext = (name.split(".").pop() || "").toLowerCase();
	return allowed.map((f) => f.toLowerCase()).includes(ext);
};

const guessVideoMime = (name: string): string => {
	const ext = (name.split(".").pop() || "").toLowerCase();
	if (ext === "mp4") return "video/mp4";
	if (ext === "mov") return "video/quicktime";
	if (ext === "webm") return "video/webm";
	return "video/mp4";
};

const mediaTypeLabel = (meta: FileMetadata): string => (isVideo(meta) ? "Video" : "Image");
const mediaExt = (meta: FileMetadata): string => (meta.Name.split(".").pop() || "").toUpperCase();

// Для секционного вида вычисляем индексы первых элементов
const imageIndices = computed(() => imagesList.value
	.map((m, idx) => ({ idx, isImg: !isVideo(m) }))
	.filter(x => x.isImg)
	.map(x => x.idx));
const coverIndex = computed(() => imageIndices.value.length ? imageIndices.value[0] : -1);
const firstPhotoIndex = computed(() => imageIndices.value.length > 1 ? imageIndices.value[1] : -1);
const hasMoreThanOneImage = computed(() => imageIndices.value.length > 1);
const firstVideoIndex = computed(() => imagesList.value.findIndex((m) => isVideo(m)));

// Отслеживание изменений props.images
watch(
	() => props.images,
	(newImages) => {
		imagesList.value = [...newImages];
	},
	{ deep: true }
);

// Очистка ресурсов при размонтировании
onUnmounted(() => {
	imagesList.value.forEach((image) => {
		if (image.Url.startsWith("blob:")) {
			URL.revokeObjectURL(image.Url);
		}
	});
});
</script>

<style lang="scss" scoped>
.image-manager {
	position: relative;
	border-radius: 8px;
	overflow: hidden;
	background: #fff;
	margin-bottom: 1rem;
}

.manager-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 16px;
	border-bottom: 1px solid #e5e7eb;

	h4 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: #111827;
	}
}

.manager-actions {
	display: flex;
	gap: 8px;
}

.btn-save {
	display: none;
	padding: 8px 16px;
	border: none;
	border-radius: 6px;
	background: #3b82f6;
	color: white;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: background-color 0.2s;

	&:hover:not(:disabled) {
		background: #2563eb;
	}

	&:disabled {
		background: #9ca3af;
		cursor: not-allowed;
	}
}

.images-container {
	min-height: 120px;
	display: flex;
	flex-direction: column;
	gap: 16px;

	&.is-draggable .image-card-wrapper {
		.drag-handle {
			opacity: 1;
		}
	}
}

.section-title {
	font-weight: 700;
	font-size: 18px;
	color: #000;
	margin: 16px 0 4px 0;
}

// Wrapper для карточки с drag-handle
.image-card-wrapper {
	position: relative;
	display: flex;
	flex-direction: row-reverse;
	align-items: center;
	gap: 2px;
	width: 100%;

	&.chosen {
		opacity: 0.7;
	}

	&.ghost {
		opacity: 0.5;
		transform: rotate(2deg);
	}

	&.drag {
		transform: rotate(2deg);
	}
}

.drag-handle {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	width: 50px;
	height: 50px;
	border-radius: 8px;
	cursor: grab;
	transition: background-color 0.2s, border-color 0.2s;

	&:hover {
		background: #e5e7eb;
		border-color: #d1d5db;
	}

	&:active {
		cursor: grabbing;
		background: #d1d5db;
	}
}

.image-item {
	position: relative;
	border: 1px solid #e5e7eb;
	padding: 0.5rem;
	border-radius: 8px;
	background: #fff;
	transition: transform 0.2s, box-shadow 0.2s;
	display: flex;
	gap: 8px;
	flex: 1;
	min-width: 200px;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
}

.image-preview {
	position: relative;
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
	object-fit: cover;
	width: 70px;
	height: 70px;

	img, video {
		object-fit: cover;
		border-radius: 8px;
		width: 100%;
		height: 100%;
	}
}

.delete-btn {
	position: absolute;
	top: 8px;
	right: 8px;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(239, 68, 68, 0.9);
	border: none;
	border-radius: 50%;
	cursor: pointer;
	opacity: 0;
	transition: opacity 0.2s;

	.image-item:hover & {
		opacity: 1;
	}

	&:hover {
		background: #dc2626;
	}
}

.upload-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
}

.image-info {
	padding: 12px;
	width: 70%;
	overflow: hidden;

	.image-name {
		margin: 0 0 4px 0;
		font-size: 14px;
		font-weight: 500;
		color: #111827;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.image-size {
		margin: 0;
		font-size: 12px;
		color: #6b7280;
	}

	.image-count {
		margin: 4px 0 0 0;
		font-size: 11px;
		color: #9ca3af;
		font-style: italic;
	}
}

.add-image-button {
	border: 2px dashed #d1d5db;
	border-radius: 8px;
	padding: 32px 16px;
	text-align: center;
	cursor: pointer;
	transition: border-color 0.2s, background-color 0.2s;
	min-height: 200px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 8px;

	&:hover {
		border-color: #9ca3af;
		background: #f9fafb;
	}

	&.drag-over {
		border-color: #3b82f6;
		background: #eff6ff;
	}

	p {
		margin: 0;
		font-size: 16px;
		font-weight: 500;
		color: #6b7280;
	}

	.file-constraints {
		font-size: 12px;
		color: #9ca3af;
	}
}

.processing-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(255, 255, 255, 0.9);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 100;
}

.processing-content {
	text-align: center;

	p {
		margin: 12px 0 4px 0;
		font-size: 16px;
		font-weight: 500;
		color: #111827;
	}

	span {
		font-size: 14px;
		color: #6b7280;
	}
}

.error-messages {
	position: absolute;
	top: 16px;
	right: 16px;
	max-width: 300px;
	z-index: 200;
}

.error-message {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px;
	background: #fef2f2;
	border: 1px solid #fecaca;
	border-radius: 6px;
	margin-bottom: 8px;
	font-size: 14px;
	color: #dc2626;

	button {
		background: none;
		border: none;
		cursor: pointer;
		color: #dc2626;
		padding: 0;
		margin-left: auto;

		&:hover {
			opacity: 0.7;
		}
	}
}

</style>