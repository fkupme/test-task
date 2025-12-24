import type {
  base,
  Room,
  RoomWorkingHour,
  Sphere,
  SphereOption,
} from "~/types/calendar";

// Типы для сырых данных из API (используем any для простоты, но можно создать точные типы)
interface ApiRoomWorkingHour {
  Time: { From: string; To: string };
  Day: number[];
}

interface ApiRoom {
  Id: string;
  Info: { Name: string; Description: string };
  IsArchived: boolean;
  workingHours: ApiRoomWorkingHour[];
  // Другие поля, если есть...
}

interface ApiSphereOption {
  Id: string;
  IsRange: boolean;
  isDefault: boolean; // Обратите внимание на регистр 'isDefault' в вашем примере JSON
}

interface ApiSphere {
  Id: string;
  Info: { Name: string; Description: string };
  from: string | null;
  to: string | null;
  default: string | null;
  limitMonths: number;
  limitDays: number;
  options: ApiSphereOption[];
}

interface ApiBase {
  Id: string;
  Info: { Name: string; Description: string };
  IsArchived: boolean;
  UtcOffset: number;
  Sphere: ApiSphere;
  Rooms: ApiRoom[];
  // Другие поля, если есть...
}

// Функция для маппинга данных комнат
function mapApiRoomToRoom(apiRoom: ApiRoom, baseId: string): Room {
  const mappedWorkingHours: RoomWorkingHour[] = apiRoom.workingHours.map(
    (wh: ApiRoomWorkingHour) => ({
      time: {
        from: wh.Time.From,
        to: wh.Time.To,
      },
      day: wh.Day,
    }),
  );

  // Определяем isActive. Пока простая логика: активна, если не архивирована.
  // Возможно, потребуется более сложная логика или данные из другого места.
  const isActive = !apiRoom.IsArchived;

  return {
    id: apiRoom.Id,
    info: {
      name: apiRoom.Info.Name,
      description: apiRoom.Info.Description,
    },
    baseId: baseId,
    isArchived: apiRoom.IsArchived,
    workingHours: mappedWorkingHours,
    isActive: isActive,
    // Опциональные поля пока не мапим, оставляем undefined
    // capacity: undefined,
    // price: undefined, // Цена в API не видна, возможно нужно будет добавить
    // equipment: undefined,
    // color: undefined,
  };
}

// Функция для маппинга данных сфер
function mapApiSphereToSphere(apiSphere: ApiSphere): Sphere {
  const mappedOptions: SphereOption[] = apiSphere.options.map(
    (opt: ApiSphereOption) => ({
      id: opt.Id,
      isRange: opt.IsRange,
      isDefault: opt.isDefault, // Используем 'isDefault' из примера
    }),
  );

  return {
    id: apiSphere.Id,
    info: {
      name: apiSphere.Info.Name,
      description: apiSphere.Info.Description,
    },
    from: apiSphere.from,
    to: apiSphere.to,
    default: apiSphere.default,
    limitMonths: apiSphere.limitMonths,
    limitDays: apiSphere.limitDays,
    options: mappedOptions,
  };
}

// Основная функция маппинга данных баз (локаций)
export function mapApiBasesToBases(apiBases: ApiBase[]): base[] {
  if (!Array.isArray(apiBases)) {
    console.error(
      "[calendar-mapper] Ошибка: Входные данные не являются массивом.",
      apiBases,
    );
    return [];
  }

  return apiBases.map((apiBase: ApiBase) => {
    const mappedRooms: Room[] = apiBase.Rooms.map((apiRoom: ApiRoom) =>
      mapApiRoomToRoom(apiRoom, apiBase.Id),
    );
    const mappedSphere: Sphere = mapApiSphereToSphere(apiBase.Sphere);

    // Вычисляем totalRooms и activeRooms
    const totalRooms = mappedRooms.length;
    const activeRooms = mappedRooms.filter((room) => room.isActive).length;

    return {
      id: apiBase.Id,
      info: {
        name: apiBase.Info.Name,
        description: apiBase.Info.Description,
      },
      isArchived: apiBase.IsArchived,
      utcOffset: apiBase.UtcOffset,
      sphere: mappedSphere,
      rooms: mappedRooms,
      totalRooms: totalRooms,
      activeRooms: activeRooms,
    };
  });
}

// Пример использования (для отладки):
/*
const apiDataExample = {
    "Id":"85fa5f80-0923-4e4a-87d1-b138dddcad25",
    "Number":5,
    "Info":{ "Name":"PartnerHub ", "Description":"Креативная" },
    "IsArchived":false,
    "bases":[
        {
            "Id":"b67ea4e6-5a7d-4b54-9164-58361b58008e",
            "Info":{"Name":"Студио дэнс","Description":"Нет креативности"},
            "UtcOffset":3,
            "Sphere":{
                "Id":"3ae4c7d4-e2d0-439c-9536-9bd5f818bba4",
                "Info":{"Name":"Музыкальные классы","Description":"Создана для тестирования"},
                "from":null, "to":null, "default":null,
                "limitMonths":12, "limitDays":30,
                "options":[{"Id":"eb69da65-bcb6-4f9b-8b64-8c60e877495f","IsRange":true,"isDefault":true}] // 'isDefault' с маленькой 'd'
            },
            "IsArchived":false,
            "Rooms":[
                {
                    "Id":"8a26ee01-c052-4523-bb1d-ca65e7338e28",
                    "Info":{"Name":"Тестовая","Description":"Room Description"},
                    "workingHours":[
                        {"Time":{"From":"09:00:00","To":"18:00:00"},"Day":[1]},
                        {"Time":{"From":"09:00:00","To":"18:00:00"},"Day":[2]},
                        {"Time":{"From":"09:00:00","To":"18:00:00"},"Day":[3]},
                        {"Time":{"From":"09:00:00","To":"18:00:00"},"Day":[4]},
                        {"Time":{"From":"09:00:00","To":"18:00:00"},"Day":[5]}
                    ],
                    "IsArchived":false
                },
                {
                    "Id":"0da15fc8-cc7d-4eb3-a599-4e0a70a6832d",
                    "Info":{"Name":"Тестовая два","Description":"Room Description"},
                     "workingHours":[
                        {"Time":{"From":"09:00:00","To":"18:00:00"},"Day":[1]},
                        {"Time":{"From":"09:00:00","To":"18:00:00"},"Day":[2]},
                        {"Time":{"From":"09:00:00","To":"18:00:00"},"Day":[3]},
                        {"Time":{"From":"09:00:00","To":"18:00:00"},"Day":[4]},
                        {"Time":{"From":"09:00:00","To":"18:00:00"},"Day":[5]}
                    ],
                    "IsArchived":false
                }
            ]
        }
        // ... другие базы
    ]
};

// const bases = mapApiBasesTobases(apiDataExample.bases);
// console.log(bases);
*/

// Функция для маппинга новых данных событий в формат, совместимый с календарём
export function mapNewEventToCalendarEvent(eventData: any): Event {
  // Преобразование времени из строки в число (часы с начала дня)
  const getHoursFromTimeString = (timeString: string): number => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours + minutes / 60;
  };

  // Вычисление длительности в часах
  const startHours = getHoursFromTimeString(eventData.timeStart);
  const endHours = getHoursFromTimeString(eventData.timeEnd);
  const duration = endHours - startHours;

  // Генерируем строковый ID
  const generatedId =
    eventData.id ||
    `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  return {
    // Сохраняем новые поля
    ...eventData,

    // Добавляем совместимые поля для работы с календарём
    id: String(generatedId), // <-- Убедимся, что ID всегда строка
    baseId: eventData.base?.id || "", // Уже строка
    roomId: eventData.room?.id || eventData.base?.id || "", // <-- Используем room.id если есть, иначе base.id (строка)
    startTime: startHours,
    duration: duration,
    clientName: eventData.client?.name || "",
    status: eventData.status || "reserved",
    icons: [],
    isSelected: false,
    selected: false,
    isEditing: false,
  };
}
