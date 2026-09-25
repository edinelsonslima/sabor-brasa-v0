export type PaymentMethod = 'pix' | 'dinheiro' | 'combinado'

export type Module = 'sale' | 'stock' | 'payments' | 'manager' | 'audit' | 'admin'

export interface Tenant {
  id: string
  name: string
}

export interface Product {
  id: string
  name: string
  unit: 'unidade' | 'litro'
  price: number
}

export interface SaleProducts {
  regular: { id: string; quantity: number }[]
  custom: (Product & { quantity: number })[]
}

export interface Sale {
  id: string
  date: string
  timestamp: number
  paymentMethod: PaymentMethod
  price: { total: number; cash: number; pix: number }
  products: SaleProducts
}

export interface Employee {
  id: string
  name: string
  avatarUrl?: string
  defaultRates: [number, number]
}

export interface Payment {
  id: string
  amount: number
  date: string
  timestamp: number
  receiver?: {
    type: 'employee' | 'external'
    id: string
  }
}

export interface Order {
  id: string
  name: string
  status: 'open' | 'closed'
  openedAt: number
  closedAt?: number
  items: SaleProducts
  saleId?: string
}

export type ExpenseCategory = 'bebidas_comida' | 'funcionarios' | 'outros'

export interface Expense {
  id: string
  description: string
  category: ExpenseCategory
  amount: number
  date: string
  timestamp: number
}
