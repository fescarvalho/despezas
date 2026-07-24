// Central type definitions for the Despezas app

export type AccountType = 'checking' | 'savings' | 'investment'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  icon: string
  created_at?: string
}

export type CardBrand = 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard'

export interface CreditCard {
  id: string
  name: string
  limit_amount: number
  closing_day: number
  due_day: number
  brand_icon: CardBrand
  color?: string
  created_at?: string
}

export type InvoiceStatus = 'open' | 'closed' | 'paid'

export interface Invoice {
  id: string
  card_id: string
  month: number
  year: number
  status: InvoiceStatus
  total_amount: number
  created_at?: string
}

export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  color: string
  icon: string
  type: CategoryType
  budget?: number
  created_at?: string
}

export type TransactionType = 'income' | 'expense' | 'transfer'

export interface InstallmentInfo {
  current: number
  total: number
}

export interface Transaction {
  id: string
  account_id?: string | null
  invoice_id?: string | null
  category_id: string
  amount: number
  date: string
  description: string
  type: TransactionType
  is_installment: boolean
  installment_info?: InstallmentInfo | null
  created_at?: string
  // Joined data
  category?: Category
  account?: Account
  invoice?: Invoice & { credit_card?: CreditCard }
}

export interface MonthYear {
  month: number // 1-12
  year: number
}

export interface DashboardSummary {
  totalBalance: number
  monthIncome: number
  monthExpenses: number
  openInvoices: number
}
