<template>
  <div class="date-picker-calendar">
    <div class="date-picker-controls">
      <div class="date-picker-controls__title">
        {{ formattedMonth }}
      </div>
    </div>

    <div class="date-picker-month">
      <div class="date-picker-month__weekdays">
        <span
          v-for="day in weekDays"
          :key="day"
          class="date-picker-month__weekday"
        >
          {{ day }}
        </span>
      </div>

      <div class="date-picker-month__days">
        <div
          v-for="week in weeks"
          :key="week[0].toISOString()"
          class="date-picker-month__week"
        >
          <button
            v-for="date in week"
            :key="date.toISOString()"
            class="date-picker-month__day"
            :class="{
              'date-picker-month__day--disabled': isDisabled(date),
              'date-picker-month__day--weekend': !isDisabled(date) && isWeekend(date) && getSpecialDayType(date) === null,
              'date-picker-month__day--special-red': !isDisabled(date) && getSpecialDayType(date) === 0,
              'date-picker-month__day--special-blue': !isDisabled(date) && getSpecialDayType(date) === 1,
            }"
            :disabled="isDisabled(date)"
            @click="!isDisabled(date) && handleDayClick(date)"
          >
            {{ date.getDate() }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ru } from "date-fns/locale";

export interface SpecialDay {
  Id: string;
  Description: string;
  Day: number;
  Date: string;
  IsArchived: boolean;
}

const props = defineProps<{
  month: number; // 0-11
  year: number;
  specialDays?: SpecialDay[];
  nonWorkingDays?: string[];
}>();

const emit = defineEmits<{
  (e: 'day-click', date: Date): void;
}>();

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const displayedMonth = computed(() => {
  return new Date(props.year, props.month, 1);
});

const formattedMonth = computed(() => {
  return format(displayedMonth.value, "LLLL", { locale: ru }).replace(
    /^./,
    (str: string) => str.toUpperCase(),
  );
});

const weeks = computed(() => {
  const start = startOfWeek(startOfMonth(displayedMonth.value), {
    weekStartsOn: 1,
  });
  const end = endOfWeek(endOfMonth(displayedMonth.value), {
    weekStartsOn: 1,
  });

  const days = eachDayOfInterval({ start, end });

  const weeksArray = [];
  for (let i = 0; i < days.length; i += 7) {
    weeksArray.push(days.slice(i, i + 7));
  }

  return weeksArray;
});

function isDisabled(date: Date) {
  return date.getMonth() !== displayedMonth.value.getMonth();
}

function isWeekend(date: Date): boolean {
  // Проверяем, является ли день субботой (6) или воскресеньем (0)
  const dayOfWeek = date.getDay()
  const isSaturdayOrSunday = dayOfWeek === 0 || dayOfWeek === 6
  
  // Проверяем, есть ли день в списке праздников из API
  let isHoliday = false
  if (props.nonWorkingDays && props.nonWorkingDays.length > 0) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    isHoliday = props.nonWorkingDays.includes(dateStr)
  }
  
  return isSaturdayOrSunday || isHoliday
}

function handleDayClick(date: Date) {
  emit('day-click', date);
}

function getSpecialDayType(date: Date): number | null {
  if (!props.specialDays || props.specialDays.length === 0) return null;
  
  // Форматируем дату в YYYY-MM-DD без учёта часового пояса
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  const specialDay = props.specialDays.find(sd => {
    // Берём только дату из строки, игнорируя время и часовой пояс
    const sdDate = sd.Date.split('T')[0];
    return sdDate === dateStr;
  });
  
  if (specialDay) {
    // Проверяем, соответствует ли Day дню недели этой даты
    const actualDayOfWeek = date.getDay(); // 0-6
    
    // Если Day совпадает с реальным днём недели - это "по умолчанию", не красим
    if (specialDay.Day === actualDayOfWeek) {
      return null;
    }
    
    // Если Day = 0 или 1, и не совпадает с реальным днём недели - красим
    if (specialDay.Day === 0 || specialDay.Day === 1) {
      return specialDay.Day;
    }
  }
  
  return null;
}
</script>

<script lang="ts">
export default {
  name: "DatePicker",
};
</script>

<style lang="scss" scoped>
.date-picker-calendar {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 12px;

  .date-picker-controls {
    align-items: center;
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    display: flex;
    justify-content: center;
    margin: 0;
    padding: 8px 0;

    &__title {
      font-size: 16px;
      font-weight: 600;
      text-transform: capitalize;
    }
  }

  .date-picker-month {
    margin: 0;
    padding: 0;

    &__weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      margin-top: 8px;
    }

    &__weekday {
      color: rgba(0, 0, 0, 0.6);
      font-size: 11px;
      height: 24px;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &__days {
      display: grid;
      gap: 0;
      grid-template-rows: repeat(6, 1fr);
    }

    &__week {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }

    &__day {
      align-items: center;
      background: none;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      font-size: 13px;
      font-weight: 400;
      height: 32px;
      justify-content: center;
      margin: 2px;
      padding: 0;
      width: 32px;
      color: rgba(0, 0, 0, 0.87);
      transition: background 0.2s ease;

      &:hover:not(:disabled) {
        background: rgba(0, 0, 0, 0.05);
      }

      &:disabled {
        cursor: default;
      }

      &--disabled {
        color: rgba(0, 0, 0, 0.38);
      }

      &--special-red {
        background: #ef4444;
        color: white;
        font-weight: 600;
      }

      &--special-blue {
        background: #3b82f6;
        color: white;
        font-weight: 600;
      }

      &--weekend {
        background: #ffc0cb;
        color: #fff;
        font-weight: 500;
      }
    }
  }
}
</style>
