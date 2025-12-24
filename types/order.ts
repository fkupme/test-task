import type { EventStatusType, IconType } from "./calendar";

export interface FormData {
  client: any | null;
  date: string;
  time: string;
  workType: string | null;
  peopleCount: number | null;
  base: string | null;
  selectedEquipment: any[];
  selectedServices: any[];
  comment: string;
  promoCode: string | object;
  repeat: string | null;
  repeatStartDate: string | null;
  repeatEndDate: string | null;
  color: string | null;
}

export interface ItemDescription {
  characteristics: string[];
  text: string;
  image: string;
}

export interface Equipment {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  inStock: number;
  description: ItemDescription;
  quantity?: number;
}

export interface Service {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  inStock: number;
  description: ItemDescription;
  quantity?: number;
}

export interface Promo {
  promo: string;
  time: string;
  pos: string;
  source: string;
  description: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  closed?: number;
  messages?: number;
  points?: number;
  fee?: number;
  tariff?: string | null;
  avatar?: string | null;
}

export interface OrderState {
  isOpen: boolean;
  formData: FormData;
  equipment: Equipment[];
  services: Service[];
  totalByEquipment: number;
  totalByServices: number;
  promo: Promo[];
  clients: Client[];
  filteredClients: Client[];
}

export interface BaseOrder {
  id: string;
  orderCode?: string | null;
  dateFrom: string;
  dateTo: string;
  partnerZoneId: string;
  baseId: string | null;
  roomId: string;
  clientId: string | null;
  clientComment: string | null;
  employeeComment: string | null;
  price?: number | string | null;
  status: EventStatusType;
  positions?: Array<{
    id: string;
    amount: number;
    name?: string;
    price?: number;
    [key: string]: any;
  }> | null;
  points?: number | null;
  accountingPoints?: boolean;
  accountingForfeits?: boolean;
  sourceId?: string | null;
  requestId?: string | null;
  asReserve?: boolean;
  manualDiscountId?: string | null;
  forfeitSum?: number;
}

export interface ApiOrder {
  ClientComment?: string;
  EmployeeComment?: string;
  ClientId?: { Identity: string } | string | null;
  PartnerZoneId?: { Identity: string } | null;
  BaseId?: { Identity: string } | null;
  RoomId?: { Identity: string } | null;
  Date?: { From?: string; To?: string };
  Option?: { Id?: string; HumanRange?: number | null } | null;
  Points?: number | null;
  PaymentStatus?: number | string | null;
  SourceId?: { Identity: string } | null;
  RequestId?: string | null;
  AccountingPoints?: boolean;
  AccountingForfeits?: boolean;
  Price?: number | string | { AggregatedPrice?: number | string } | null;
  Status?: number | string | null;
  CancelReason?: string | null;
  Lifetime?: number | null;
  Template?: string | null;
  AuditableInfo?: {
    CreatedAt?: string;
    CreatedBy?: { Identity?: string } | null;
    UpdatedAt?: string;
    UpdatedBy?: { Identity?: string } | null;
  } | null;
  ArchiveInfo?: { IsArchived?: boolean; ArchivedAt?: string | null } | null;
  Positions?: Array<{ Id: string; Amount: number; PositionType?: number | string }>;
  ForfeitSum?: number;
  TotalPayed?: number;
  ManualDiscountId?: string | null;
  HotDiscountId?: string | null;
  Id?: { Identity: string };
  manualDiscountId?: string | null;
}


// Тип для позиций заказа, как они приходят из API
export interface ApiPosition {
  Id: string;
  name: string;
  Amount: number;
  price?: number;
}

// Интерфейс для данных заказа, передаваемых в форму
export interface FormOrderData {
  id: string;
  orderCode?: string | null;
  dateFrom: string; // ISO строка, напр. "2023-10-26T10:00:00Z"
  dateTo: string; // ISO строка
  partnerZoneId: string;
  baseId?: string | null;
  roomId: string;
  clientId?: string | null;
  // clientName?: string; // Если нужно будет отдельно получать и хранить имя клиента
  clientComment?: string | null;
  employeeComment?: string | null;
  price?: number | string | null;
  status: EventStatusType; // Статус, который понимает форма
  positions: ApiPosition[]; // Полные данные по позициям
  points?: number | null;
  accountingPoints?: boolean;
  accountingForfeits?: boolean; // Для limitations и формы
  sourceId?: string | null;
  requestId?: string | null;
  asReserve?: boolean;
  optionId?: string | null;
  humanRange?: number | null;
  manualDiscountId?: string | null;
  // Дополнительные поля из ApiCalendarEvent, если они нужны форме, можно добавить сюда
  // например, apiStatus?: number | string; // Если форме нужен оригинальный API статус
}

// Расширенный тип заказа с полными данными для отображения в списках
export interface FullOrderData extends BaseOrder {
  // Дополнительные поля для отображения
  roomName?: string;
  baseName?: string;
  clientName?: string;

  // Поля формы заказа
  workType?: string | null;
  humanRange?: number | null;
  optionId?: string | null;

  // Оборудование и услуги
  selectedEquipment?: Record<string, number> | null;
  selectedServices?: Record<string, number> | null;

  // Промокод
  promoCode?: string | null;

  // Поля календаря
  date?: string; // YYYY-MM-DD формат
  startTime?: number;
  duration?: number;
  icons?: IconType[];
  isSelected?: boolean;
  hasCollision?: boolean;
  limitations?: boolean;
  hasError?: boolean;
}
