// Основная модель заявки
export interface RequestData {
  id: string;
  status: RequestStatus;
  clientComment: string;
  employeeComment: string;
  clientId: string;
  partnerZoneId: string;
  baseId: string;
  roomId: string;
  dateFrom: string;
  dateTo: string;
  optionId: string;
  optionHumanRange: number | null;
  points: number | null;
  sourceId: string;
  positions: RequestPosition[];
  orderId?: string; // GUID заказа, если заявка конвертирована

  // UI дополнительные поля
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAvatar?: string | null;
  studioName?: string;
  roomName?: string;
  workType?: string;
  peopleCount?: number;
  price?: number;
  createdAt?: string;
  processingComment?: string;
  employeeId?: string;
}

// Позиция в заявке
export interface RequestPosition {
  id: string;
  amount: number;
}

// Статусы заявок (соответствуют бэкенду C#)
export enum RequestStatus {
  NEW = 1, // Новая заявка
  IN_PROGRESS = 2, // Заявка взята в работу
  CONFIRMED = 3, // Заявка подтверждена
  CANCELLED = 4, // Заявка отменена
  REJECTED = 11, // Заявка отклонена
  UNPROCESSED = 12, // Заявка не была обработана в срок (автоматический статус)
  CONVERTED_TO_ORDER = 15, // Заявка конвертирована в заказ (заказ создается с OrderStatus = 1 - Резерв)
}

// --- НОВЫЕ ИНТЕРФЕЙСЫ ДЛЯ ФИЛЬТРАЦИИ ЗАЯВОК --- START ---

// Параметры для фильтрации заявок
export interface GetRequestsByFilterParams {
  roomIds?: string[] | null;
  sourceId?: string | null;
  positionType?: number | string | null;
  requestStatus?: number | string | null;
  positionId?: string | null;
  partnerZoneId?: string | null;
  clientId?: string | null;
  from?: Date | string | null;
  to?: Date | string | null;
}

// Результат фильтрации заявок
export interface GetRequestsByFilterQueryResult {
  RequestAggregates: RequestAggregate[];
}

// Агрегат заявки (соответствует C# RequestAggregate)
export interface RequestAggregate {
  Id: { Identity: string };
  RequestInfo: RequestInfo;
  BookingSetting: BookingSetting;
  Status: number; // RequestStatus enum value
  AuditableInfo: AuditableInfo;
  ProcessingInfo: RequestProcessingInfo;
  Price: CalculateOrderQueryResponse | null;
  DiscountInfo: DiscountInfo;
  ForfeitSum: number;
  Positions: RequestPosition[];
  CanBeTakenInProgress: boolean;
  IsProcessingExpired: boolean;
}

// Информация о заявке
export interface RequestInfo {
  ClientComment: string;
  EmployeeComment?: string | null;
  ManualDiscountId?: string | null;
  AccountingForfeits: boolean;
}

// Настройки бронирования
export interface BookingSetting {
  ClientId?: { Identity: string } | null;
  PartnerZoneId: { Identity: string };
  BaseId: { Identity: string };
  RoomId: { Identity: string };
  Date: {
    From: string;
    To: string;
  };
  Option: {
    Id: string;
    HumanRange?: number | null;
  };
  Points?: number | null;
  SourceId: { Identity: string };
  RequestId?: string | null;
  AccountingPoints: boolean;
  AccountingForfeits: boolean;
}

// Аудит информация
export interface AuditableInfo {
  CreatedAt: string;
  CreatedBy: { Identity: string };
  UpdatedAt: string;
  UpdatedBy: { Identity: string };
}

// Информация об обработке заявки
export interface RequestProcessingInfo {
  CreatedAt: string;
  TakenInProgressAt?: string | null;
  CompletedAt?: string | null;
  ExpiresAt?: string | null;
  AssignedEmployeeId?: { Identity: string } | null;
  ProcessingComment?: string | null;
  ConvertedOrderId?: string | null;
  IsExpired: boolean;
  IsTimeExpired: boolean;
  HasExpired: boolean;
}

// Ответ расчета заказа
export interface CalculateOrderQueryResponse {
  AggregatedPrice: number;
  Forfeit?: number | null;
  Points?: number | null;
  CalculationFormula: string;
  Price?: any | null;
  Positions?: any | null;
  Time?: any | null;
  IsHotRepetition: boolean;
  SuggestedInterval?: any | null;
  FailureReason?: string | null;
}

// Информация о скидках
export interface DiscountInfo {
  ManualDiscountId?: string | null;
  HotDiscountId?: string | null;
}

// --- НОВЫЕ ИНТЕРФЕЙСЫ ДЛЯ ФИЛЬТРАЦИИ ЗАЯВОК --- END ---

// Тело запроса создания заявки
export interface CreateRequestBody {
  clientComment: string;
  employeeComment: string;
  clientId: string;
  partnerZoneId: string;
  baseId: string;
  roomId: string;
  dateFrom: string;
  dateTo: string;
  optionId: string;
  optionHumanRange: number | null;
  points: number | null;
  sourceId: string;
  positions: RequestPosition[];
}

// Параметры для получения заявок по статусу
export interface GetRequestsByStatusParams {
  status: number;
  pageNumber: number;
  pageSize: number;
}

// Ответ API со списком заявок
export interface RequestsResponse {
  requests: RequestData[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

// Ответ API с одной заявкой
export interface RequestResponse {
  request: RequestData;
}

// Ответы для действий с заявками
export interface RequestActionResponse {
  success: boolean;
  message?: string;
  orderId?: string; // для ConvertRequestToOrder
}
