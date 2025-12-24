export type PartnerCommissionMode = 'all-orders' | 'closed-orders'
export type PartnerCommissionUnit = 'percent' | 'currency'

export interface PartnerSubtariffFormPayload {
  tariffId: string
  name: string
  description: string
  sphereIds: string[]
  cityIds: string[]
  sourceKeys: string[]
  commissionMode: PartnerCommissionMode
  commissionUnit: PartnerCommissionUnit
  bookingCommissionValue: number | null
  orderCommissionValue: number | null
  perPosition: boolean
  isActive: boolean
}

export interface OptionItem {
  id: string
  label: string
}

export interface SourceOption extends OptionItem {
  icon?: string
}
