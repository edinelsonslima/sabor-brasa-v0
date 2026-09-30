export type PaymentMethod = 'pix' | 'dinheiro' | 'combinado'

export type Module = 'sale' | 'stock' | 'payments' | 'manager' | 'audit' | 'admin'

export interface Tenant {
  id: string
  name: string
}

export type ProductCategory = 'bebida' | 'comida'

export interface Product {
  id: string
  name: string
  unit: 'unidade' | 'litro'
  price: number
  imageUrl?: string
  category?: ProductCategory
  stock?: number
}

export interface OrderProduct {
  productId: string
  quantity: number
}

export interface Order {
  id: string
  name: string
  products: OrderProduct[]
  status: 'open' | 'closed'
  openedAt: number
  paymentMethod?: PaymentMethod
  price?: { total: number; cash: number; pix: number }
  closedAt?: number
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

export type ExpenseCategory = 'bebidas_comida' | 'funcionarios' | 'outros'

export interface Expense {
  id: string
  description: string
  category: ExpenseCategory
  amount: number
  date: string
  timestamp: number
}
