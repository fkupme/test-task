<template>
  <div class="partner-registration">
    <h1 class="partner-registration__title">Регистрация</h1>

    <form ref="formRef" class="partner-registration__form">
      <UITextField
        v-model="partnerData.companyName"
        label="Название компании"
        placeholder="Название компании"
        :error-messages="
          touchedFields.companyName ? fieldErrors.companyName : ''
        "
        @blur="handleFieldBlur('companyName')"
      />

      <UITextField
        v-model="partnerData.website"
        label="Сайт/Публичная страница"
        placeholder="Сайт/Публичная страница"
        :error-messages="touchedFields.website ? fieldErrors.website : ''"
        @blur="handleFieldBlur('website')"
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

      <UIButton
        type="button"
        variant="text"
        block
        class="partner-registration__skip-button"
        @click="handleSkip"
      >
        Заполню позже
      </UIButton>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ERROR_MESSAGES, useValidation } from "~/composables/useValidation";

const router = useRouter();
const isLoading = ref(false);
const validator = useValidation();

// Данные партнера
const partnerData = reactive({
  companyName: "",
  website: "",
});

// Отслеживаем какие поля были затронуты
const touchedFields = reactive({
  companyName: false,
  website: false,
});

// Локальные ошибки для полей
const fieldErrors = reactive({
  companyName: "",
  website: "",
});

// Проверка валидности формы
const isFormValid = computed(() => {
  return !fieldErrors.companyName && partnerData.companyName.trim() !== "";
});

// Функция для валидации названия компании
function validateCompanyName(value: string): string {
  // Убираем пробелы в начале и конце
  const trimmedValue = value.trim();

  if (!trimmedValue) return ERROR_MESSAGES.REQUIRED;

  // Проверка на спецсимволы
  const specialCharsRegex = /[!@#$%^&*()+={}\[\]\\|:;<>,?/]/;
  if (specialCharsRegex.test(trimmedValue)) {
    return ERROR_MESSAGES.INVALID_SPECIAL_CHARS;
  }
  return "";
}

// Функция для валидации веб-сайта (опционально)
function validateWebsite(value: string): string {
  if (!value) return ""; // Не обязательное поле

  // Проверка на валидный URL если поле заполнено
  const urlPattern =
    /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/;
  if (value && !urlPattern.test(value))
    return ERROR_MESSAGES.INVALID_URL || "Некорректный URL";

  return "";
}

// Обработчик потери фокуса
function handleFieldBlur(field: keyof typeof touchedFields) {
  touchedFields[field] = true;

  // Валидация поля
  if (field === "companyName") {
    fieldErrors.companyName = validateCompanyName(partnerData.companyName);
    // Обновляем значение, убирая пробелы в начале и конце
    partnerData.companyName = partnerData.companyName.trim();
  } else if (field === "website") {
    fieldErrors.website = validateWebsite(partnerData.website);
  }
}

// Обработчик отправки формы
async function handleFormSubmit() {
  // Проверяем все поля перед отправкой
  touchedFields.companyName = true;
  touchedFields.website = true;

  fieldErrors.companyName = validateCompanyName(partnerData.companyName);
  fieldErrors.website = validateWebsite(partnerData.website);

  if (!isFormValid.value) return;

  try {
    isLoading.value = true;

    // В реальном приложении здесь был бы вызов API
    console.log("Отправка данных партнера:", partnerData);

    // Имитация задержки для демонстрации загрузки
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // После успешной регистрации перенаправляем на главную страницу
    router.push("/");
  } catch (error) {
    console.error("Ошибка при регистрации партнера:", error);
  } finally {
    isLoading.value = false;
  }
}

// Обработчик кнопки "Заполню позже"
function handleSkip() {
  // Перенаправляем на главную страницу без сохранения данных
  router.push("/");
}
</script>

<style lang="scss" scoped>
.partner-registration {
  background-color: #fff;
  border-radius: 12px;
  padding: 32px 24px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  &__title {
    font-size: 24px;
    font-weight: 600;
    text-align: center;
    margin-bottom: 24px;
    color: #000;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__skip-button {
    margin-top: 8px;
    background-color: #f5f5f5 !important;
  }
}
</style>
