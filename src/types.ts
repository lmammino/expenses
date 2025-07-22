export interface ExpenseRecord {
  date: string
  provider: string
  description: string
  amount: number
  currency: string
  rate: number
  total: string
}

export interface ExchangeRateResponse<
  DATE extends string = string,
  CURRENCY extends string = string,
> {
  data: Record<DATE, Record<CURRENCY, number>>
}

export interface CommandOptions {
  targetCurrency: string
  header: boolean
}
