<template>
  <div class="authorization">
    <UIUseMeta :meta="meta" />
    <h1 class="authorization__title">Вход</h1>

    <form class="authorization__form" @submit.prevent="login">
      <!-- Умный инпут для определения типа авторизации -->
      <AuthSmartAuthInput
        v-model="identifier"
        name="identifier"
        class="mb-4"
        autocomplete="username"
        @keydown="(e: KeyboardEvent) => e.key === ' ' && e.preventDefault()"
        @type-change="handleTypeChange"
      />

      <UITextField
        v-model="password"
        label="Пароль"
        placeholder="Пароль"
        :type="showPassword ? 'text' : 'password'"
        :rules="[validator.required]"
        class="mb-2"
        :append-inner-icon="
          showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
        "
        autocomplete="current-password"
        bg-color="#F5F5F5"
        :error-messages="getPasswordError"
        @keydown="(e: KeyboardEvent) => e.key === ' ' && e.preventDefault()"
        @input="handlePasswordInput"
        @click:append-inner="showPassword = !showPassword"
      />

      <UIButton
        type="submit"
        :loading="loading"
        :disabled="!isFormValid"
        variant="primary"
        block
        class="mt-4"
      >
        Продолжить
      </UIButton>

      <UIButton
        type="submit"
        variant="secondary"
        block
        class="mt-4"
        @click.prevent="$router.push('/auth/registration')"
      >
        Регистрация
      </UIButton>

      <UIButton
        variant="text"
        block
        class="mt-2"
        @click.prevent="forgotPassword"
      >
        Забыл пароль
      </UIButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useForm } from "vee-validate";
import { computed, ref, watch } from "vue";
import * as yup from "yup";
import { ERROR_MESSAGES, useValidation } from "@/composables/useValidation";
import { countries } from "@/constants/countries";
import { ERROR_MESSAGES as APP_ERROR_MESSAGES } from "@/constants/error-messages";
import { useAuthStore } from "@/stores/auth";
import { useNotificationStore } from "@/stores/notification";

const meta = {
	title: "Авторизация",
	description: "Авторизация",
	image: "/images/auth/authorization.png",
};

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const validator = useValidation();
const loading = computed(() => authStore.loading);
const _error = computed(() => authStore.error);

// Состояние формы
const identifier = ref("");
const password = ref("");
const identifierType = ref<"email" | "phone" | null>(null);
const showPassword = ref(false);

// Валидация формы с vee-validate
const validationSchema = computed(() => {
  return yup.object({
    identifier: yup
      .string()
      .required(ERROR_MESSAGES.REQUIRED)
      .test("identifier-validation", (value, context) => {
        if (!value)
          return new yup.ValidationError(
            ERROR_MESSAGES.REQUIRED,
            value,
            "identifier",
          );

        // Не показываем ошибку, если пользователь только начал вводить
        if (value.length < 3) return true;

        if (identifierType.value === "email") {
          // Используем email схему из композабла
          const isValid =
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
          if (!isValid) {
            return new yup.ValidationError(
              ERROR_MESSAGES.INVALID_EMAIL,
              value,
              "identifier",
            );
          }
          return true;
        }

        if (identifierType.value === "phone") {
          // Проверяем телефон без показа ошибки при вводе
          if (value === "+7" || value === "+") return true;

          // Получаем только цифры из номера
          const digits = value.replace(/\D/g, "");

          // Для российских номеров
          if (value.startsWith("+7")) {
            if (digits.length !== 11) {
              return new yup.ValidationError(
                ERROR_MESSAGES.INVALID_RUSSIAN_PHONE,
                value,
                "identifier",
              );
            }
          } else {
            // Для других номеров требуем минимум 10 цифр
            if (digits.length < 10) {
              return new yup.ValidationError(
                ERROR_MESSAGES.INVALID_PHONE,
                value,
                "identifier",
              );
            }
          }
          return true;
        }

        // Если тип не определен, разрешаем любое значение
        return true;
      }),
    password: validator.passwordSchema,
  });
});

// Инициализируем форму с реактивными значениями
const form = useForm({
  initialValues: {
    identifier: "",
    password: "",
  },
  validationSchema: validationSchema,
});

// Используем значения и ошибки из формы
const { handleSubmit, errors, validate, values: _values, setFieldValue } = form;

// Выполняем валидацию при изменениях и синхронизируем значения
watch(
  [identifier, password, identifierType],
  async () => {
    // Обновляем значения в форме
    setFieldValue("identifier", identifier.value);
    setFieldValue("password", password.value);

    // Запускаем валидацию
    await validate();
  },
  { immediate: true },
);

// Обработчик изменения типа ввода
function handleTypeChange(type: "email" | "phone" | null) {
  identifierType.value = type;
}

// Проверка валидности формы - упрощаем и делаем менее строгой
const isFormValid = computed(() => {
  // Базовая проверка заполненности пароля
  const hasPassword = !!password.value && password.value.length >= 4;

  // Проверка идентификатора (email или телефон)
  let isIdentifierValid = false;

  if (identifierType.value === "email" && identifier.value.length > 3) {
    // Для email используем простую проверку формата
    isIdentifierValid = /^.+@.+\..+$/.test(identifier.value);
  } else if (identifierType.value === "phone") {
    // Для телефона используем проверку соответствия стандартам стра  ны
    // Получаем только цифры
    const digits = identifier.value.replace(/\D/g, "");

    // Для российских номеров проверяем наличие 10 цифр (без кода)
    if (identifier.value.startsWith("+7")) {
      // Проверяем, начинается ли с 7 и убираем её
      const phoneDigits = digits.startsWith("7") ? digits.substring(1) : digits;
      isIdentifierValid = phoneDigits.length === 10;
    } else {
      // Для других номеров ищем страну по коду
      let foundCountry = null;

      // Перебираем все страны и ищем подходящую по коду
      for (const country of countries) {
        const countryCodeDigits = country.code.replace("+", "");
        if (digits.startsWith(countryCodeDigits)) {
          foundCountry = country;
          break;
        }
      }

      if (foundCountry) {
        // Проверяем, соответствует ли длина номера требованиям страны
        const codeDigits = foundCountry.code.replace("+", "");
        const phoneDigits = digits.substring(codeDigits.length);
        isIdentifierValid = phoneDigits.length === foundCountry.maxLength;
      } else {
        // Если страна не определена, требуем хотя бы базовый формат
        isIdentifierValid =
          identifier.value.startsWith("+") && digits.length >= 5;
      }
    }
  }

  // Форма валидна, если и идентификатор, и пароль валидны
  return isIdentifierValid && hasPassword;
});

// Добавляем новые функции для обработки пароля
const getPasswordError = computed(() => {
  if (!password.value) return "";

  // Проверяем на кириллицу
  if (/[а-яА-ЯёЁ]/.test(password.value)) {
    return ERROR_MESSAGES.PASSWORD_INVALID_CHARS;
  }

  return authStore.error ? APP_ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS : "";
});

function handlePasswordInput(event: Event) {
  const input = event.target as HTMLInputElement;
  // Удаляем пробелы и кириллицу из значения
  const cleanValue = input.value.replace(/[а-яА-ЯёЁ\s]/g, "");
  if (cleanValue !== input.value) {
    password.value = cleanValue;
  }
}

// Обработчик входа
const login = handleSubmit(async () => {
  try {
    // Проверяем валидность формы перед отправкой
    if (!isFormValid.value) {
      return;
    }

    if (identifierType.value === "email") {
      await authStore.login({
        email: identifier.value,
        password: password.value,
      });
    } else if (identifierType.value === "phone") {
      // Телефон уже форматирован правильно в v-model, поэтому передаем как есть
      console.log("Отправка номера телефона:", identifier.value);

      await authStore.login({
        phone: identifier.value, // Передаем полный номер с форматированием
        password: password.value,
      });
    } else {
      // Если тип не определен, пытаемся по email
      await authStore.login({
        email: identifier.value,
        password: password.value,
      });
    }

    // Перенаправление при успешном входе
    navigateTo("/");
  } catch (err) {
    console.error("Ошибка входа:", err);

    // Показываем уведомление с ошибкой из authStore или используем стандартное сообщение
    if (authStore.error) {
      notificationStore.showError(authStore.error.shortMessage);
    } else {
      notificationStore.showError(APP_ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS);
    }
  }
});

// Функция для обработки клика по "Забыли пароль"
function forgotPassword() {
  navigateTo("/auth/password-recovery");
}
</script>

<style lang="scss" scoped>
.authorization {
  background-color: #fff;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  :deep(.v-field__append-inner) {
    .v-icon {
      color: #939292;
      opacity: 0.7;
      transition: all 0.3s ease;
    }
  }

  &__title {
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 24px;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__forgot-password {
    text-align: right;
    margin-top: -8px;
    margin-bottom: 8px;
  }

  &__register {
    text-align: center;
    margin-top: 16px;
    font-size: 14px;
  }

  &__link {
    color: #4285f4;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
