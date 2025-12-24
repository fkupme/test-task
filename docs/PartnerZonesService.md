# PartnerZonesService API Documentation

## Обзор

`PartnerZonesService` - сервис для работы с зонами партнеров, группами позиций и сферами.

**Путь к файлу:** `classes/api/PartnerZonesService.ts`

**Типы:** `types/partner-zones.ts`

## Инициализация

```typescript
import { PartnerZonesService } from '@/classes/api/PartnerZonesService'
import type { ApiGatewayClient } from '@/types/api.gateway'

const nuxtApp = useNuxtApp()
const service = new PartnerZonesService(nuxtApp.$apiGateway as ApiGatewayClient)
```

---

## Методы

### 1. GetPositionGroupsWeb

Получение групп позиций для веб-интерфейса.

**Endpoint:** `/rpc/PartnerZonesService/GetPositionGroupsWeb`

**Сигнатура:**
```typescript
async getPositionGroupsWeb(
  request: GetPositionGroupsWebRequest
): Promise<GetPositionGroupsWebResponse>
```

**Параметры запроса:**

```typescript
interface GetPositionGroupsWebRequest {
  ids: string[];              // Массив ID групп позиций
  type: PositionGroupType;    // Тип группы позиций (0 = UNKNOWN)
  showArchived: boolean;      // Показывать архивные группы
}
```

**Ответ:**

```typescript
interface GetPositionGroupsWebResponse {
  groups: PositionGroup[];
}

interface PositionGroup {
  id: string;
  name: string;
  description: string;
  sphereIds: string[];
  type: PositionGroupType;
  archived: boolean;
}
```

**Пример использования:**

```typescript
const response = await service.getPositionGroupsWeb({
  ids: ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
  type: PositionGroupType.UNKNOWN,
  showArchived: true
})

console.log(response.groups)
```

---

### 2. UpdatePositionGroup

Обновление существующей группы позиций.

**Endpoint:** `/rpc/PartnerZonesService/UpdatePositionGroup`

**Сигнатура:**
```typescript
async updatePositionGroup(
  request: UpdatePositionGroupRequest
): Promise<void>
```

**Параметры запроса:**

```typescript
interface UpdatePositionGroupRequest {
  positionGroupId: string;   // ID группы для обновления
  name: string;              // Название группы
  description: string;       // Описание группы
  type: PositionGroupType;   // Тип группы
  spheres: string[];         // Массив ID сфер
  archive: boolean;          // Архивировать группу
}
```

**Ответ:** `void` (метод ничего не возвращает)

**Пример использования:**

```typescript
await service.updatePositionGroup({
  positionGroupId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  name: "Updated Group Name",
  description: "Updated description",
  type: PositionGroupType.UNKNOWN,
  spheres: ["3fa85f64-5717-4562-b3fc-2c963f66afa6"],
  archive: false
})
```

---

### 3. CreatePositionGroup

Создание новой группы позиций.

**Endpoint:** `/rpc/PartnerZonesService/CreatePositionGroup`

**Сигнатура:**
```typescript
async createPositionGroup(
  request: CreatePositionGroupRequest
): Promise<void>
```

**Параметры запроса:**

```typescript
interface CreatePositionGroupRequest {
  name: string;              // Название группы
  description: string;       // Описание группы
  isArchived: boolean;       // Создать как архивную
  type: PositionGroupType;   // Тип группы
  spheres: string[];         // Массив ID сфер
}
```

**Ответ:** `void` (метод ничего не возвращает)

**Пример использования:**

```typescript
await service.createPositionGroup({
  name: "New Position Group",
  description: "Description for new group",
  isArchived: false,
  type: PositionGroupType.UNKNOWN,
  spheres: ["3fa85f64-5717-4562-b3fc-2c963f66afa6"]
})
```

---

### 4. GetSpheres

Получение списка сфер с полной детализацией.

**Endpoint:** `/rpc/PartnerZonesService/GetSpheres`

**Сигнатура:**
```typescript
async getSpheres(
  request: GetSpheresRequest
): Promise<GetSpheresResponse>
```

**Параметры запроса:**

```typescript
interface GetSpheresRequest {
  id: string | null;    // ID сферы (всегда передается null)
  isArchive: boolean;   // Включить архивные сферы
}
```

**Ответ:**

```typescript
type GetSpheresResponse = SphereDetail[]

interface SphereDetail {
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

interface SphereFeature {
  id: string;
  featureTypeId: string;
  name: string;
  description: string;
  isArchived: boolean;
}

interface SphereOption {
  id: string;
  name: string;
  isRange: boolean;
  index: number;
  defaultValue: number;
  isDefault: boolean;
  isArchived: boolean;
}

interface SpherePositionGroup {
  id: string;
  name: string;
  description: string;
  isArchived: boolean;
}

interface SphereFile {
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
```

**Пример использования:**

```typescript
const spheres = await service.getSpheres({
  id: null,           // Всегда null
  isArchive: true     // Включить архивные
})

spheres.forEach(sphere => {
  console.log(`Сфера: ${sphere.name}`)
  console.log(`Фич: ${sphere.features.length}`)
  console.log(`Опций: ${sphere.options.length}`)
  console.log(`Групп позиций: ${sphere.positionGroups.length}`)
  console.log(`Файлов: ${sphere.files.length}`)
})
```

---

## Типы данных

### PositionGroupType

```typescript
enum PositionGroupType {
  UNKNOWN = 0
  // Другие типы добавляются по необходимости
}
```

---

## Обработка ошибок

Все методы могут выбросить `ApiError` при возникновении ошибок:

```typescript
try {
  await service.createPositionGroup({...})
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message)
    console.error('Code:', error.code)
    console.error('Details:', error.details)
  }
}
```

---

## Полный пример использования

```typescript
<script setup lang="ts">
import { PartnerZonesService } from '@/classes/api/PartnerZonesService'
import type { ApiGatewayClient } from '@/types/api.gateway'
import { PositionGroupType } from '@/types/partner-zones'

const nuxtApp = useNuxtApp()
const service = new PartnerZonesService(nuxtApp.$apiGateway as ApiGatewayClient)

// Получить все сферы
const loadSpheres = async () => {
  const spheres = await service.getSpheres({
    id: null,
    isArchive: true
  })
  return spheres
}

// Получить группы позиций
const loadGroups = async () => {
  const response = await service.getPositionGroupsWeb({
    ids: ["group-id"],
    type: PositionGroupType.UNKNOWN,
    showArchived: false
  })
  return response.groups
}

// Создать новую группу
const createGroup = async () => {
  await service.createPositionGroup({
    name: "Новая группа",
    description: "Описание",
    isArchived: false,
    type: PositionGroupType.UNKNOWN,
    spheres: ["sphere-id"]
  })
}

// Обновить группу
const updateGroup = async (groupId: string) => {
  await service.updatePositionGroup({
    positionGroupId: groupId,
    name: "Обновленное название",
    description: "Обновленное описание",
    type: PositionGroupType.UNKNOWN,
    spheres: ["sphere-id"],
    archive: false
  })
}

onMounted(async () => {
  const spheres = await loadSpheres()
  const groups = await loadGroups()
  
  console.log('Loaded:', { spheres, groups })
})
</script>
```

---

## См. также

- [AbstractApiService](../classes/api/AbstractApiService.ts) - базовый класс для всех API сервисов
- [AuthService](../classes/api/AuthService.ts) - пример другого сервиса
- [API Gateway Types](../types/api.gateway.ts) - типы API Gateway
