import type { Sphere, UpdateSphereDto, SphereSetting } from '@/types/sphere'

export interface SphereFormState {
  name: string;
  description: string;
  order: number;
  color: string;
  termValue: number;
  termUnit: 'day' | 'month';
  type: 1 | 3;
  optionIds: string[];
  defaultOptionId: string | '';
  peopleDefault: number;
  archived: boolean;
}

export function mapSphereToForm(s: Sphere): SphereFormState {
  console.log('🔍 mapSphereToForm input sphere.Type:', s.Type, 'typeof:', typeof s.Type)
  
  const defaultOption = s.Options.find(o => o.IsDefault)
  const optionIds = s.Options.filter(o => !o.IsDefault).map(o => o.Id)
  let termUnit: 'day' | 'month' = 'day'
  let termValue = 14
  if (s.DefaultLimitDays) { termUnit = 'day'; termValue = s.DefaultLimitDays }
  else if (s.DefaultLimitMonth) { termUnit = 'month'; termValue = s.DefaultLimitMonth }
  
  const mappedType = (Number(s.Type) || 1) as 1 | 3
  console.log('🔍 mapSphereToForm mapped type:', mappedType)
  return {
    name: s.Name || '',
    description: s.Description || '',
    order: s.Index ?? 0,
    color: s.Color || '',
    termUnit,
    termValue,
    type: mappedType,
    optionIds,
    defaultOptionId: defaultOption?.Id || '',
    peopleDefault: 1,
    archived: !!s.IsArchived
  }
}

export function buildUpdateDiff(
  sphereId: string,
  original: SphereFormState,
  current: SphereFormState,
  originalSettings?: SphereSetting[] | null,
  optionRangeTrueName?: string,
  optionRangeFalseName?: string
): UpdateSphereDto {
  const diff: any = { SphereId: sphereId }
  const fields: (keyof SphereFormState)[] = ['name','description','color','termUnit','termValue','type','optionIds','defaultOptionId','archived','order']
  
  // Map form -> dto keys
  function applyLimit(){
    if (current.termUnit === 'day') { 
      diff.DefaultLimitDays = current.termValue
      diff.DefaultLimitMonth = null 
    } else { 
      diff.DefaultLimitMonth = current.termValue
      diff.DefaultLimitDays = null 
    }
  }
  
  for (const k of fields) {
    if (JSON.stringify(original[k]) !== JSON.stringify(current[k])) {
      switch(k){
        case 'name': 
          diff.Name = current.name || null
          break
        case 'description': 
          diff.Description = current.description || null
          break
        case 'color': 
          diff.Color = current.color || null
          break
        case 'type': 
          // Тип уже число, просто присваиваем
          diff.Type = current.type
          break
        case 'order':
          diff.Index = current.order
          break
        case 'optionIds': 
          // Формируем массив объектов {Id, Index}
          diff.Options = current.optionIds.map((id, index) => ({ Id: id, Index: index }))
          break
        case 'defaultOptionId': 
          diff.DefaultOption = current.defaultOptionId || null
          break
        case 'archived':
          diff.Archive = current.archived
          break
        case 'termUnit':
        case 'termValue': 
          applyLimit()
          break
      }
    }
  }
  
  // Archive всегда отправляем независимо от изменения, чтобы сервер имел актуальный статус
  diff.Archive = current.archived
  
  // Всегда отправляем лимиты, даже если они не изменились
  if (!diff.DefaultLimitDays && !diff.DefaultLimitMonth) {
    if (current.termUnit === 'day') { 
      diff.DefaultLimitDays = current.termValue
      diff.DefaultLimitMonth = null 
    } else { 
      diff.DefaultLimitMonth = current.termValue
      diff.DefaultLimitDays = null 
    }
  }
  
  // Всегда отправляем опции, даже если они не изменились
  if (!diff.Options) {
    diff.Options = current.optionIds.map((id, index) => ({ Id: id, Index: index }))
  }
  if (!diff.DefaultOption) {
    diff.DefaultOption = current.defaultOptionId || null
  }
  
  // Добавляем названия диапазонов если переданы
  if (optionRangeTrueName !== undefined) {
    diff.OptionRangeTrueName = optionRangeTrueName
  }
  if (optionRangeFalseName !== undefined) {
    diff.OptionRangeFalseName = optionRangeFalseName
  }
  
  // Ensure Options array exists if DefaultOption changed
  if (diff.DefaultOption && (!diff.Options || !diff.Options.length) && current.optionIds.length === 0) {
    diff.Options = []
  }
  
  // Remove default option from Options if present
  if (diff.DefaultOption && Array.isArray(diff.Options)) {
    diff.Options = diff.Options.filter((opt: any) => opt.Id !== diff.DefaultOption)
  }
  
  // Всегда прикладываем Settings если были в оригинале — чтобы не срабатывал каскад удаления на backend
  if (originalSettings && Array.isArray(originalSettings)) {
    diff.Settings = originalSettings.map(s => ({ Id: s.Id, Type: s.Type }))
  }
  
  return diff as UpdateSphereDto
}
