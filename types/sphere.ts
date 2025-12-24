// Central sphere domain types
export interface SphereFeature {
  Id: string;
  FeatureTypeId?: string;
  Name: string;
  Description: string | null;
  isArchived?: boolean;
}

export interface SphereOption {
  Id: string;
  Name: string;
  IsRange?: boolean;
  IsDefault?: boolean;
  DefaultValue?: number | string;
  isArchived?: boolean;
}

export interface SpherePositionGroup {
  Id: string;
  Name: string;
  Description: string;
  isArchived?: boolean;
}

export interface Sphere {
  Id: string;
  Name: string;
  Description: string;
  Color: string;
  Type: string | number | null;
  Index: number;
  DefaultLimitDays: number | null;
  DefaultLimitMonth: number | null;
  RangeFrom: number | null;
  RangeTo: number | null;
  DefaultRangeValue: number | null;
  Features: SphereFeature[];
  Options: SphereOption[];
  PositionGroups: SpherePositionGroup[];
  Settings?: SphereSetting[]; // Пара значений по умолчанию (Id + Type)
  IsArchived: boolean;
  OptionRangeTrueName: string | null;
  OptionRangeFalseName: string | null;
}

export interface SphereSetting {
  Id: string;
  Type: number; // 0 / 1 ... как в примере backend
}

export interface Option {
  Id: string;
  Index: number;
}

export interface Range {
  From: number | null;
  To: number | null;
}

export interface CreateSphereDto {
  Name: string;
  Description?: string | null;
  Color?: string | null;
  Type?: number | string | null;
  Index?: number | null;
  DefaultLimitDays?: number | null;
  DefaultLimitMonth?: number | null;
  Features?: string[] | null;
  Options?: Option[] | null;
  DefaultOption?: string | null;
  PositionGroups?: string[] | null;
  OptionRangeTrueName?: string | null;
  OptionRangeFalseName?: string | null;
  Range: Range | null;
}

export interface UpdateSphereDto {
  SphereId: string;
  Name?: string | null;
  Description?: string | null;
  Color?: string | null;
  Type?: number | string | null;
  Index?: number | null;
  DefaultLimitDays?: number | null;
  DefaultLimitMonth?: number | null;
  RangeFrom?: number | null;
  RangeTo?: number | null;
  DefaultRangeValue?: number | null;
  Features?: string[] | null;
  Options?: string[] | null;
  DefaultOption?: string | null;
  Settings?: { Id: string; Type: number }[] | null;
  Archive?: boolean | null;
}
