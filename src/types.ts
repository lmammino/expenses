export interface ExpenseMatch {
  year: string
  month: string
  day: string
  provider: string
  description: string
  amount: string
  currency: string
}

export interface ExpenseRecord {
  date: string
  provider: string
  description: string
  amount: number
  currency: string
  rate: number
  total: string
}

export interface ExchangeRateResponse {
  rates: Record<string, number>
}

export interface CommandOptions {
  targetCurrency: string
  header: boolean
}
