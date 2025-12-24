<template>
  <div class="password-recovery">
    <UIUseMeta :meta="meta" />
    <h1 class="password-recovery__title">
      {{ currentStep !== 3 ? "Восстановление" : "Контактные данные" }}
    </h1>

    <div class="password-recovery__steps-container">
      <!-- Используем один transition для всех шагов -->
      <transition name="step" mode="out-in">
        <!-- Шаг 1: Ввод Email -->
        <div
          v-if="currentStep === 1"
          key="step-1"
          class="password-recovery__step"
        >
          <form class="password-recovery__form" @submit.prevent="submitEmail">
            <UITextField
              v-model="email"
              label="Email"
              placeholder="Email"
              type="email"
              bg-color="#F5F5F5"
              :rules="[validator.required, validator.email]"
              :error-messages="emailError"
              autocomplete="email"
            />

            <UIButton
              type="submit"
              :loading="loading"
              :disabled="loading || !email"
              variant="primary"
              block
              class="mt-4"
            >
              Продолжить
            </UIButton>

            <div
              class="password-recovery__support-link"
              @click="goToSupportRequest"
            >
              Я не помню данные или нет к ним доступа
            </div>
          </form>
        </div>

        <!-- Шаг 2: Подтверждение отправки пароля на почту -->
        <div
          v-else-if="currentStep === 2"
          key="step-2"
          class="password-recovery__step"
        >
          <p class="password-recovery__description">
            Мы отправили вам новый пароль<br >на электронную почту
          </p>

          <UIButton
            variant="secondary"
            block
            class="mt-4"
            @click="navigateToAuthorization"
          >
            Хорошо
          </UIButton>
        </div>

        <!-- Шаг 3: Форма запроса в поддержку (необязательный шаг) -->
        <div
          v-else-if="currentStep === 3"
          key="step-3"
          class="password-recovery__step"
        >
          <form
            class="password-recovery__form"
            @submit.prevent="submitSupportRequest"
          >
            <AuthSmartAuthInput
              v-model="supportContact"
              name="support-contact"
              :error-messages="computedSupportContactError"
              :show-errors="supportContactTouched"
              @update:model-value="handleSupportContactUpdate"
              @keydown="
                (e: KeyboardEvent) => e.key === ' ' && e.preventDefault()
              "
              @type-change="onSupportContactTypeChange"
              @blur="handleSupportContactBlur"
            />

            <UIButton
              type="submit"
              :loading="supportLoading"
              :disabled="supportLoading || !supportContact"
              variant="primary"
              block
              class="mt-4"
            >
              Продолжить
            </UIButton>
          </form>
        </div>

        <!-- Шаг 4: Подтверждение отправки запроса в поддержку -->
        <div
          v-else-if="currentStep === 4"
          key="step-4"
          class="password-recovery__step"
        >
          <p class="password-recovery__description">
            Ваш запрос отправлен в службу поддержки. С вами свяжутся в ближайшее
            время
          </p>

          <UIButton
            variant="secondary"
            block
            class="mt-4"
            @click="navigateToAuthorization"
          >
            Хорошо
          </UIButton>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useForm } from "vee-validate";
import * as yup from "yup";
import { useValidation } from "~/composables/useValidation";
import { useAuthStore } from "~/stores/auth";

const meta = {
	title: "Восстановление пароля",
	description: "Восстановление пароля",
	image: "/images/auth/password-recovery.png",
}

const emit = defineEmits<{
  (e: "password-reset-success"): void;
}>();

// Состояние формы
const email = ref("");
const emailError = ref("");
const loading = ref(false);
const currentStep = ref(1);

// Состояние формы запроса в поддержку
const supportContact = ref("");
const supportContactError = ref("");
const supportContactType = ref<"email" | "phone" | null>("email");
const supportLoading = ref(false);

// Добавляем состояние для отслеживания взаимодействия с полем
const supportContactTouched = ref(false);

const validator = useValidation();
const authStore = useAuthStore();

// Создаем схему валидации для формы поддержки
const supportValidationSchema = computed(() => {
  return yup.object({
    supportContact: yup
      .string()
      .required("Обязательное поле")
      .test("support-contact-validation", (value, context) => {
        if (!value)
          return new yup.ValidationError(
            "Обязательное поле",
            value,
            "supportContact",
          );

        // Не показываем ошибку, если пользователь только начал вводить
        if (value.length < 3) return true;

        if (supportContactType.value === "email") {
          // Проверяем email формат
          const isValid =
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
          if (!isValid) {
            return new yup.ValidationError(
              "Введите корректный email",
              value,
              "supportContact",
            );
          }
          return true;
        }

        if (supportContactType.value === "phone") {
          // Проверяем телефон
          if (value === "+7" || value === "+") return true;

          const digits = value.replace(/\D/g, "");

          if (value.startsWith("+7")) {
            if (digits.length !== 11) {
              return new yup.ValidationError(
                "Введите полный номер в формате +7 (XXX) XXX-XX-XX",
                value,
                "supportContact",
              );
            }
          } else {
            if (digits.length < 10) {
              return new yup.ValidationError(
                "Введите корректный номер телефона",
                value,
                "supportContact",
              );
            }
          }
          return true;
        }

        return true;
      }),
  });
});

// Инициализируем форму для поддержки
const supportForm = useForm({
  initialValues: {
    supportContact: "",
  },
  validationSchema: supportValidationSchema,
});

const {
  handleSubmit: handleSupportSubmit,
  errors: supportErrors,
  validate: validateSupport,
  setFieldValue,
} = supportForm;

// Функция отправки email для восстановления пароля
async function submitEmail() {
  if (!email.value) {
    emailError.value = "Пожалуйста, введите email";
    return;
  }

  loading.value = true;
  emailError.value = "";

  try {
    // Вызываем API через authStore
    await authStore.requestPasswordRecovery(email.value);

    // Переходим к следующему шагу
    currentStep.value = 2;

    // Сообщаем родительскому компоненту об успехе
    emit("password-reset-success");
  } catch (err: any) {
    emailError.value =
      err.message || "Ошибка при отправке ссылки для сброса пароля";
    console.error("Ошибка при отправке ссылки:", err);
  } finally {
    loading.value = false;
  }
}

// Функция для перехода к форме запроса в поддержку (при необходимости)
function goToSupportRequest() {
  currentStep.value = 3;
}

// Функция для отслеживания изменения типа контакта
function onSupportContactTypeChange(type: "email" | "phone" | null) {
  supportContactType.value = type;
  supportContactError.value = "";
  // Синхронизируем с vee-validate
  setFieldValue("supportContact", supportContact.value);
}

// Проверка валидности контактных данных для поддержки
const isSupportContactValid = computed(() => {
  return (
    !supportErrors.value.supportContact &&
    !!supportContact.value &&
    supportContact.value.length >= 3
  );
});

// Функция для отправки запроса в поддержку
const submitSupportRequest = handleSupportSubmit(async () => {
  if (!isSupportContactValid.value) {
    supportContactTouched.value = true;
    return;
  }

  supportLoading.value = true;
  supportContactError.value = "";

  try {
    // вызов API
    // const contactData = supportContactType.value === 'email'
    //  ? { email: supportContact.value }
    //  : { phone: supportContact.value };
    // await authStore.sendSupportRequest(contactData);

    // Имитация запроса к API (для демо)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Переходим к следующему шагу
    currentStep.value = 4;
  } catch (err: any) {
    supportContactError.value =
      err.message || "Ошибка при отправке запроса в поддержку";
    console.error("Ошибка при отправке запроса в поддержку:", err);
  } finally {
    supportLoading.value = false;
  }
});

// Добавляем watcher для синхронизации значений с vee-validate
watch(
  [supportContact, supportContactType],
  async () => {
    setFieldValue("supportContact", supportContact.value);
    await validateSupport();
  },
  { immediate: true },
);

// Вычисляемое свойство для ошибок от vee-validate
const computedSupportContactError = computed(() => {
  return supportContactTouched.value
    ? supportErrors.value.supportContact || supportContactError.value
    : "";
});

// Функция для перехода на страницу входа
function navigateToAuthorization() {
  navigateTo("/auth/authorization");
}

// Функция для обработки обновления контакта
function handleSupportContactUpdate(value: string) {
  supportContact.value = value;
  supportContactError.value = "";
  // Синхронизируем с vee-validate
  setFieldValue("supportContact", supportContact.value);
}

// Функция для обработки размытия контакта
function handleSupportContactBlur() {
  supportContactTouched.value = true;
}
</script>

<style lang="scss" scoped>
.password-recovery {
  position: relative;

  &__title {
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 24px;
  }

  &__steps-container {
    position: relative;
  }

  &__subtitle {
    font-size: 20px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 24px;
  }

  &__description {
    margin-bottom: 24px;
    text-align: center;
    color: rgba(0, 0, 0, 1);
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__support-link {
    font-size: 16px;
    color: rgba(0, 0, 0, 1);
    text-align: center;
    margin-top: 12px;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
      color: #4285f4;
    }
  }

  &__step {
    width: 100%;
  }
}

/* Стили для анимации перехода */
.step-enter-active,
.step-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.step-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.step-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
