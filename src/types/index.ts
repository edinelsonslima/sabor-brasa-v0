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

/** Comanda aberta. Ao fechar, vira uma `Sale` e sai do orderStore. */
export interface Order {
  id: string
  name: string
  products: OrderProduct[]
  openedAt: number
}

export interface SaleItem {
  productId: string | null // null se o produto foi excluído depois
  name: string // snapshot do nome no momento da venda
  unitPrice: number // snapshot do preço no momento da venda
  quantity: number
}

export interface Sale {
  id: string
  orderId: string
  name: string
  items: SaleItem[]
  paymentMethod: PaymentMethod
  total: number
  cash: number
  pix: number
  closedAt: number
}

export interface Employee {
  id: string
  name: string
  avatarUrl?: string
  /** Valores pré-configurados de diária: [0] = meia diária, [1] = diária cheia */
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
