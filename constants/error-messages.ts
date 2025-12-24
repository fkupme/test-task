/**
 * Константы для сообщений об ошибках в приложении
 * Централизованное хранение текстов ошибок обеспечивает консистентность интерфейса
 * и упрощает локализацию приложения в будущем
 */

export const ERROR_MESSAGES = {
  // Общие ошибки валидации
  REQUIRED: "Обязательное поле",
  INVALID_NAME: "Некорректное имя",
  INVALID_EMAIL: "Введите корректный email с доменом (.ru, .com и т.д.)",
  INVALID_EMAIL_CYRILLIC: "Email не может содержать кириллицу",
  INVALID_PHONE: "Введите корректный номер телефона",
  INVALID_RUSSIAN_PHONE: "Введите полный номер в формате +7 (XXX) XXX-XX-XX",
  INVALID_SPECIAL_CHARS: "Название не должно содержать специальные символы",

  // Ошибки пароля
  PASSWORD_MIN_LENGTH: "Пароль должен содержать минимум 8 символов",
  PASSWORD_REQUIREMENTS: "Добавьте заглавную букву и спецсимвол",
  PASSWORD_WEAK: "Слабый пароль",
  PASSWORD_MEDIUM: "Средний пароль",
  PASSWORD_GOOD: "Хороший пароль",
  PASSWORD_STRONG: "Отличный пароль",
  PASSWORDS_NOT_MATCH: "Пароли не совпадают",
  PASSWORD_NOT_SECURE: "Пароль недостаточно надежный",
  PASSWORD_INVALID_CHARS:
    "Пароль может содержать только латинские буквы, цифры и спецсимволы",

  // Ошибки авторизации
  AUTH_INVALID_CREDENTIALS: "Неверный логин или пароль",
  AUTH_ACCOUNT_NOT_FOUND: "Аккаунт не найден",
  AUTH_EMPTY_CREDENTIALS: "Введите логин и пароль",
  AUTH_SERVER_ERROR: "Ошибка сервера авторизации",
  AUTH_TOKEN_EXPIRED: "Время сессии истекло, войдите снова",
  AUTH_BLOCKED: "Аккаунт заблокирован",

  // Ошибки регистрации
  REGISTER_EMAIL_EXISTS: "Пользователь с таким email уже существует",
  REGISTER_PHONE_EXISTS: "Пользователь с таким телефоном уже существует",
  REGISTER_WEAK_PASSWORD: "Используйте более надежный пароль",
  REGISTER_SERVER_ERROR: "Ошибка при регистрации аккаунта",

  // Ошибки восстановления пароля
  RECOVERY_EMAIL_NOT_FOUND: "Email не найден",
  RECOVERY_CODE_INVALID: "Неверный код подтверждения",
  RECOVERY_CODE_EXPIRED: "Код подтверждения устарел",
  RECOVERY_SERVER_ERROR: "Ошибка сервера при восстановлении пароля",

  // Общие ошибки сервера
  SERVER_ERROR: "Ошибка сервера, попробуйте позже",
  NETWORK_ERROR: "Ошибка сети, проверьте подключение",
  REQUEST_TIMEOUT: "Превышено время ожидания ответа от сервера",

  // Ошибки API
  API_ERROR: "Ошибка при выполнении запроса",
  API_DATA_ERROR: "Ошибка в полученных данных",
  API_UNAUTHORIZED: "Требуется авторизация",

  // Ошибки банковских реквизитов
  INVALID_BIK: "БИК должен содержать 9 цифр",
  INVALID_BANK_ACCOUNT: "Банковский счет должен содержать 20 цифр",
  INVALID_CORRESPONDENT_ACCOUNT:
    "Корреспондентский счет должен содержать 20 цифр",

  // Ошибки организационных данных
  INVALID_INN: "ИНН должен содержать 10 или 12 цифр",
  INVALID_KPP: "КПП должен содержать 9 цифр",
  INVALID_OGRN: "ОГРН должен содержать 13 или 15 цифр",
  INVALID_OKVED: "ОКВЭД должен быть строго в формате XX.XX.XX",
  INVALID_DATE_FORMAT: "Введите дату в формате ДД.ММ.ГГГГ",
  INVALID_DATE: "Введите корректную дату",
  COMPANY_NAME_TOO_SHORT:
    "Название организации должно содержать минимум 3 символа",

  // Ошибки базовой информации
  STUDIO_NAME_REQUIRED: "Название студии обязательно",
  STUDIO_NAME_TOO_SHORT: "Название должно содержать минимум 2 символа",
  STUDIO_NAME_TOO_LONG: "Название не должно превышать 50 символов",
  INVALID_URL: "Введите корректный URL (например: https://example.com)",
  INVALID_TELEGRAM: "Некорректный формат Telegram (@username)",
  TELEGRAM_AT_REQUIRED: "Telegram должен начинаться с @",

  // --- Price editor specific ---
  PRICE_EMPTY_GRID: "Пустая сетка цен",
  PRICE_PARTIAL_GRID: "Есть пустые ячейки",
  PRICE_MISSING_WORK_OPTION: "Нет условия для вида работ",
  PRICE_PEOPLE_RANGE_GAP: "Пропущен диапазон кол-ва человек",
  PRICE_UNSAVED: "Изменения не сохранены",
  PRICE_NO_OBJECTS: "Не добавлены площадки/комнаты",
  PRICE_MISSING_PRE_TODAY: "Нет цены для режима оплаты заранее или день в день",
  PRICE_MISSING_PRE: "Не настроена цена 'заранее'",
  PRICE_MISSING_TODAY: "Не настроена цена 'день в день'",
  PRICE_PRE_TODAY_NAME_MISMATCH: "Названия цен 'заранее' и 'день в день' должны совпадать",
  PRICE_PRE_TODAY_OPTION_MISMATCH: "Вид работ 'заранее' и 'день в день' должны совпадать",
  PRICE_PRE_TODAY_DATE_MISMATCH: "Диапазон дат 'заранее' и 'день в день' должен совпадать",
  PRICE_PRE_NOT_CONFIGURED: "Не настроена цена заранее",
  PRICE_TODAY_NOT_CONFIGURED: "Не настроена цена день в день",
};

/**
 * Возвращает текст ошибки на основе кода или ключа ошибки
 * @param errorKey Ключ ошибки из объекта ERROR_MESSAGES или код ошибки с бэкенда
 * @param fallbackMessage Сообщение по умолчанию, если ключ не найден
 * @returns Текст ошибки для отображения
 */
export function getErrorMessage(
  errorKey: string,
  fallbackMessage: string = ERROR_MESSAGES.SERVER_ERROR,
): string {
  // Если есть точное соответствие в ERROR_MESSAGES
  if (errorKey in ERROR_MESSAGES) {
    return ERROR_MESSAGES[errorKey as keyof typeof ERROR_MESSAGES];
  }

  // Анализируем ключ ошибки для выбора соответствующего сообщения

  // Ошибки авторизации
  if (
    errorKey.includes("login") ||
    errorKey.includes("credential") ||
    errorKey.includes("не найден")
  ) {
    return ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS;
  }

  // Ошибки регистрации
  if (errorKey.includes("exists") || errorKey.includes("already")) {
    if (errorKey.includes("email")) {
      return ERROR_MESSAGES.REGISTER_EMAIL_EXISTS;
    }
    if (errorKey.includes("phone")) {
      return ERROR_MESSAGES.REGISTER_PHONE_EXISTS;
    }
  }

  // Возвращаем сообщение по умолчанию, если не найдено соответствие
  return fallbackMessage;
}
