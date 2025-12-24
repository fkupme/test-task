<template>
  <div class="registration">
    <UIUseMeta :meta="meta" />
    <div class="registration__header">
      <UIButton
        variant="text"
        class="registration__back-button"
        @click="$router.push('/auth/authorization')"
      >
        <v-icon size="24">mdi-arrow-left</v-icon>
      </UIButton>
      <h1 class="registration__title">Регистрация</h1>
    </div>

    <form ref="formRef" class="registration__form">
      <UITextField
        bg-color="#F5F5F5"
        :model-value="userData.firstName"
        label="Имя"
        placeholder="Имя"
        variant="solo"
        :error-messages="touchedFields.firstName ? fieldErrors.firstName : ''"
        autocomplete="given-name"
        @update:model-value="updateFirstName"
        @blur="handleFieldBlur('firstName')"
      />

      <UITextField
        bg-color="#F5F5F5"
        :model-value="userData.lastName"
        label="Фамилия"
        placeholder="Фамилия"
        variant="solo"
        :error-messages="touchedFields.lastName ? fieldErrors.lastName : ''"
        autocomplete="family-name"
        @update:model-value="updateLastName"
        @blur="handleFieldBlur('lastName')"
      />

      <UITextField
        bg-color="#F5F5F5"
        :model-value="userData.email"
        label="Email"
        placeholder="Email"
        type="email"
        variant="solo"
        :error-messages="touchedFields.email ? fieldErrors.email : ''"
        :loading="isLoading"
        :append-inner-icon="getEmailAppendIcon"
        :append-inner-icon-color="getEmailAppendColor"
        autocomplete="email"
        @keydown="(e: KeyboardEvent) => e.key === ' ' && e.preventDefault()"
        @update:model-value="updateEmail"
        @blur="handleFieldBlur('email')"
      />

      <UIPhoneField
        bg-color="#F5F5F5"
        :model-value="phoneData"
        :error-messages="touchedFields.phone ? fieldErrors.phone : ''"
        :loading="isLoading"
        :append-inner-icon="getPhoneAppendIcon"
        :append-inner-icon-color="getPhoneAppendColor"
        variant="solo"
        autocomplete="tel"
        font-size="14px"
        style="
          :deep(input) {
            height: 48px;
          }
        "
        @blur="handleFieldBlur('phone')"
        @update:model-value="updatePhone"
      />

      <AuthPasswordConfirmation
        bg-color="#F5F5F5"
        variant="solo"
        :show-errors="touchedFields.password"
        :confirm-show-errors="touchedFields.confirmPassword"
        @update:password="updatePassword"
        @update:confirm="updateConfirmPassword"
        @blur:password="handleFieldBlur('password')"
        @blur:confirm="handleFieldBlur('confirmPassword')"
        @validity-change="passwordValid = $event"
        @strength-change="passwordStrength = $event"
      />

      <UIButton
        type="button"
        :loading="isLoading"
        :disabled="isLoading || !isFormValid"
        variant="primary"
        block
        @click="handleFormSubmit"
      >
        Продолжить
      </UIButton>

      <div class="registration__terms">
        Нажимая кнопку «Продолжить», вы соглашаетесь с
        <a href="#" class="registration__link">правилами</a> и
        <a href="#" class="registration__link">политикой конфиденциальности</a>
        сервиса MUSbooking
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from "@vueuse/core";
import { useForm } from "vee-validate";
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { useUniquenessCheck } from "~/composables/useUniquenessCheck";
import { useValidation } from "~/composables/useValidation";
import { countries, type Country } from "~/constants/countries";
import { useAuthStore } from "~/stores/auth";
import { ERROR_MESSAGES } from "~/constants/error-messages";
import type { IAuthData } from "~/types/auth";

const authStore = useAuthStore();
const validator = useValidation();
const storeLoading = computed(() => (authStore as any).isLoading ?? false);
const isLoading = computed(
  () => storeLoading.value || uniquenessCheck.isChecking.value,
);
const route = useRoute();

const meta = {
	title: "Регистрация",
	description: "Регистрация",
	image: "/images/auth/registration.png",
};

// Используем композабл для проверки уникальности
const uniquenessCheck = useUniquenessCheck();

// Данные пользователя
const userData = reactive<IAuthData>({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
});

// Данные телефона в новом формате
const phoneData = reactive({
  phone: "",
  code: "+7",
  locale: "RU",
});

const confirmPassword = ref("");
const passwordStrength = ref<{ strength: number; message: string }>({
  strength: 0,
  message: "",
});
const passwordValid = ref(false);

// Отслеживаем какие поля были затронуты
const touchedFields = reactive({
  firstName: false,
  lastName: false,
  email: false,
  phone: false,
  password: false,
  confirmPassword: false,
});

// Локальные ошибки для полей
const fieldErrors = reactive({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
});

// Создаем схему валидации
const validationSchema = computed(() => {
  return validator.createRegistrationSchema();
});

// Инициализируем форму
const { handleSubmit, errors, validate, validateField } = useForm({
  validationSchema,
});

function validateName(value: string): string {
  if (!value) return ERROR_MESSAGES.REQUIRED;
  if (!/^[a-zA-Zа-яА-ЯёЁ]+(-[a-zA-Zа-яА-ЯёЁ]+)*$/.test(value))
    return ERROR_MESSAGES.INVALID_NAME;
  return "";
}

function validateEmail(value: string): string {
  if (!value) return ERROR_MESSAGES.REQUIRED;

  if (/[а-яА-ЯёЁ]/.test(value)) {
    uniquenessCheck.fieldsValidForCheck.email = false;
    return ERROR_MESSAGES.INVALID_EMAIL_CYRILLIC;
  }

  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value)) {
    uniquenessCheck.fieldsValidForCheck.email = false;
    return ERROR_MESSAGES.INVALID_EMAIL;
  }

  uniquenessCheck.fieldsValidForCheck.email = true;
  return "";
}

function validatePhone(value: string): string {
  if (!value) return ERROR_MESSAGES.REQUIRED;

  const digitsOnly = value.replace(/\D/g, "");
  const selectedCountry = countries.find(
    (c: Country) => c.code === phoneData.code,
  );

  if (!selectedCountry || digitsOnly.length !== selectedCountry.maxLength) {
    uniquenessCheck.fieldsValidForCheck.phone = false;
    return ERROR_MESSAGES.INVALID_PHONE;
  }

  uniquenessCheck.fieldsValidForCheck.phone = true;
  return "";
}

const debouncedEmailCheck = useDebounceFn(async () => {
  if (
    !uniquenessCheck.fieldsValidForCheck.email ||
    !userData.email ||
    !touchedFields.email
  )
    return;

  const isUnique = await uniquenessCheck.checkEmailUniqueness(userData.email);

  if (isUnique === false) {
    fieldErrors.email = "Этот email уже используется";
  }
}, 500);

const debouncedPhoneCheck = useDebounceFn(async () => {
  if (
    !uniquenessCheck.fieldsValidForCheck.phone ||
    !userData.phone ||
    !touchedFields.phone
  )
    return;

  const isUnique = await uniquenessCheck.checkPhoneUniqueness(
    userData.phone,
    phoneData.code,
  );

  if (isUnique === false) {
    fieldErrors.phone = "Этот номер уже используется";
  }
}, 500);

function handleFieldBlur(
  field:
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "password"
    | "confirmPassword",
) {
  touchedFields[field] = true;

  switch (field) {
    case "firstName":
      userData.firstName = userData.firstName.trim();
      fieldErrors.firstName = validateName(userData.firstName);
      break;
    case "lastName":
      userData.lastName = userData.lastName.trim();
      fieldErrors.lastName = validateName(userData.lastName);
      break;
    case "email":
      fieldErrors.email = validateEmail(userData.email);
      if (uniquenessCheck.fieldsValidForCheck.email && !fieldErrors.email) {
        debouncedEmailCheck();
      }
      break;
    case "phone":
      fieldErrors.phone = validatePhone(userData.phone);
      if (uniquenessCheck.fieldsValidForCheck.phone && !fieldErrors.phone) {
        debouncedPhoneCheck();
      }
      break;
  }
}

function updateFirstName(value: string) {
  userData.firstName = value;
  if (touchedFields.firstName) {
    fieldErrors.firstName = validateName(value);
  }
}

function updateLastName(value: string) {
  userData.lastName = value;
  if (touchedFields.lastName) {
    fieldErrors.lastName = validateName(value);
  }
}

function updateEmail(value: string) {
  userData.email = value;
  if (touchedFields.email) {
    uniquenessCheck.resetEmailStatus();
    fieldErrors.email = validateEmail(value);
  }
}

function updatePhone(value: { phone: string; code: string; locale: string }) {
  phoneData.phone = value.phone;
  phoneData.code = value.code;
  phoneData.locale = value.locale;

  userData.phone = value.phone;

  if (touchedFields.phone) {
    uniquenessCheck.resetPhoneStatus();
    fieldErrors.phone = validatePhone(userData.phone);
  }
}

function updatePassword(value: string) {
  userData.password = value;

  if (touchedFields.confirmPassword && confirmPassword.value) {
    if (confirmPassword.value !== value) {
      fieldErrors.confirmPassword = ERROR_MESSAGES.PASSWORDS_NOT_MATCH;
    } else {
      fieldErrors.confirmPassword = "";
    }
  }
}

function updateConfirmPassword(value: string) {
  confirmPassword.value = value;

  if (touchedFields.confirmPassword) {
    if (value !== userData.password) {
      fieldErrors.confirmPassword = ERROR_MESSAGES.PASSWORDS_NOT_MATCH;
    } else {
      fieldErrors.confirmPassword = "";
    }
  }
}

const isFormValid = computed(() => {
  const allFieldsFilled =
    !!userData.firstName &&
    !!userData.lastName &&
    !!userData.email &&
    !!userData.phone &&
    !!userData.password &&
    !!confirmPassword.value;

  const noErrors =
    !fieldErrors.firstName &&
    !fieldErrors.lastName &&
    !fieldErrors.email &&
    !fieldErrors.phone &&
    passwordValid.value &&
    !fieldErrors.confirmPassword;

  const isEmailUniqueOrNotChecked =
    !uniquenessCheck.fieldsValidForCheck.email ||
    uniquenessCheck.uniqueStatus.email === true ||
    uniquenessCheck.uniqueStatus.email === null;

  const isPhoneUniqueOrNotChecked =
    !uniquenessCheck.fieldsValidForCheck.phone ||
    uniquenessCheck.uniqueStatus.phone === true ||
    uniquenessCheck.uniqueStatus.phone === null;

  const notChecking = !uniquenessCheck.isChecking.value;

  return (
    allFieldsFilled &&
    noErrors &&
    isEmailUniqueOrNotChecked &&
    isPhoneUniqueOrNotChecked &&
    notChecking
  );
});

const getEmailAppendIcon = computed(() => {
  if (
    uniquenessCheck.fieldsValidForCheck.email &&
    touchedFields.email &&
    !fieldErrors.email
  ) {
    if (uniquenessCheck.uniqueStatus.email === true) return "mdi-check-circle";
    if (uniquenessCheck.uniqueStatus.email === false) return "mdi-alert-circle";
  }
  return undefined;
});

const getEmailAppendColor = computed(() => {
  return uniquenessCheck.uniqueStatus.email === true ? "success" : "error";
});

const getPhoneAppendIcon = computed(() => {
  if (
    uniquenessCheck.fieldsValidForCheck.phone &&
    touchedFields.phone &&
    !fieldErrors.phone
  ) {
    if (uniquenessCheck.uniqueStatus.phone === true) return "mdi-check-circle";
    if (uniquenessCheck.uniqueStatus.phone === false) return "mdi-alert-circle";
  }
  return undefined;
});

const getPhoneAppendColor = computed(() => {
  return uniquenessCheck.uniqueStatus.phone === true ? "success" : "error";
});

async function handleFormSubmit() {
  userData.firstName = userData.firstName.trim();
  userData.lastName = userData.lastName.trim();

  Object.keys(touchedFields).forEach((key) => {
    touchedFields[key as keyof typeof touchedFields] = true;
  });

  fieldErrors.firstName = validateName(userData.firstName);
  fieldErrors.lastName = validateName(userData.lastName);
  fieldErrors.email = validateEmail(userData.email);
  fieldErrors.phone = validatePhone(userData.phone);

  if (uniquenessCheck.fieldsValidForCheck.email && !fieldErrors.email) {
    if (uniquenessCheck.uniqueStatus.email === null) {
      const emailUnique = await uniquenessCheck.checkEmailUniqueness(
        userData.email,
      );
      if (emailUnique === false) {
        fieldErrors.email = "Этот email уже используется";
      }
    }
  }

  if (uniquenessCheck.fieldsValidForCheck.phone && !fieldErrors.phone) {
    if (uniquenessCheck.uniqueStatus.phone === null) {
      const phoneUnique = await uniquenessCheck.checkPhoneUniqueness(
        userData.phone,
        phoneData.code,
      );
      if (phoneUnique === false) {
        fieldErrors.phone = "Этот номер уже используется";
      }
    }
  }

  if (!isFormValid.value) {
    return;
  }

  try {
    const requestData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      phoneNumber: phoneData.phone,
      locale: phoneData.locale,
      countryCode: phoneData.code,
    };

    try {
      localStorage.setItem(
        "registration_form_data",
        JSON.stringify(requestData),
      );

      (authStore as any).saveRegistrationData?.(requestData);
      if ("registrationData" in (authStore as any)) {
        (authStore as any).registrationData = requestData;
      }
    } catch (e) {}

    await (authStore as any).register?.(requestData);

    const fullPhone = phoneData.code + phoneData.phone;

    navigateTo({
      path: `/auth/verify-code/${phoneData.phone}`,
      query: {
        phone: phoneData.phone,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        countryCode: phoneData.code,
        isPartner: "true",
      },
    });
  } catch (err) {}
}
</script>

<style lang="scss" scoped>
:deep(.v-field.v-field--variant-solo) {
  box-shadow: none;
}

.registration {
  background-color: #fff;
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 450px;

  &__header {
    position: relative;
    margin-bottom: 24px;
  }

  &__back-button {
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    min-width: 36px;
    width: 36px;
    height: 36px;
    padding: 0;
    border-radius: 50%;

    :deep(.v-btn__content) {
      font-size: 22px;
    }
  }

  &__title {
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    margin: 0;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__terms {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
    text-align: center;
    margin-top: 16px;
    line-height: 1.4;
  }

  &__link {
    color: #002fff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style> 