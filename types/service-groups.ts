// Типы для системы групп услуг и их подгрупп

// Енум для типов групп услуг (соответствует backend)
// Может расширяться в будущем добавлением новых типов
export enum ServiceGroupType {
  DanceStyles = 1,
  MusicalInstruments = 2,
  VocalTechniques = 3,
  TheaterArts = 4,
  VisualArts = 5
  // Здесь могут быть добавлены новые типы в будущем
  // Example: Photography = 6, SportActivities = 7, etc.
}

// Динамический маппинг типов для отображения
// Поддерживает любые типы, даже те которых нет в енуме
export const ServiceGroupTypeNames: Record<number, string> = {
  [ServiceGroupType.DanceStyles]: 'Стили танцев',
  [ServiceGroupType.MusicalInstruments]: 'Музыкальные инструменты',
  [ServiceGroupType.VocalTechniques]: 'Музыкальные жанры',
  [ServiceGroupType.TheaterArts]: 'Виды деятельности',
  [ServiceGroupType.VisualArts]: 'Уровень навыков'
  // Новые типы будут автоматически обрабатываться системой
}

// Функция для получения названия типа с fallback для неизвестных типов
export function getServiceGroupTypeName(type: ServiceGroupType | number): string {
  return ServiceGroupTypeNames[type] || `Категория ${type}`;
}

// Основные типы данных

export interface ServiceGroupId {
  Identity: string;
}

export interface ClientServiceGroupId {
  Identity: string;
}

export interface ServiceGroupInfo {
  Name: string;
  Description: string;
  IsActive: boolean;
}

export interface ServiceSubGroupInfo {
  Name: string;
  Description: string;
  IsActive: boolean;
}

// Основная модель группы услуг
export interface ServiceGroup {
  Id: ServiceGroupId;
  GroupInfo: ServiceGroupInfo;
  ServiceGroupType: ServiceGroupType;
  SubGroups?: ClientServiceGroup[]; // Опционально для случаев когда нужны подгруппы
}

// Модель подгруппы услуг
export interface ClientServiceGroup {
  Id: ClientServiceGroupId;
  SubGroupInfo: ServiceSubGroupInfo;
  ParentServiceGroupId: ServiceGroupId;
}

// DTO для создания группы услуг
export interface CreateServiceGroupDto {
  GroupInfo: {
    Name: string;
    Description: string;
  };
  ServiceGroupType: ServiceGroupType;
}

// DTO для обновления группы услуг
export interface UpdateServiceGroupDto {
  Id: ServiceGroupId;
  GroupInfo: {
    Name: string;
    Description: string;
  };
  ServiceGroupType?: ServiceGroupType;
}

// DTO для создания подгруппы услуг
export interface CreateClientServiceGroupDto {
  SubGroupInfo: {
    Name: string;
    Description: string;
  };
  ParentGroupId: ServiceGroupId; // renamed to match backend contract
}

// DTO для обновления подгруппы услуг
export interface UpdateClientServiceGroupDto {
  Id: ClientServiceGroupId;
  SubGroupInfo: {
    Name: string;
    Description: string;
  };
  ParentGroupId?: ServiceGroupId; // renamed accordingly
}

// Ответ на запрос получения групп с подгруппами
export interface GetServiceGroupsWithSubGroupsResponse {
  ServiceGroups: ServiceGroupWithSubGroupsDto[];
}

export interface ServiceGroupWithSubGroupsDto {
  Id: ServiceGroupId;
  GroupInfo: ServiceGroupInfo;
  ServiceGroupType: ServiceGroupType;
  SubGroups: SubGroupDto[];
}

export interface SubGroupDto {
  Id: ClientServiceGroupId;
  SubGroupInfo: ServiceSubGroupInfo;
}

// Интерфейс для отображения в UI
export interface ServiceGroupSection {
  type: ServiceGroupType;
  title: string;
  groups: ServiceGroup[];
  isLoading: boolean;
  error?: string;
}

// Модель для элемента в UI (может быть группой или подгруппой)
export interface ServiceGroupItem {
  id: string;
  name: string;
  description?: string;
  type: 'group' | 'subgroup';
  serviceGroupType?: ServiceGroupType;
  parentId?: string; // Для подгрупп - ID родительской группы
}

// Форма для создания/редактирования
export interface ServiceGroupFormData {
  name: string;
  description: string;
  serviceGroupType?: ServiceGroupType;
  parentServiceGroupId?: string; // Для подгрупп
}

// Состояние загрузки для UI
export interface LoadingState {
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

// Ошибки для UI
export interface ErrorState {
  general?: string;
  create?: string;
  update?: string;
  delete?: string;
  fetch?: string;
}