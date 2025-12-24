<template>
  <div class="country-flag-dropdown">
    <v-menu v-model="menuOpen" :close-on-content-click="true" lo="bottom start">
      <template #activator="{ props }">
        <v-btn
          variant="text"
          density="compact"
          v-bind="props"
          class="country-flag-btn"
          :title="selectedCountry ? selectedCountry.name : 'Выбрать страну'"
        >
          <span class="flag-wrapper">
            <img
              v-if="selectedCountry"
              :src="`https://flagcdn.com/w20/${selectedCountry.iso}.png`"
              :alt="selectedCountry.name"
              class="country-flag"
              width="20"
              height="15"
            >
            <img
              v-else
              src="https://flagcdn.com/w20/un.png"
              alt="Выбрать страну"
              class="country-flag"
              width="20"
              height="15"
            >
          </span>
        </v-btn>
      </template>

      <v-list density="compact" max-height="300px" class="country-list">
        <v-list-item
          v-for="country in countries"
          :key="country.code"
          :class="{
            'selected-country': selectedCountry?.code === country.code,
          }"
          @click="selectCountry(country)"
        >
          <v-list-item-title class="d-flex align-center">
            <img
              :src="`https://flagcdn.com/w20/${country.iso}.png`"
              :alt="country.name"
              class="country-flag me-2"
              width="20"
              height="15"
            >
            <span>{{ country.name }} ({{ country.code }})</span>
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts">
import type { PropType } from "vue";
import { defineComponent, ref, watch } from "vue";
import type { Country as CountryType } from "~/constants/countries";

export default defineComponent({
  name: "CountryFlagDropdown",
  props: {
    modelValue: {
      type: Object as PropType<CountryType | null>,
      default: null,
    },
    countries: {
      type: Array as PropType<CountryType[]>,
      required: true,
    },
  },
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    const menuOpen = ref(false);
    const selectedCountry = ref(props.modelValue);

    // Обработчик выбора страны
    const selectCountry = (country: CountryType) => {
      selectedCountry.value = country;
      menuOpen.value = false;
      emit("update:modelValue", country);
    };

    // Следим за изменениями modelValue (для автоопределения)
    watch(
      () => props.modelValue,
      (newValue) => {
        if (newValue !== selectedCountry.value) {
          selectedCountry.value = newValue;
        }
      },
    );

    return {
      menuOpen,
      selectedCountry,
      selectCountry,
    };
  },
});
</script>

<style lang="scss" scoped>
.country-flag-dropdown {
  .country-flag-btn {
    min-width: auto;
    height: 32px;
    padding: 0 8px;
    margin: 0;

    .flag-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .country-flag {
      border-radius: 2px;
      object-fit: cover;
      box-shadow: 0 0 1px rgba(0, 0, 0, 0.3);
    }
  }

  .country-list {
    max-height: 300px;
    overflow-y: auto;

    .country-flag {
      border-radius: 2px;
      object-fit: cover;
      box-shadow: 0 0 1px rgba(0, 0, 0, 0.3);
    }

    .selected-country {
      background-color: rgba(var(--v-theme-primary), 0.1);
    }
  }
}
</style>
