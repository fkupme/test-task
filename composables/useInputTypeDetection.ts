export function useInputTypeDetection() {
  // Определяет тип ввода по первому символу или формату
  const detectInputType = (value: string): "email" | "phone" | null => {
    if (!value) return null;

    // Проверка на email (первый символ - буква)
    if (/[a-zA-Z]/.test(value.charAt(0))) {
      return "email";
    }

    // Проверка на телефон (начинается с + или цифры)
    if (value.startsWith("+") || /^\d/.test(value)) {
      return "phone";
    }

    return null;
  };

  // Проверяет, что строка похожа на email
  const isLikelyEmail = (value: string): boolean => {
    if (!value) return false;

    // Проверяем наличие символа @
    return value.includes("@");
  };

  // Проверяет, что строка похожа на телефон
  const isLikelyPhone = (value: string): boolean => {
    if (!value) return false;

    // Проверяем начало с + или наличие только цифр и символов форматирования
    // eslint-disable-next-line no-useless-escape
    return value.startsWith("+") || /^[\d\s\(\)\-]+$/.test(value);
  };

  // Получение подсказки для поля ввода в зависимости от типа
  const getPlaceholderByType = (type: "email" | "phone" | null): string => {
    switch (type) {
      case "email":
        return "example@mail.ru";
      case "phone":
        return "(XXX) XXX-XX-XX";
      default:
        return "Введите email или телефон";
    }
  };

  // Получение метки для поля ввода в зависимости от типа
  const getLabelByType = (type: "email" | "phone" | null): string => {
    switch (type) {
      case "email":
        return "Email";
      case "phone":
        return "Телефон";
      default:
        return "Email или телефон";
    }
  };

  return {
    detectInputType,
    isLikelyEmail,
    isLikelyPhone,
    getPlaceholderByType,
    getLabelByType,
  };
}
