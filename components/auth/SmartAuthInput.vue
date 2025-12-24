<template>
  <div class="smart-auth-input">
    <v-text-field
      ref="inputField"
      v-model="localFormattedValue"
      :placeholder="inputPlaceholder"
      :label="inputLabel"
      :error-messages="
        errorMessage && isDirty && wasBlurred ? [errorMessage] : undefined
      "
      :error="
        !!(
          (!!errorMessage && isDirty && wasBlurred) ||
          (!isValid &&
            isDirty &&
            wasBlurred &&
            identifierType === 'phone' &&
            fullPhoneNumberValue)
        )
      "
      variant="solo"
      :color="
        isValid
          ? 'success'
          : (isDirty && errorMessage && wasBlurred) ||
            (!isValid &&
              isDirty &&
              wasBlurred &&
              identifierType === 'phone' &&
              fullPhoneNumberValue)
            ? 'error'
            : undefined
      "
      density="comfortable"
      rounded="lg"
      bg-color="#F5F5F5"
      hide-details="auto"
      :autocomplete="identifierType === 'email' ? 'email' : 'tel'"
      class="phone-input"
      @input="onInput"
      @keydown="onKeyDown"
      @keypress="preventCyrillic"
      @blur="onBlur"
    >
      <!-- Иконка почты или дропдаун с кодами стран -->
      <template #prepend-inner>
        <template v-if="identifierType === 'email'">
          <v-icon
            icon="mdi-email-outline"
            :color="isValid ? 'success' : undefined"
          />
        </template>

        <div v-else-if="identifierType === 'phone'" class="country-dropdown">
          <v-icon
            icon="mdi-phone"
            :color="isValid ? 'success' : undefined"
            class="phone-icon"
          />
          <UICountryFlagDropdown
            :model-value="selectedCountry"
            :countries="countries"
            @update:model-value="selectCountry"
          />
        </div>
      </template>
    </v-text-field>
  </div>
</template>

<script setup lang="ts">
import { useField } from "vee-validate";
import {
  computed,
  defineEmits,
  defineProps,
  nextTick,
  onMounted,
  ref,
  watch,
} from "vue";
import * as yup from "yup";
import { useCountryDetection } from "@/composables/useCountryDetection";
import { useInputTypeDetection } from "@/composables/useInputTypeDetection";
import { usePhoneFormatting } from "@/composables/usePhoneFormatting";
import { useValidation } from "@/composables/useValidation";
import { countries } from "@/constants/countries";
import { ERROR_MESSAGES } from "@/constants/error-messages";

interface Props {
  modelValue: string;
  name: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "type-change", type: "email" | "phone" | null): void;
  (e: "blur"): void;
}>();

// Инициализация composables
const phoneFormatter = usePhoneFormatting();
const countryDetector = useCountryDetection();
const inputTypeDetector = useInputTypeDetection();
const validator = useValidation();

// Refs
const inputField = ref<HTMLInputElement | null>(null);
const countryMenu = ref(false);

// По умолчанию Россия для номеров без "+"
const defaultCountry = countryDetector.getDefaultCountry();
const selectedCountry = ref<(typeof countries)[0] | null>(defaultCountry);

// Локальное значение (отображается в инпуте, форматируется вручную)
const localFormattedValue = ref("");
// Значение для v-model (полный номер +кодЦИФРЫ)
const fullPhoneNumberValue = ref(props.modelValue);

// Состояние для определения типа ввода
const identifierType = ref<"email" | "phone" | null>(null);
const isValid = ref(false);
const isDirty = ref(false);

// Добавляем новое состояние для отслеживания потери фокуса
const wasBlurred = ref(false);

// Вычисляемые свойства для UI
const inputLabel = computed(() => {
  return inputTypeDetector.getLabelByType(identifierType.value);
});

const inputPlaceholder = computed(() => {
  return inputTypeDetector.getPlaceholderByType(identifierType.value);
});

// Обработчик выбора страны
const selectCountry = (country: (typeof countries)[0]) => {
  selectedCountry.value = country;
  countryMenu.value = false;

  // Получаем только цифры из текущего значения (без кода страны)
  let phoneDigits = "";

  if (fullPhoneNumberValue.value) {
    // Если текущее значение уже содержит код страны, извлекаем только номер
    const currentCountryCode = selectedCountry.value?.code.replace("+", "");
    if (currentCountryCode) {
      const digits = fullPhoneNumberValue.value.replace(/\D/g, "");
      if (digits.startsWith(currentCountryCode)) {
        phoneDigits = digits.substring(currentCountryCode.length);
      } else {
        phoneDigits = digits;
      }
    } else {
      phoneDigits = fullPhoneNumberValue.value.replace(/\D/g, "");
    }
  }

  // Формируем новое значение с новым кодом страны
  const fullNumber = country.code + phoneDigits;

  // Форматируем новое значение для отображения
  const formattedValue = phoneFormatter.formatPhoneNumber(fullNumber, country);

  // Обновляем v-model и отображаемое значение
  updatePhoneModel(formattedValue, fullNumber);

  isDirty.value = true;

  // Устанавливаем тип как телефон
  identifierType.value = "phone";
  emit("type-change", "phone");
};

// Обработчик клавиатуры для отслеживания удаления
function onKeyDown(event: KeyboardEvent) {
  // Отслеживаем удаление префикса телефона "+"
  if (event.key === "Backspace" && localFormattedValue.value === "+") {
    // Если пользователь удаляет +
    localFormattedValue.value = "";
    fullPhoneNumberValue.value = "";
    emit("update:modelValue", "");

    // Сбрасываем индикатор телефона
    identifierType.value = null;
    emit("type-change", null);
  }
}

// Обработка разных типов ввода
function handleEmailInput(value: string) {
  identifierType.value = "email";
  emit("type-change", "email");
  fullPhoneNumberValue.value = value;
  emit("update:modelValue", value);
}

function handlePhoneDigitInput(value: string) {
  identifierType.value = "phone";
  emit("type-change", "phone");

  // Получаем только цифры из введенного значения
  let inputDigits = value.replace(/\D/g, "");

  // Ограничиваем длину до 10 цифр для российских номеров
  if (inputDigits.length > 10) {
    inputDigits = inputDigits.substring(0, 10);
  }

  // Особый случай: если первая цифра 8, заменяем на +7
  if (value.charAt(0) === "8") {
    const digitsAfterEight = inputDigits.substring(1);
    const fullNumber = "+7" + digitsAfterEight;
    const formattedValue = phoneFormatter.formatRussianPhoneNumber(
      digitsAfterEight,
      true,
    );

    // Устанавливаем Россию как выбранную страну
    const russianCountry = countryDetector.getDefaultCountry();
    if (russianCountry) {
      selectedCountry.value = russianCountry;
    }

    updatePhoneModel(formattedValue, fullNumber);

    // Проверяем валидность номера сразу
    if (digitsAfterEight.length < 10) {
      isValid.value = false;
      errorMessage.value = "Номер телефона должен содержать 10 цифр";
    }
  } else {
    // Другие цифры - добавляем после +7, только для явно российских номеров
    // Проверяем, что первая цифра 7 или явно российский номер
    if (value.charAt(0) === "7") {
      const digitsAfterSeven = inputDigits.substring(1);
      const fullNumber = "+7" + digitsAfterSeven;
      const formattedValue = phoneFormatter.formatRussianPhoneNumber(
        digitsAfterSeven,
        true,
      );

      // Устанавливаем Россию как выбранную страну
      const russianCountry = countryDetector.getDefaultCountry();
      if (russianCountry) {
        selectedCountry.value = russianCountry;
      }

      updatePhoneModel(formattedValue, fullNumber);
    } else {
      // Для других цифр используем российский формат по умолчанию
      const fullNumber = "+7" + inputDigits;
      const formattedValue = phoneFormatter.formatRussianPhoneNumber(
        inputDigits,
        true,
      );

      // Устанавливаем Россию как выбранную страну
      const russianCountry = countryDetector.getDefaultCountry();
      if (russianCountry) {
        selectedCountry.value = russianCountry;
      }

      updatePhoneModel(formattedValue, fullNumber);
    }
  }
}

function handlePhonePlusInput(value: string) {
  identifierType.value = "phone";
  emit("type-change", "phone");

  // Получаем только цифры для определения страны
  let digits = value.replace(/\D/g, "");

  // Если это просто "+", явно сбрасываем выбранную страну
  if (value === "+") {
    selectedCountry.value = null;
    updatePhoneModel("+", "+");
    return;
  }

  // Для коротких номеров пытаемся определить, может ли это быть начало кода страны
  if (digits.length <= 3) {
    // Проверяем, есть ли страны, начинающиеся с этих цифр
    const possibleCountries = countries.filter((country) =>
      country.code.replace("+", "").startsWith(digits),
    );

    if (possibleCountries.length > 0) {
      // Просто сохраняем как есть, без форматирования
      updatePhoneModel("+" + digits, "+" + digits);
      return;
    }
  }

  // Если есть цифры после +, пытаемся определить страну
  if (digits.length > 0) {
    const detectedCountry = countryDetector.detectCountryByDigits(digits);

    if (detectedCountry) {
      selectedCountry.value = detectedCountry;

      // Ограничиваем длину в соответствии с максимальной длиной для страны
      const codeDigits = detectedCountry.code.replace("+", "");
      if (digits.startsWith(codeDigits)) {
        const phoneDigits = digits.substring(codeDigits.length);
        if (phoneDigits.length > detectedCountry.maxLength) {
          digits =
            codeDigits + phoneDigits.substring(0, detectedCountry.maxLength);
        }
      }
    }
  }

  // Для российских номеров обрабатываем отдельно
  if (digits.startsWith("7") && digits.length >= 1) {
    // Определяем позицию кода страны в цифрах
    const phoneDigits = digits.substring(1); // Убираем код страны
    // Ограничиваем длину
    const limitedDigits = phoneDigits.substring(
      0,
      Math.min(10, phoneDigits.length),
    );
    const formattedValue = phoneFormatter.formatRussianPhoneNumber(
      limitedDigits,
      true,
    );
    const fullNumber = "+7" + limitedDigits;

    // Обновляем модель и UI
    updatePhoneModel(formattedValue, fullNumber);
    return;
  }

  // Для других стран
  let formattedValue = "";
  let fullNumber = "";

  if (selectedCountry.value) {
    const codeDigits = selectedCountry.value.code.replace("+", "");
    let phoneDigits = "";

    if (digits.startsWith(codeDigits)) {
      // Извлекаем только цифры номера
      phoneDigits = digits.substring(codeDigits.length);
      // Ограничиваем длину
      phoneDigits = phoneDigits.substring(
        0,
        Math.min(selectedCountry.value.maxLength, phoneDigits.length),
      );
    } else {
      // Если цифры не начинаются с кода, считаем их всеми цифрами номера
      phoneDigits = digits;
      phoneDigits = phoneDigits.substring(
        0,
        Math.min(selectedCountry.value.maxLength, phoneDigits.length),
      );
    }

    fullNumber = selectedCountry.value.code + phoneDigits;
    if (selectedCountry.value.mask) {
      formattedValue = phoneFormatter.formatPhoneByMask(
        phoneDigits,
        selectedCountry.value.mask.substring(selectedCountry.value.code.length),
      );
      formattedValue = selectedCountry.value.code + " " + formattedValue;
    } else {
      formattedValue = phoneFormatter.formatInternationalPhoneNumber(
        selectedCountry.value,
        phoneDigits,
      );
    }
  } else {
    // Если страна не определена, просто форматируем как есть
    fullNumber = "+" + digits;
    formattedValue = "+" + digits;
  }

  updatePhoneModel(formattedValue, fullNumber);
}

// Обработчик ввода для определения типа и форматирования
function onInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const value = input.value;

  // Всегда устанавливаем isDirty = true при любом вводе
  isDirty.value = true;

  // Если пусто, сбрасываем тип
  if (value === "") {
    identifierType.value = null;
    emit("type-change", null);
    fullPhoneNumberValue.value = "";
    emit("update:modelValue", "");
    return;
  }

  // Определяем тип по первому символу
  const firstChar = value.charAt(0);

  // Если первый символ - буква, обрабатываем как email
  if (/[a-zA-Z]/.test(firstChar)) {
    handleEmailInput(value);
    return;
  }

  // Если первый символ - цифра, обрабатываем как телефон
  if (/\d/.test(firstChar)) {
    handlePhoneDigitInput(value);
    return;
  }

  // Если первый символ "+", обрабатываем как телефон
  if (value.startsWith("+")) {
    handlePhonePlusInput(value);
    return;
  }

  // В других случаях просто сохраняем как есть
  fullPhoneNumberValue.value = value;
  emit("update:modelValue", value);
}

// Функция для обновления состояния валидации
const updateValidationState = async () => {
  // Проверяем телефон по стандартам страны
  if (identifierType.value === "phone" && fullPhoneNumberValue.value) {
    // Не считаем валидным, если это просто "+"
    if (fullPhoneNumberValue.value === "+") {
      isValid.value = false;
      return false;
    }

    // Специальная обработка для российских номеров
    if (fullPhoneNumberValue.value.startsWith("+7")) {
      // Получаем только цифры (без кода +7)
      const allDigits = fullPhoneNumberValue.value.replace(/\D/g, "");
      const phoneDigits = allDigits.startsWith("7")
        ? allDigits.substring(1)
        : allDigits;

      // Проверяем, что длина соответствует российскому стандарту (10 цифр)
      const isPhoneValid = phoneDigits.length === 10;

      // Обновляем состояние валидации
      isValid.value = isPhoneValid;

      // Устанавливаем сообщение об ошибке при необходимости
      if (!isPhoneValid && isDirty.value) {
        if (phoneDigits.length < 10) {
          errorMessage.value = "Номер телефона должен содержать 10 цифр";
        } else if (phoneDigits.length > 10) {
          errorMessage.value = "Слишком длинный номер телефона";
        }
      } else {
        errorMessage.value = undefined;
      }

      return isPhoneValid;
    }

    // Для других стран
    // Получаем только цифры из номера
    const digits = fullPhoneNumberValue.value.replace(/\D/g, "");

    // Пытаемся определить код страны
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
      // Найдена страна по коду
      const codeDigits = foundCountry.code.replace("+", "");
      const phoneDigits = digits.substring(codeDigits.length);

      // Валидно, если количество цифр соответствует стандарту страны
      const isPhoneValid = phoneDigits.length === foundCountry.maxLength;

      isValid.value = isPhoneValid;

      // Устанавливаем сообщение об ошибке, если нужно
      if (!isPhoneValid && isDirty.value) {
        errorMessage.value = `Номер телефона ${foundCountry.name} должен содержать ${foundCountry.maxLength} цифр`;
      } else {
        errorMessage.value = undefined;
      }

      return isPhoneValid;
    } else {
      // Не удалось определить страну

      // Минимальная проверка - должен быть + и минимум 5 цифр
      const hasPlus = fullPhoneNumberValue.value.startsWith("+");
      const digitsCount = digits.length;
      const isPhoneValid = hasPlus && digitsCount >= 5;

      isValid.value = isPhoneValid;

      if (!isPhoneValid && isDirty.value) {
        errorMessage.value = "Введите корректный номер телефона";
      } else {
        errorMessage.value = undefined;
      }

      return isPhoneValid;
    }
  }

  // Запускаем валидацию только если есть тип и значение (для email)
  if (identifierType.value && fullPhoneNumberValue.value) {
    // Для email запускаем обычную валидацию
    if (identifierType.value === "email") {
      // Запускаем валидацию через композабл
      const result = await validate();

      // Обновляем состояние валидности
      isValid.value = result.valid;

      return result.valid;
    }
  }

  // Если нет типа или значения, устанавливаем невалидное состояние
  isValid.value = false;
  return false;
};

// Интеграция с vee-validate
const { errorMessage, value, validate } = useField(
  props.name,
  computed(() => {
    // Если поле пустое или не было изменено, или не нужно показывать ошибки - не применяем валидацию
    if (!fullPhoneNumberValue.value || !isDirty.value) {
      return yup.string();
    }

    // Используем соответствующую схему валидации в зависимости от типа
    if (identifierType.value === "phone") {
      return validator.phoneSchema;
    }

    if (identifierType.value === "email") {
      return validator.emailSchema;
    }

    return yup.string().required("Поле обязательно для заполнения");
  }),
  // Синхронизируем vee-validate с нашим значением для v-model
  { initialValue: fullPhoneNumberValue.value },
);

// Обновляем watch для использования новой функции
watch(
  [fullPhoneNumberValue, identifierType],
  async ([newPhoneValue, newType]) => {
    // Если есть значение и тип, запускаем валидацию
    if (newType && newPhoneValue) {
      isDirty.value = true; // Устанавливаем флаг сразу
      // Запускаем валидацию, но не показываем ошибки до потери фокуса
      await updateValidationState();
    } else {
      isValid.value = false;
      // Сбрасываем ошибку, если поле очищено или тип не определен
      if (!newPhoneValue) {
        errorMessage.value = undefined;
      }
    }
  },
  { immediate: true }, // Добавляем immediate для обработки начального значения
);

// Функция форматирования, которая обновляет v-model с полным номером
const updatePhoneModel = (formattedValue: string, fullNumber: string) => {
  // Обновляем отображаемое значение
  localFormattedValue.value = formattedValue;

  // Обновляем v-model с полным номером (всегда с +)
  fullPhoneNumberValue.value = fullNumber;
  emit("update:modelValue", fullNumber);

  // Запускаем валидацию после обновления
  nextTick(async () => {
    await updateValidationState();

    // Явно устанавливаем isDirty, чтобы ошибки отображались
    if (fullNumber) {
      isDirty.value = true;
    }
  });
};

// Отслеживаем изменения из родительского компонента
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== fullPhoneNumberValue.value) {
      fullPhoneNumberValue.value = newValue;

      // Определяем тип по новому значению
      if (newValue === "+") {
        // Специальная обработка для случая, когда только "+"
        identifierType.value = "phone";
        localFormattedValue.value = "+";
        selectedCountry.value = null;
        emit("type-change", "phone");
      } else if (newValue.startsWith("+") || /^\d/.test(newValue)) {
        // Это телефон
        identifierType.value = "phone";

        // Обновляем локальное значение с форматированием
        localFormattedValue.value = phoneFormatter.formatPhoneNumber(newValue);

        // Определяем страну по коду
        if (newValue.startsWith("+")) {
          const digits = newValue.replace(/\D/g, "");
          if (digits.length > 0) {
            const detectedCountry =
              countryDetector.detectCountryByDigits(digits);
            if (detectedCountry) {
              selectedCountry.value = detectedCountry;
            }
          } else {
            // Если только "+", сбрасываем страну
            selectedCountry.value = null;
          }
        } else if (/^\d/.test(newValue)) {
          // Для номеров без + используем российский формат
          selectedCountry.value = defaultCountry;
        }

        emit("type-change", "phone");
      } else if (newValue.includes("@")) {
        // Это email
        identifierType.value = "email";
        localFormattedValue.value = newValue;
        emit("type-change", "email");
      } else {
        // Неопределенный тип или пустое поле
        identifierType.value = null;
        localFormattedValue.value = newValue;
        emit("type-change", null);
      }
    }
  },
  { immediate: true },
);

// Обработчик потери фокуса
async function onBlur() {
  // Отмечаем, что поле было затронуто и потеряло фокус
  isDirty.value = true;
  wasBlurred.value = true;

  // Выполняем валидацию
  await updateValidationState();

  // Эмитируем событие blur в любом случае
  emit("blur");
}

// Добавляем новую функцию для предотвращения ввода кириллицы
function preventCyrillic(event: KeyboardEvent) {
  const char = String.fromCharCode(event.charCode);
  if (/[а-яА-ЯёЁ]/.test(char)) {
    event.preventDefault();
    isDirty.value = true;
    errorMessage.value =
      identifierType.value === "email"
        ? ERROR_MESSAGES.INVALID_EMAIL_CYRILLIC
        : ERROR_MESSAGES.INVALID_PHONE;
  }
}

onMounted(() => {
  // Инициализация компонента
  if (props.modelValue) {
    // Сначала устанавливаем значение, затем эмулируем ввод
    localFormattedValue.value = props.modelValue;

    // Эмулируем событие input для применения форматирования
    setTimeout(() => {
      onInput({
        target: { value: props.modelValue },
      } as unknown as Event);

      // Запускаем валидацию после инициализации
      setTimeout(() => {
        updateValidationState();
      }, 100);
    }, 0);
  }
});
</script>

<style lang="scss" scoped>
.smart-auth-input {
  width: 100%;
  margin-bottom: 20px;

  :deep(.v-field__input) {
    min-height: 56px !important;
    padding-top: 6px !important;
    padding-bottom: 0;
  }

  :deep(.v-field--variant-solo) {
    box-shadow: none;
  }

  :deep(.v-field--variant-solo) {
    border: 1px solid #f5f5f5;
    border-radius: 8px;
    background-color: #f5f5f5;
  }

  :deep(.v-field--focused) {
    border: 1px solid #3f73c1 !important;
  }

  :deep(.v-field--error) {
    border: 1px solid rgb(var(--v-theme-error)) !important;
  }

  .phone-input {
    :deep(.v-field__prepend-inner) {
      margin-right: 0px;
      padding-right: 0px;
    }
  }

  .country-dropdown {
    display: flex;
    align-items: center;
    margin-right: 8px;

    .phone-icon {
      margin-right: 4px;
    }
  }

  .country-select-btn {
    min-width: auto;
    height: 28px;
    padding: 0 4px;
    font-size: 14px;
    margin-left: 4px;
  }

  .country-list {
    max-height: 300px;
    overflow-y: auto;
  }

  /* Цвет лейбла и placeholder как в поле пароля */
  :deep(.v-label) {
    color: #6d6a6a !important;
  }

  :deep(.v-field__input input::placeholder) {
    color: #6d6a6a !important;
  }
}
</style>
