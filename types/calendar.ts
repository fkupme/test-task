import type { Logo } from './api';
import type { BaseOrder } from './order'; // Импортируем BaseOrder
import type { RequestData } from './request'; // Импортируем RequestData

/**
 * Общие типы для календаря и системы бронирования
 */

// --- НОВЫЙ ИНТЕРФЕЙС ДЛЯ СФЕРЫ ---
export interface SphereOption {
	id: string; // Был Id
	isRange: boolean; // Был IsRange
	isDefault: boolean; // Был isDefault
}

export interface Sphere {
	id: string; // Был Id
	info: {
		// Было Info
		name: string; // Был Name
		description: string; // Был Description
	};
	from: string | null;
	to: string | null;
	default: string | null; // Тип неизвестен, пока строка
	limitMonths: number;
	limitDays: number;
	options: SphereOption[];
}
// ---------------------------------

// --- ОБНОВЛЕННЫЙ ИНТЕРФЕЙС ДЛЯ КОМНАТЫ ---
export interface RoomWorkingHour {
	time: {
		// Было Time
		from: string; // Был From
		to: string; // Был To
	};
	day: number[]; // Был Day
}

export interface Room {
	id: string; // ID теперь строка (был number)
	info: {
		// Было Info
		name: string; // Был Name
		description: string; // Был Description
	};
	baseId: string; // ID локации тоже строка
	isArchived: boolean; // Было IsArchived
	workingHours: RoomWorkingHour[]; // Было workingHours
	isActive: boolean; // Оставляем для логики календаря (нужно будет установить при маппинге)
	limitations?: boolean; // <-- Добавлено поле limitations

	// Оставляем старые опциональные поля для совместимости или будущей доработки
	capacity?: number;
	price?: number; // В API цена строки, возможно надо будет согласовать
	equipment?: string[];
	color?: string;
	// name: string; // Удалено, используется info.name
}
// -------------------------------------

// --- ОБНОВЛЕННЫЙ ИНТЕРФЕЙС ДЛЯ ЛОКАЦИИ (БАЗЫ) ---
export interface base {
	id: string; // ID теперь строка (был number)
	info: {
		// Было Info
		name: string; // Был Name
		description: string; // Был Description
	};
	isArchived: boolean; // Было IsArchived
	utcOffset: number; // Было UtcOffset
	sphere: Sphere; // Используем новый интерфейс Sphere (был string)
	logo?: Logo | null; // Новое поле для логотипа базы
	rooms: Room[]; // Используем обновленный интерфейс Room

	// Старые поля, которые нужно будет вычислить или убрать:
	totalRooms: number; // Можно вычислить как rooms.length
	activeRooms: number; // Можно вычислить как rooms.filter(r => r.isActive).length

	// name: string; // Удалено, используется info.name
}
// -----------------------------------------

// Остальные интерфейсы без изменений...

// Базовые типы
/* Старая версия для справки:
export interface base {
	id: number;
	name: string;
	totalRooms: number;
	activeRooms: number;
	rooms: Room[];
	sphere: string; // Категория объекта
}

export interface Room {
	id: number;
	name: string;
	baseId: number;
	capacity?: number;
	price?: number;
	equipment?: string[];
	color?: string;
	isActive: boolean;
}
*/

// Список доступных типов иконок
export type IconType =
	| 'mobile' // Мобильное приложение
	| 'catalog' // Каталог MUSbooking
	| 'widget' // Виджет
	| 'telegram' // Telegram бот
	| 'external_calendar' // Внешний календарь
	| 'comment' // Содержит комментарий
	| 'equip' // Содержит доп. оборудование
	| 'limitations' // Клиент с ограниченными возможностями
	| 'abonement' // Абонемент
	| 'exit' // Выход
	| 'trash' // Очистить календарь
	| 'paymentOnline'
	| 'weblk' // Оплата онлайн
	| 'star' // Отзывы
	| 'bookmark' // Закладка
	| 'inactive_comment' // Не активная иконка коментария
	| 'appevent' // Интеграция с AppEvent
	| 'yclients' // Интеграция с YClients
	| 'gcalendar' // Интергация с GCalendar
	| 'camera_add' // Добавить логотип
	| 'document' // Документ

// Возможные статусы событий
export type EventStatusType =
	| 'without' // OrderStatus = 0 (PreReserv) - Без статуса (серая граница)
	| 'reserved' // OrderStatus = 1 + PaymentStatus = 0 - Зарезервировано, не оплачено (оранжевая граница)
	| 'paid' // OrderStatus = 1 + PaymentStatus = 2 - Зарезервировано, полностью оплачено (зеленая граница)
	| 'paid_partially' // OrderStatus = 1 + PaymentStatus = 1 - Зарезервировано, частично оплачено (градиент зеленый-оранжевый)
	| 'closed' // OrderStatus = 10 - Закрыто (черная граница)
	| 'canceled' // OrderStatus = 11 - Отменено (красная граница)
	| 'new' // Для новых событий (локальное состояние)
	| ''; // Пустое значение для обратной совместимости

// Тип события для использования во всём приложении
export interface Event extends BaseOrder {
	// Поля, унаследованные от BaseOrder:
	// id: string;
	// orderCode?: string | null;
	// dateFrom: string; (ISO UTC)
	// dateTo: string; (ISO UTC)
	// partnerZoneId: string;
	// baseId: string | null;
	// roomId: string;
	// clientId: string | null;
	// clientComment: string | null;
	// employeeComment: string | null;
	// price?: number | string | null;
	// status: EventStatusType;
	// positions?: Array<{ id: string; amount: number; ... }> | null;
	// points?: number | null;
	// accountingPoints?: boolean;
	// accountingForfeits?: boolean;
	// sourceId?: string | null;
	// requestId?: string | null;
	// asReserve?: boolean;

	// Поля, специфичные для отображения в календаре (некоторые вычисляются из BaseOrder)
	date: string; // YYYY-MM-DD формат для дня события (вычисляется из dateFrom)
	startTime?: number; // Число часов от начала дня (например, 10.5 для 10:30) (вычисляется из dateFrom)
	duration?: number; // Длительность в часах (вычисляется из dateFrom и dateTo)

	// Поля для отображения дополнительной информации
	roomName?: string; // Имя комнаты (получается из связи с Room)
	clientName?: string; // Имя клиента (требует отдельной логики получения или будет заглушкой)
	icons?: IconType[]; // Иконки для события
	isSelected?: boolean; // Выбрано ли событие в UI
	selected?: boolean; // Выбрано ли событие из списка заказов (по умолчанию false)
	isEditing?: boolean; // Редактируется ли событие в orderForm (по умолчанию false)
	hasCollision?: boolean; // Есть ли пересечение с другими событиями (для UI)
	notes?: string; // Могут быть employeeComment из BaseOrder или отдельные заметки
	limitations: boolean; // Добавлено для отображения иконки ограничений
	hasError?: boolean; // Флаг для отображения состояния ошибки

	optionId?: string | null;
	humanRange?: number | null;

	// Старые поля, которые могут быть не нужны или уже покрыты BaseOrder/новыми полями
	// timeStart?: string; // Используем startTime (number) и dateFrom (string)
	// timeEnd?: string; // Используем startTime + duration (number) и dateTo (string)
	// workType?: any | null; // Не относится напрямую к отображению события, скорее к форме
	// peopleCount?: number | null; // Аналогично workType
	// base?: { id: string; name: string; }; // baseId и связи для имени локации
	// selectedEquipment?: Record<string, any>; // Для формы
	// selectedServices?: Record<string, any>; // Для формы
	// comment?: string; // Покрывается clientComment/employeeComment
	// promoCode?: string | null; // Для формы
	// repeat?: string; // Для формы
	// repeatStartDate?: string | null; // Для формы
	// repeatEndDate?: string | null; // Для формы
	// color?: string | null; // Может быть частью стилизации на основе статуса или типа
	// baseId?: string; // Покрыто baseId в BaseOrder
	// limitations?: boolean; // Можно добавить в BaseOrder, если это свойство заказа
}

// Типы для представления календаря
export interface Day {
	name: string;
	number: number;
	date: string;
}

export interface EventStatus {
	id: string;
	name: string;
	color: string;
}

// Константы для стилей событий
export const STATUS_BORDER_COLORS = {
	reserved: '#F58628', // Оранжевый
	paid: '#88CA47', // Зеленый
	paid_partially: 'linear-gradient(to right, #88CA47, #F58628)', // Градиент зеленый-оранжевый
	closed: '#000', // Черный
	canceled: '#FF3232', // Красный
	without: '#939292', // Серый
};

// Словарь с описанием статусов
export const STATUS_DESCRIPTIONS = {
	reserved: 'Зарезервировано',
	paid: 'Оплачено полностью',
	paid_partially: 'Оплачено частично',
	closed: 'Закрыто',
	canceled: 'Отменено',
	without: 'Без статуса',
};

// Словарь с текстами для каждого типа иконки
export const ICON_DESCRIPTIONS = {
	mobile: 'Мобильное приложение',
	catalog: 'Каталог MUSbooking',
	widget: 'Виджет',
	telegram: 'Telegram бот',
	comment: 'Содержит комментарий',
	equip: 'Содержит доп. оборудование',
	limitations: 'Клиент с ограничениями',
	abonement: 'Абонемент',
	exit: 'Выход',
	trash: 'Очистить календарь',
	paymentOnline: 'Оплата онлайн',
};

// Типизация для настроек календаря

// Вспомогательные типы для событий календаря
export interface EventResizeData {
	eventId: string; // <-- Изменено на string
	newDuration: number;
}

export interface EventCreateData {
	date: string;
	room: Room; // Используем обновленный интерфейс Room
	startTime: number;
	duration: number;
	hour?: number;
	index?: number;
	event?: MouseEvent;
}

// Тип для отключенных ячеек
export interface DisabledCell {
	date: string;
	hour: number;
	roomId: string; // ID комнаты теперь строка
	reason?: string; // Необязательная причина, почему ячейка отключена
}

// Интерфейс для проверки пересечений событий
export interface EventBoundaries {
	startTime: number;
	duration: number;
	date: string;
	roomId: string; // ID комнаты теперь строка
	room?: string; // Для обратной совместимости, возможно устарело
}

export interface CalendarSettings {
	showQuestions: boolean;
	showList: boolean;
	showArrows: boolean;
	currentView: 'day' | 'week' | 'month';
	currentDate: Date;
	isLegendDrawerOpen: boolean;
	isHorizontalView: boolean;
	isFullscreen: boolean;
	selectedBaseId?: string | null; // ID теперь строка
	selectedBaseIds?: string[]; // ID теперь строка
	selectedEventId?: string | null; // <-- Изменено на string | null
	bases?: base[]; // Используем обновленный интерфейс base
	activeRoomIds: string[]; // ID теперь строка
}

export interface CalendarState {
	settings: CalendarSettings;
	events: Event[]; // Используем обновленный Event
	requests: RequestData[]; // Добавляем массив заявок
	headerHeight: number;
	isInitialized: boolean;
	isLoading: boolean;
	error: string | null;
	headerHeights: {
		day: number;
		object: number;
		room: number;
	};
	isMobile: boolean;
	// Ширина левой панели для горизонтального календаря
	dayLeftPanelWidth: number;
	// Высота строки комнаты в горизонтальном календаре
	roomRowHeight: number;
	// --- ДОБАВЛЯЕМ ПОЛЯ ДЛЯ ПОЛЛИНГА В ИНТЕРФЕЙС --- START ---
	pollingIntervalId: ReturnType<typeof setInterval> | null;
	pollingRateMs?: number; // Делаем опциональным, т.к. есть значение по умолчанию в сторе
	// --- ДОБАВЛЯЕМ ПОЛЯ ДЛЯ ПОЛЛИНГА В ИНТЕРФЕЙС --- END ---
}

// Тип события, как он приходит от API GetOrdersByDate
export interface ApiCalendarEvent {
	Id: { Identity: string }; // ID Заказа/События
	OrderCode?: { Value: string } | null;
	OrderInfo?: {
		ClientComment?: string | null;
		EmployeeComment?: string | null;
	};
	BookingSetting: {
		ClientId?: { Identity: string } | string | null;
		PartnerZoneId: { Identity: string };
		BaseId?: { Identity: string } | null;
		RoomId: { Identity: string };
		Date: {
			From: string;
			To: string;
		};
		Option?: {
			Id?: string | null;
			HumanRange?: number | null;
		} | null;
		Points?: number | null;
		SourceId?: { Identity: string } | null;
		RequestId?: string | null;
		AccountingPoints?: boolean;
		AccountingForfeits?: boolean;
		asReserve?: boolean; // asReserve внутри BookingSetting
	};
	// Новая структура цены с AggregatedPrice
	Price?:
		| {
				AggregatedPrice?: number;
				CalculationFormula?: any | null;
				Price?: any | null;
				Positions?: any | null;
				Time?: any | null;
				IsHotRepetition?: boolean;
				SuggestedInterval?: any | null;
				FailureReason?: any | null;
		  }
		| number
		| string; // Поддержка старого формата для совместимости
	DiscountInfo?: {
		ManualDiscountId?: { Identity: string } | null;
		HotDiscountId?: { Identity: string } | null;
	};
	Status: number | string;
	PaymentStatus?: number;
	PaymentId?: string | null;
	TotalPayed?: number;
	ForfeitSum?: number;
	Lifetime?: { Value: number };
	Template?: { Value: string };
	AuditableInfo?: {
		CreatedAt?: string;
		CreatedBy?: { Identity: string };
		UpdatedAt?: string;
		UpdatedBy?: { Identity: string };
	};
	ArchiveInfo?: {
		IsArchived?: boolean;
		ArchivedAt?: string | null;
	};
	Positions?: Array<{
		Id: string;
		name: string;
		Amount: number;
		price?: number;
	}>;
	DomainEvents?: any[];

	// Добавляем поле для совместимости (добавляется на этапе обработки)
	manualDiscountId?: string | null;
}

// Типы, специфичные для событий (например, для взаимодействия с формами)
export interface EventInteractionData {
	// ... existing code ...
}
