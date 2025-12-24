import { countries } from "@/constants/countries";

export function usePhoneFormatting() {
  // Форматирование номера телефона по маске
  const formatPhoneByMask = (phoneDigits: string, mask: string): string => {
    let formatted = "";
    let digitIndex = 0;

    // Проходим по каждому символу маски
    for (let i = 0; i < mask.length && digitIndex < phoneDigits.length; i++) {
      if (mask[i] === "#") {
        // Заменяем # на цифру, если она есть
        if (digitIndex < phoneDigits.length) {
          formatted += phoneDigits[digitIndex];
          digitIndex++;
        } else {
          // Не добавляем символы форматирования после последней цифры
          break;
        }
      } else {
        // Другие символы добавляем как есть, только если есть еще цифры
        if (digitIndex < phoneDigits.length) {
          formatted += mask[i];
        }
      }
    }

    return formatted;
  };

  // Форматирование российского номера телефона
  const formatRussianPhoneNumber = (digits: string, withCode = true) => {
    // Ограничиваем количество цифр до 10 (без кода страны)
    if (digits.length > 10) {
      digits = digits.substring(0, 10);
    }

    // Используем маску из списка стран
    const russianCountry = countries.find((c) => c.code === "+7");
    if (russianCountry && russianCountry.mask) {
      // Получаем маску без кода страны
      const maskWithoutCode = russianCountry.mask.substring(3); // Отрезаем "+7 "

      // Форматируем только цифры по маске
      let formattedPhone = "";
      let digitIndex = 0;

      // Добавляем открывающую скобку если даже нет цифр
      if (maskWithoutCode.startsWith("(")) {
        formattedPhone = "(";
      }

      for (
        let i = 0;
        i < maskWithoutCode.length && digitIndex < digits.length;
        i++
      ) {
        if (maskWithoutCode[i] === "#") {
          if (digitIndex < digits.length) {
            formattedPhone += digits[digitIndex];
            digitIndex++;
          } else {
            break;
          }
        } else if (digitIndex > 0 && digitIndex < digits.length) {
          // Добавляем символы форматирования только между цифрами
          formattedPhone += maskWithoutCode[i];
        } else if (i === 0 && maskWithoutCode[i] === "(") {
          // Добавляем открывающую скобку всегда
          formattedPhone = "(";
        }
      }

      // Добавляем код страны, если нужно
      return withCode ? "+7 " + formattedPhone : formattedPhone;
    }

    // Запасной метод форматирования
    let formatted = withCode ? "+7" : "";

    if (digits.length > 0 || withCode) {
      formatted += " (";

      if (digits.length > 0) {
        formatted += digits.substring(0, Math.min(3, digits.length));
      }

      if (digits.length > 3) {
        formatted += ") " + digits.substring(3, Math.min(6, digits.length));

        if (digits.length > 6) {
          formatted += "-" + digits.substring(6, Math.min(8, digits.length));

          if (digits.length > 8) {
            formatted += "-" + digits.substring(8, Math.min(10, digits.length));
          }
        }
      } else if (digits.length === 3) {
        formatted += ")";
      }
    }

    return formatted;
  };

  // Универсальное форматирование международного номера
  const formatInternationalPhoneNumber = (
    country: (typeof countries)[0],
    phoneDigits: string,
  ) => {
    // Если для страны определена маска, используем её
    if (country.mask) {
      return formatPhoneByMask(phoneDigits, country.mask);
    }

    // Запасной метод форматирования
    // Базовое форматирование: код страны + пробел + группы по 3-4 цифры
    let formatted = country.code + " ";

    // Ограничиваем длину в соответствии с максимальной длиной для страны
    const maxDigits = Math.min(phoneDigits.length, country.maxLength);

    // Форматирование по группам (для простоты используем группы по 3 или 4 цифры)
    let i = 0;
    while (i < maxDigits) {
      const groupSize =
        i === 0 ? Math.min(3, maxDigits) : Math.min(3, maxDigits - i);
      formatted += phoneDigits.substring(i, i + groupSize);
      i += groupSize;

      if (i < maxDigits) {
        formatted += " ";
      }
    }

    return formatted;
  };

  // Основная функция форматирования телефона
  const formatPhoneNumber = (
    value: string,
    country?: (typeof countries)[0],
  ) => {
    if (!value) return "";

    // Проверяем, содержит ли значение уже отформатированные элементы
    // eslint-disable-next-line no-useless-escape
    const hasFormattedParts = /[\(\)\-\s]/.test(value);

    // Если значение уже отформатировано и мы его редактируем,
    // извлекаем только цифры и переформатируем полностью
    if (hasFormattedParts) {
      let digits = value.replace(/\D/g, "");

      // Определяем страну по текущему формату
      const currentCountry = country;

      if (currentCountry) {
        // Если страна уже определена, используем её формат
        const codeDigits = currentCountry.code.replace("+", "");

        // Проверяем, есть ли код страны в начале
        if (digits.startsWith(codeDigits)) {
          // Извлекаем только номер без кода страны
          const phoneDigits = digits.substring(codeDigits.length);
          // Ограничиваем длину и форматируем
          const limitedDigits = phoneDigits.substring(
            0,
            Math.min(currentCountry.maxLength, phoneDigits.length),
          );

          // Форматируем и обновляем значение
          if (currentCountry.code === "+7") {
            return formatRussianPhoneNumber(limitedDigits, true);
          } else if (currentCountry.mask) {
            const formattedPhone = formatPhoneByMask(
              limitedDigits,
              currentCountry.mask.substring(currentCountry.code.length),
            );
            return currentCountry.code + " " + formattedPhone;
          }
        }
      }

      // Если не смогли определить страну, используем российский формат по умолчанию
      if (digits.length > 0) {
        if (digits.startsWith("7")) {
          digits = digits.substring(1);
        }
        return formatRussianPhoneNumber(digits, true);
      }
    }

    // Дальше логика для неотформатированных значений
    // Если ввод начинается с цифры (без +), добавляем +7 и используем российский формат
    if (/^\d/.test(value)) {
      const digits = value.replace(/\D/g, "");

      // Для России используем маску
      const russianCountry = countries.find((c) => c.code === "+7");
      if (russianCountry) {
        // Правильно применяем маску без кода страны
        return formatRussianPhoneNumber(digits, true);
      }
      return formatRussianPhoneNumber(digits, true);
    }

    // Если значение только "+", просто возвращаем его без изменений
    if (value === "+") {
      return "+";
    }

    // Если нет символа +, добавляем его
    if (!value.startsWith("+")) {
      value = "+" + value;
    }

    const digits = value.replace(/\D/g, "");
    // Используем выбранную страну или определяем по цифрам
    const useCountry = country;

    // Если страна не определена или нет цифр после "+", просто возвращаем значение с плюсом
    if (!useCountry || !digits) {
      return value;
    }

    const codeDigits = useCountry.code.replace("+", "");
    let phoneDigits = "";

    // Если цифры начинаются с кода страны, извлекаем только номер телефона
    if (digits.startsWith(codeDigits)) {
      phoneDigits = digits.substring(codeDigits.length);
    } else {
      // Если нет, то это все телефонные цифры
      phoneDigits = digits;
    }

    // Используем маску страны для форматирования
    if (useCountry.mask) {
      // Если маска определена, используем её
      return formatPhoneByMask(phoneDigits, useCountry.mask);
    } else if (useCountry.code === "+7") {
      // Запасной вариант для России
      return formatRussianPhoneNumber(phoneDigits, true);
    } else {
      // Запасной вариант для других стран
      return formatInternationalPhoneNumber(useCountry, phoneDigits);
    }
  };

  return {
    formatPhoneByMask,
    formatRussianPhoneNumber,
    formatInternationalPhoneNumber,
    formatPhoneNumber,
  };
}

// Функция для преобразования строки телефона из API в PhoneData формат
export const parsePhoneFromApi = (phoneString: string): PhoneData => {
  if (!phoneString) {
    return { phone: "", code: "+7", locale: "RU" };
  }

  // Убираем все нецифровые символы
  let digitsOnly = phoneString.replace(/\D/g, "");

  // Нормализация российских номеров:
  // Если в строке по ошибке продублировали код страны (+7+7...),
  // отрезаем лишние ведущие семёрки пока длина больше 11.
  while (digitsOnly.startsWith("7") && digitsOnly.length > 11) {
    digitsOnly = digitsOnly.substring(1);
  }

  // Часто встречается запись с 8 вначале — конвертируем в 7
  if (digitsOnly.startsWith("8") && digitsOnly.length === 11) {
    digitsOnly = "7" + digitsOnly.substring(1);
  }

  // Если номер начинается с 7 и длина 11 цифр - это российский номер
  if (digitsOnly.startsWith("7") && digitsOnly.length === 11) {
    return {
      phone: digitsOnly.substring(1), // убираем первую 7
      code: "+7",
      locale: "RU",
    };
  }

  // Если номер 10 цифр - считаем российским без кода
  if (digitsOnly.length === 10) {
    return {
      phone: digitsOnly,
      code: "+7",
      locale: "RU",
    };
  }

  // Для других случаев тоже считаем российским
  return {
    phone: digitsOnly,
    code: "+7",
    locale: "RU",
  };
};

// Функция для преобразования PhoneData в строку для API
export const formatPhoneForApi = (phoneData: PhoneData): string => {
  if (!phoneData.phone) return "";

  // Возвращаем только цифры номера
  return phoneData.phone.replace(/\D/g, "");
};

interface PhoneData {
  phone: string;
  code: string;
  locale: string;
}
