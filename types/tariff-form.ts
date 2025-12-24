import type { TariffCategory } from '../classes/api/TariffsService'

export type TariffPeriodType = 'Day' | 'Month'

export interface TariffFormPayload {
  name: string
  description: string
  validFrom: string
  validTo: string | null
  periodType: TariffPeriodType
  periodQuantity: number
  price: number
  subtariffIds: string[]
  isOneTimeUse: boolean
  autoRenewal: boolean
  isDefault: boolean
  isActive: boolean
}

export interface TariffFormProps {
  category: TariffCategory
}
