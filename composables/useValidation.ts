import * as yup from "yup";
import { setLocale } from "yup";
import { ERROR_MESSAGES } from "@/constants/error-messages";

// Реэкспортируем константы для обратной совместимости
export { ERROR_MESSAGES };

// Расширяю типы yup для поддержки phoneNumber и passwordStrength
declare module "yup" {
  interface StringSchema {
    phoneNumber(): StringSchema;
    passwordStrength(): StringSchema;
  }
}

// Устанавливаем русскую локализацию для сообщений yup
setLocale({
  mixed: {
    required: ERROR_MESSAGES.REQUIRED,
  },
  string: {
    email: ERROR_MESSAGES.INVALID_EMAIL,
    min: ({ min }) => `Должно быть не менее ${min} символов`,
  },
});

// Добавляем кастомный метод для проверки телефона
yup.addMethod(yup.string, "phoneNumber", function () {
  return this.test("phone", ERROR_MESSAGES.INVALID_PHONE, (value) => {
    // Всегда возвращаем true, отключая валидацию
    return true;
  });
});

// Добавляем кастомный метод для проверки силы пароля
yup.addMethod(yup.string, "passwordStrength", function () {
  return this.test(
    "password-strength",
    ERROR_MESSAGES.PASSWORD_REQUIREMENTS,
    (value) => {
      if (!value) return false;

      // Проверяем минимальную длину
      if (value.length < 8) return false;

      // Проверяем на кириллицу и пробелы
      if (/[а-яА-ЯёЁ\s]/.test(value)) return false;

      // Проверяем наличие заглавной буквы
      const hasUppercase = /[A-Z]/.test(value);

      // Проверяем наличие специальных символов
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

      // Требуем и заглавную букву, и спецсимвол
      return hasUppercase && hasSpecialChar;
    },
  );
});

// Функция для получения оценки надежности пароля (0-4)
function getPasswordStrength(password: string): number {
  if (!password) return 0;

  let strength = 0;
  // Проверяем длину (минимум 8 символов)
  if (password.length >= 8) strength++;
  // Проверяем наличие цифр
  if (/\d/.test(password)) strength++;
  // Проверяем наличие букв разного регистра
  if (/[A-ZА-Я]/.test(password) && /[a-zа-я]/.test(password)) strength++;
  // Проверяем наличие специальных символов
  if (/[^A-Za-zА-Яа-я0-9]/.test(password)) strength++;

  return strength;
}

export function useValidation() {
  // Схема для валидации имени
  const nameSchema = yup
    .string()
    .required()
    .transform((value) => value?.trim()) // Trim spaces from start and end
    .matches(
      /^[a-zA-Zа-яА-ЯёЁ]+(?:[-\s][a-zA-Zа-яА-ЯёЁ]+)*$/,
      ERROR_MESSAGES.INVALID_NAME,
    );

  // Схема для валидации email
  const emailSchema = yup
    .string()
    .required(ERROR_MESSAGES.REQUIRED)
    .test("email-format", ERROR_MESSAGES.INVALID_EMAIL, (value) => {
      if (!value) return false;

      // Проверяем формат email с доменом верхнего уровня
      const hasAtSymbol = value.includes("@");
      const hasDot = value.includes(".");
      const hasTLD = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(
        value,
      );

      // Не показываем ошибку, если пользователь только начал вводить email
      if (value.length < 3) return true;

      // Если есть @ но нет домена - выводим ошибку
      if (hasAtSymbol && !hasTLD) return false;

      return hasTLD;
    });

  // Схема для валидации телефона (формат +кодЦИФРЫ)
  const phoneSchema = yup
    .string()
    .required(ERROR_MESSAGES.REQUIRED)
    .test("phone-format", ERROR_MESSAGES.INVALID_PHONE, (value, context) => {
      console.log("*** PHONE VALIDATION DETAILS ***");
      console.log("Value to validate:", value);

      // Если значение отсутствует, проверка неуспешна
      if (!value) return false;

      // Если это просто "+" без цифр, считаем неполным номером
      if (value === "+") return false;

      // Проверяем, что телефон начинается с "+" и содержит цифры
      const hasPlus = value.startsWith("+");
      const hasDigits = /\+\d+/.test(value);

      // Для российских номеров проверяем минимальную длину
      // (код страны + минимум 8 цифр, чтобы считаться допустимым для проверки)
      if (value.startsWith("+7") && value.replace(/\D/g, "").length < 8) {
        return false;
      }

      // Для других номеров требуем код страны и хотя бы несколько цифр
      return hasPlus && hasDigits && value.replace(/\D/g, "").length >= 3;
    });

  // Схема для валидации пароля (обычная)
  const passwordSchema = yup
    .string()
    .required()
    .min(8, ERROR_MESSAGES.PASSWORD_MIN_LENGTH);

  // Схема для валидации пароля при регистрации (с проверкой силы)
  const registrationPasswordSchema = yup
    .string()
    .required(ERROR_MESSAGES.REQUIRED)
    .min(8, ERROR_MESSAGES.PASSWORD_MIN_LENGTH)
    .passwordStrength()
    .test("password-strength-message", "Проверка силы пароля", (value) => {
      if (!value || value.length < 8) return true;

      // Получаем силу пароля
      const strength = getPasswordStrength(value);

      // Возвращаем результат в зависимости от силы пароля
      if (strength < 3) {
        return new yup.ValidationError(
          strength === 1
            ? ERROR_MESSAGES.PASSWORD_WEAK
            : strength === 2
              ? ERROR_MESSAGES.PASSWORD_MEDIUM
              : ERROR_MESSAGES.PASSWORD_NOT_SECURE,
          value,
          "password",
        );
      }

      return true;
    });

  // Схема для валидации подтверждения пароля
  const confirmPasswordSchema = (passwordField: string) =>
    yup
      .string()
      .required(ERROR_MESSAGES.REQUIRED)
      .oneOf([yup.ref(passwordField)], ERROR_MESSAGES.PASSWORDS_NOT_MATCH);

  // Сохраняем обратную совместимость с предыдущей реализацией
  const required = (v: string) => !!v || ERROR_MESSAGES.REQUIRED;
  const name = (v: string) => {
    if (!v) return ERROR_MESSAGES.REQUIRED;
    // Не показываем ошибку во время ввода, если заканчивается на пробел или дефис
    if (v.endsWith(" ") || v.endsWith("-")) return true;
    return (
      /^[a-zA-Zа-яА-ЯёЁ]+(?:[\s-]+[a-zA-Zа-яА-ЯёЁ]+)*$/.test(v.trim()) ||
      ERROR_MESSAGES.INVALID_NAME
    );
  };
  const email = (v: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || ERROR_MESSAGES.INVALID_EMAIL;
  const phone = (v: string) => {
    // Если значение отсутствует, показываем ошибку обязательного поля
    if (!v) return ERROR_MESSAGES.REQUIRED;

    // Если это просто "+" без цифр, считаем неполным номером
    if (v === "+") return ERROR_MESSAGES.INVALID_PHONE;

    // Проверяем формат номера
    const hasPlus = v.startsWith("+");
    const hasDigits = /\+\d+/.test(v);

    // Для российских номеров проверяем длину
    if (v.startsWith("+7") && v.replace(/\D/g, "").length < 8) {
      return ERROR_MESSAGES.INVALID_RUSSIAN_PHONE;
    }

    // Проверяем общий формат
    return (hasPlus && hasDigits) || ERROR_MESSAGES.INVALID_PHONE;
  };
  const password = (v: string) =>
    v.length >= 8 || ERROR_MESSAGES.PASSWORD_MIN_LENGTH;
  const confirmPassword = (v: string, password: string) =>
    v === password || ERROR_MESSAGES.PASSWORDS_NOT_MATCH;

  // Возвращаем функцию для оценки силы пароля
  const evaluatePasswordStrength = (
    v: string,
  ): { strength: number; message: string } => {
    const strength = getPasswordStrength(v);
    let message = "";

    switch (strength) {
      case 0:
        message = "Очень слабый";
        break;
      case 1:
        message = ERROR_MESSAGES.PASSWORD_WEAK;
        break;
      case 2:
        message = ERROR_MESSAGES.PASSWORD_MEDIUM;
        break;
      case 3:
        message = ERROR_MESSAGES.PASSWORD_GOOD;
        break;
      case 4:
        message = ERROR_MESSAGES.PASSWORD_STRONG;
        break;
    }

    return { strength, message };
  };

  return {
    // Функции валидации для обратной совместимости
    required,
    name,
    email,
    phone,
    password,
    confirmPassword,

    // Функция для проверки силы пароля
    evaluatePasswordStrength,

    // Yup схемы для использования с vee-validate
    nameSchema,
    emailSchema,
    phoneSchema,
    passwordSchema,
    registrationPasswordSchema,
    confirmPasswordSchema,

    // Вспомогательные функции для создания полной схемы
    createLoginSchema: (hasPhone = true, hasEmail = true) => {
      const schema: Record<string, any> = {
        password: passwordSchema,
      };

      if (hasEmail) {
        schema.email = emailSchema;
      }

      if (hasPhone) {
        schema.phone = phoneSchema;
      }

      return yup.object(schema);
    },

    createRegistrationSchema: () => {
      return yup.object({
        firstName: nameSchema,
        lastName: nameSchema,
        email: emailSchema,
        phone: phoneSchema,
        password: registrationPasswordSchema,
        confirmPassword: confirmPasswordSchema("password"),
      });
    },
  };
}
