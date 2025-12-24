/**
 * Причины начислений/списаний баллов
 */
export enum PointReasonEnum {
  /** Регистрация пользователя */
  Registration = 0,
  
  /** За заполнение профиля */
  ProfileFullFillment = 1,
  
  /** Реферальное приглашение в систему */
  Invite = 2,
  
  /** Оставленный отзыв */
  Review = 3,
  
  // /** Продление тариффа */
  // TariffExtention = 4,
  
  // /** Бронирование */
  // Booking = 5,
  
  // /** Списание при оплате тарифа */
  // TariffPayment = 6,
  
  // /** Списание при оплате бронирования */
  // BookingPayment = 7,
}

/**
 * Человекочитаемые названия причин баллов
 */
export const PointReasonLabels: Record<PointReasonEnum, string> = {
  [PointReasonEnum.Registration]: 'За регистрацию',
  [PointReasonEnum.ProfileFullFillment]: 'За заполнение профиля', 
  [PointReasonEnum.Invite]: 'За реферальное приглашение',
  [PointReasonEnum.Review]: 'За отзыв'
}

/**
 * Опции для селекта типов баллов
 */
export const pointReasonOptions = Object.entries(PointReasonLabels).map(([key, label]) => ({
  value: Number(key),
  title: label
}))