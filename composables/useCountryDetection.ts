import { countries } from "@/constants/countries";

export function useCountryDetection() {
  // Определение страны по первым цифрам
  const detectCountryByDigits = (digits: string) => {
    if (!digits) return null;

    // Сначала ищем точное совпадение
    const exactMatch = countries.find((country) =>
      digits.startsWith(country.code.replace("+", "")),
    );
    if (exactMatch) return exactMatch;

    // Если нет точного совпадения, ищем частичное
    const partialMatches = countries.filter((country) =>
      country.code.replace("+", "").startsWith(digits),
    );

    // Если найдено только одно частичное совпадение, используем его
    if (partialMatches.length === 1) {
      return partialMatches[0];
    }

    // Если есть несколько частичных совпадений, не выбираем ни одно
    if (partialMatches.length > 1) {
      return null;
    }

    // Возвращаем Россию только если нет других совпадений и это явно российский код
    if (digits.startsWith("7")) {
      return countries.find((c) => c.code === "+7") || null;
    }

    // В других случаях не выбираем страну автоматически
    return null;
  };

  // Получение страны по коду
  const getCountryByCode = (code: string) => {
    if (!code) return null;

    // Убираем + если он есть
    const normalizedCode = code.startsWith("+") ? code : "+" + code;

    return countries.find((country) => country.code === normalizedCode) || null;
  };

  // Получение дефолтной страны (Россия)
  const getDefaultCountry = () => {
    return countries.find((c) => c.code === "+7") || null;
  };

  return {
    detectCountryByDigits,
    getCountryByCode,
    getDefaultCountry,
  };
}
