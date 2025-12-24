/**
 * Типы для работы с PartnerZonesService
 */

/**
 * Тип группы позиций
 */
export enum PositionGroupType {
  eqip = 0,
  serv = 1,
  // Добавьте другие типы при необходимости
}

/**
 * Группа позиций
 */
export interface PositionGroup {
  id: string;
  name: string;
  description: string;
  sphereIds: string[];
  type: PositionGroupType;
  archived: boolean;
}

/**
 * Запрос на получение групп позиций
 */
export interface GetPositionGroupsWebRequest {
  ids: string[];
  type: PositionGroupType;
  showArchived: boolean;
}

/**
 * Ответ на запрос получения групп позиций
 */
export interface GetPositionGroupsWebResponse {
  groups: PositionGroup[];
}

/**
 * Запрос на обновление группы позиций
 */
export interface UpdatePositionGroupRequest {
  positionGroupId: string;
  name: string;
  description: string;
  type: PositionGroupType;
  spheres: string[];
  archive: boolean;
}

/**
 * Запрос на создание группы позиций
 */
export interface CreatePositionGroupRequest {
  name: string;
  description: string;
  isArchived: boolean;
  type: PositionGroupType;
  spheres: string[];
}

/**
 * Запрос на получение сфер
 */
export interface GetSpheresRequest {
  id: string | null;
  isArchive: boolean;
}

/**
 * Файл сферы
 */
export interface SphereFile {
  key: string;
  name: string;
  parentId: string;
  size: number;
  contentType: string;
  lastModified: string;
  url: string;
  priority: number;
  fileType: number;
}

/**
 * Фича сферы
 */
export interface SphereFeature {
  id: string;
  featureTypeId: string;
  name: string;
  description: string;
  isArchived: boolean;
}

/**
 * Опция сферы
 */
export interface SphereOption {
  id: string;
  name: string;
  isRange: boolean;
  index: number;
  defaultValue: number;
  isDefault: boolean;
  isArchived: boolean;
}

/**
 * Группа позиций сферы
 */
export interface SpherePositionGroup {
  id: string;
  name: string;
  description: string;
  isArchived: boolean;
}

/**
 * Полная информация о сфере
 */
export interface SphereDetail {
  id: string;
  name: string;
  description: string;
  color: string;
  index: number;
  type: number;
  defaultLimitDays: number;
  defaultLimitMonth: number;
  optionRangeTrueName: string;
  optionRangeFalseName: string;
  features: SphereFeature[];
  options: SphereOption[];
  positionGroups: SpherePositionGroup[];
  isArchived: boolean;
  files: SphereFile[];
}

/**
 * Ответ на запрос получения сфер
 */
export interface GetSpheresResponse extends Array<SphereDetail> {}
