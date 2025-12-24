<template>
  <div class="sms-confirmation">
    <h1 class="sms-confirmation__title">Регистрация</h1>

    <p class="sms-confirmation__description">
      Мы отправили вам СМС с кодом<br >
      на номер {{ maskedPhone }}
    </p>

    <div class="sms-confirmation__code-input" :class="{ error: isInputError }">
      <v-otp-input
        v-model="smsCode"
        :length="4"
        type="number"
        :disabled="isVerifying"
        autofocus
        variant="underlined"
        @update:model-value="onCodeChange"
        @finish="verifyCode"
      />
    </div>

    <p v-if="verificationError" class="sms-confirmation__error">
      {{ verificationError }}
    </p>

    <div class="sms-confirmation__timer">
      <span v-if="timeLeft > 0"
      >Новый код через {{ formatTime(timeLeft) }}</span
      >
      <UIButton
        v-else
        variant="primary"
        class="sms-confirmation__resend-button"
        :loading="isResending"
        @click="resendCode"
      >
        Отправить новый код
      </UIButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineEmits,
  defineProps,
  onBeforeUnmount,
  onMounted,
  ref,
} from "vue";
import { useRoute } from "vue-router";
import { useAuthStore } from "~/stores/auth";

interface Props {
  phone: string;
  email?: string;
  countryCode?: string;
  isPartner?: boolean;
}

// Интерфейсы для типизации ответов API
interface ApiSuccessResponse {
  success: true;
  user?: {
    id: string;
    email?: string;
    phone?: string;
    name?: string;
    [key: string]: any;
  };
}

interface ApiErrorResponse {
  success: false;
  error: string;
  status?: number;
}

type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "verified", _value: boolean): void;
  (e: "error", _message: string): void;
  (e: "back"): void;
}>();

const authStore = useAuthStore();
const smsCode = ref("");
const timeLeft = ref(59); // 59 секунд
const timer = ref<ReturnType<typeof setInterval> | null>(null);
const isVerifying = ref(false);
const isResending = ref(false);
const verificationError = ref("");
const isInputError = ref(false);
const route = useRoute(); // Объявляем route на уровне компонента

// Переменная для предотвращения двойных запросов
let verificationInProgress = false;

// Маскирование номера телефона
const maskedPhone = computed(() => {
  // Если телефон формата +7 (XXX) XXX-XX-XX, то маскируем до +7 (XXX) ***-**-XX

  return `${props.countryCode} (${props.phone.substring(0, 3)})***-**-${props.phone.substring(8, 10)}`;
});

// Форматирование времени
function formatTime(seconds: number): string {
  return `0:${seconds.toString().padStart(2, "0")}`;
}

// Запуск таймера
function startTimer() {
  timeLeft.value = 59;

  // Очищаем предыдущий таймер, если он был
  if (timer.value) clearInterval(timer.value);

  // Создаем новый таймер
  timer.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
    } else {
      if (timer.value) clearInterval(timer.value);
    }
  }, 1000);
}

// Извлечение данных телефона
function extractPhoneData() {
  // Приоритет 1: props.countryCode (прямая передача через пропсы)
  if (props.countryCode) {
    return {
      phoneNumber: props.phone,
      countryCode: props.countryCode,
    };
  }

  // Приоритет 2: route.query.countryCode (из URL)
  const countryCodeFromQuery = route?.query?.countryCode as string;
  if (countryCodeFromQuery) {
    return {
      phoneNumber: props.phone.replace(/\D/g, ""),
      countryCode: countryCodeFromQuery,
    };
  }

  // Приоритет 3: извлечение из номера телефона
  const cleanPhone = props.phone.replace(/\D/g, "");
  const countryCode = props.phone.startsWith("+")
    ? props.phone.substring(0, props.phone.length - cleanPhone.length + 1)
    : "+7"; // По умолчанию +7 для России

  console.log("[SmsConfirmation] extractPhoneData:", {
    phoneNumber: cleanPhone,
    countryCode: countryCode,
    originalPhone: props.phone,
  });

  return {
    phoneNumber: cleanPhone,
    countryCode,
  };
}

// Обработка изменения кода OTP
function onCodeChange(value: string) {
  console.log("[SmsConfirmation] Код изменен:", value);
  isInputError.value = false;

  // Если введены все 4 цифры, запускаем проверку кода
  if (value.length === 4) {
    console.log("[SmsConfirmation] Введены все 4 цифры, запускаем проверку");
    verifyCode();
  }
}

// Проверка кода
async function verifyCode() {
  // Защита от дублирующих запросов
  if (verificationInProgress) {
    console.log(
      "[SmsConfirmation] Запрос уже выполняется, игнорируем повторный вызов",
    );
    return;
  }

  if (smsCode.value.length !== 4) return;

  verificationInProgress = true;
  isVerifying.value = true;
  verificationError.value = "";

  try {
    const { phoneNumber, countryCode } = extractPhoneData();

    console.log("[SmsConfirmation] Отправка запроса верификации кода:", {
      phoneNumber,
      countryCode,
      verificationCode: smsCode.value,
    });

    // Верификация партнера через прокси API
    const response = await $fetch<ApiResponse>("/api/auth/verify-partner", {
      method: "POST",
      body: {
        phoneNumber,
        countryCode,
        verificationCode: smsCode.value,
      },
    });

    console.log("[SmsConfirmation] Ответ сервера:", response);

    if (response.success) {
      // Уведомляем о успешной верификации
      console.log("[SmsConfirmation] Код успешно подтвержден");
      emit("verified", true);
    } else {
      // Обработка ошибки от сервера
      console.error("[SmsConfirmation] Ошибка от сервера:", response.error);
      isInputError.value = true;

      // Используем точное сообщение от сервера, если оно понятное
      let userFriendlyError = response.error || "Неверный код подтверждения";

      // Небольшая корректировка для окончательного вывода
      if (
        userFriendlyError.includes("сессия истекла") ||
        userFriendlyError.includes("не найден")
      ) {
        // Добавляем предложение повторить регистрацию для понимания пользователем
        userFriendlyError += ". Пожалуйста, повторите регистрацию.";
      }

      verificationError.value = userFriendlyError;
      setTimeout(() => {
        smsCode.value = "";
        isInputError.value = false;
      }, 1000);
      emit("error", userFriendlyError);
    }
  } catch (error: any) {
    // Обработка ошибки запроса
    console.error("[SmsConfirmation] Ошибка при проверке кода:", error);

    // Выводим подробную информацию об ошибке в консоль
    if (error.data) {
      console.error("[SmsConfirmation] Данные ошибки:", error.data);
    }

    // Используем точное сообщение от сервера, если оно есть
    let userFriendlyError =
      "Ошибка при проверке кода. Пожалуйста, попробуйте позже.";

    // Если есть конкретная ошибка от сервера, используем её
    if (error?.data?.error) {
      // Если это не техническая ошибка, показываем пользователю
      if (
        !error.data.error.includes("System.") &&
        !error.data.error.includes("Exception")
      ) {
        userFriendlyError = error.data.error;
      } else {
        console.error(
          "[SmsConfirmation] Техническая ошибка:",
          error.data.error,
        );
      }
    }

    verificationError.value = userFriendlyError;
    emit("error", userFriendlyError);
    smsCode.value = "";
  } finally {
    setTimeout(() => {
      // Сбрасываем флаг только после небольшой задержки, чтобы предотвратить
      // слишком быстрые повторные нажатия
      verificationInProgress = false;
      isVerifying.value = false;
    }, 1000);
  }
}

// Повторная отправка кода
async function resendCode() {
  isResending.value = true;
  verificationError.value = "";

  try {
    const { phoneNumber, countryCode } = extractPhoneData();
    console.log("[SmsConfirmation] Отправка запроса повторной отправки кода:", {
      phoneNumber,
      countryCode,
    });

    // Получаем данные регистрации из хранилища (должно восстанавливать из localStorage при необходимости)
    // На случай, если метод еще не обновился, используем прямую проверку localStorage
    let savedRegData = null;

    // Пробуем получить данные из свойства объекта
    if (
      typeof authStore.registrationData === "object" &&
      authStore.registrationData !== null
    ) {
      console.log(
        "[SmsConfirmation] Получены данные из authStore.registrationData",
      );
      savedRegData = authStore.registrationData;
    }
    // Пробуем получить данные методом, если он существует
    else if (typeof authStore.getRegistrationData === "function") {
      console.log(
        "[SmsConfirmation] Используем метод authStore.getRegistrationData()",
      );
      savedRegData = authStore.getRegistrationData();
    }
    // Запасной вариант - восстановление из localStorage
    else {
      console.log(
        "[SmsConfirmation] Методы недоступны, пробуем восстановить из localStorage",
      );
      try {
        const storedData = localStorage.getItem("registration_form_data");
        if (storedData) {
          savedRegData = JSON.parse(storedData);
          console.log("[SmsConfirmation] Данные восстановлены из localStorage");
        }
      } catch (e) {
        console.error(
          "[SmsConfirmation] Ошибка восстановления из localStorage:",
          e,
        );
      }
    }

    if (savedRegData) {
      console.log("[SmsConfirmation] Найдены данные регистрации:", {
        ...savedRegData,
        password: savedRegData.password ? "***" : "",
      });

      // Убедимся, что данные телефона актуальны
      if (
        savedRegData.phoneNumber !== phoneNumber ||
        savedRegData.countryCode !== countryCode
      ) {
        console.log(
          "[SmsConfirmation] Обновляем данные телефона в сохраненных данных",
        );
        savedRegData.phoneNumber = phoneNumber;
        savedRegData.countryCode = countryCode;

        // Сохраняем обновленные данные обратно в localStorage
        try {
          localStorage.setItem(
            "registration_form_data",
            JSON.stringify(savedRegData),
          );

          // Если метод существует, используем его
          if (typeof authStore.saveRegistrationData === "function") {
            authStore.saveRegistrationData(savedRegData);
          }
          // Иначе просто записываем в свойство
          else if ("registrationData" in authStore) {
            authStore.registrationData = savedRegData;
          }
        } catch (e) {
          console.error("[SmsConfirmation] Ошибка сохранения данных:", e);
        }
      }

      // Повторно отправляем запрос регистрации, чтобы получить новый код
      await authStore.register(savedRegData);
      console.log("[SmsConfirmation] Новый код запрошен через register");
    } else {
      console.error(
        "[SmsConfirmation] Данные регистрации не найдены! Невозможно отправить новый код",
      );
      verificationError.value =
        "Ошибка при отправке нового кода. Пожалуйста, вернитесь к форме регистрации.";
      emit("error", verificationError.value);
      return;
    }

    // Сбрасываем поле ввода и запускаем таймер
    smsCode.value = "";
    startTimer();
  } catch (error: any) {
    // Обработка ошибки запроса
    console.error("[SmsConfirmation] Ошибка при отправке нового кода:", error);
    verificationError.value =
      error?.data?.error || error?.message || "Ошибка при отправке нового кода";
    emit("error", verificationError.value);
  } finally {
    isResending.value = false;
  }
}

// Возврат на предыдущий шаг
function _goBack() {
  emit("back");
}

// Хуки жизненного цикла
onMounted(() => {
  startTimer();
});

onBeforeUnmount(() => {
  if (timer.value) clearInterval(timer.value);
});
</script>

<style lang="scss" scoped>
.sms-confirmation {
  background-color: #fff;
  border-radius: 12px;
  padding: 32px 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  text-align: center;

  &__title {
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 24px;
    color: #000;
  }

  &__description {
    text-align: center;
    margin-bottom: 32px;
    color: #000;
    line-height: 1.5;
    font-size: 15px;
  }

  &__code-input {
    margin-bottom: 24px;
    background-color: #f5f4f4;
    border-radius: 12px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;

    :deep(.v-otp-input) {
      margin-inline: auto;
      width: 50%;
      max-width: 280px;
      justify-content: center;
      gap: 8px;
    }

    :deep(.v-field) {
      width: 30px !important;
      height: 30px !important;
      padding: 0 !important;
    }
    input {
      text-align: center !important;
      font-size: 24px !important;
      font-weight: 600 !important;
      color: #ff0000 !important;
    }

    &__outline {
      border: none !important;
    }

    &.error {
      :deep(.v-field) {
        border-color: #e52222 !important;
      }
      :deep(input) {
        color: #ff0000 !important;
      }
    }
  }

  &__error {
    color: #ff0000;
    font-size: 14px;
    margin: -8px 0 16px;
    text-align: center;
  }

  &__timer {
    text-align: center;
    font-size: 14px;
    color: #000;
    margin-top: 16px;
  }

  &__resend-button {
    font-size: 14px;
    width: 100%;
  }

  &__back {
    display: flex;
    justify-content: center;
  }
}
</style>
