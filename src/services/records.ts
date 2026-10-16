import { productStore } from '@/stores/product'
import { employeeStore } from '@/stores/employee'
import { staffPaymentStore } from '@/stores/staffPayment'
import { expenseStore } from '@/stores/expense'
import { localDateKey } from '@/lib/date'
import { logAudit } from './audit'
export const expenseCategories = { bebidas_comida: 'Bebidas e comida', funcionarios: 'Funcionários', outros: 'Outros' }
export function addProduct(...args: Parameters<typeof productStore.action.add>) {
  const product = productStore.action.add(...args)
  logAudit('product_created', `Produto cadastrado: ${product.name}`)
  return product
}
export function updateProduct(...args: Parameters<typeof productStore.action.update>) {
  productStore.action.update(...args); logAudit('product_edited', `Produto editado: ${args[0]}`)
}
export function deleteProduct(id: string) {
  const product = productStore.action.get(id)
  productStore.action.delete(id); logAudit('product_deleted', `Produto excluído: ${product?.name ?? id}`)
}
export function addEmployee(...args: Parameters<typeof employeeStore.action.add>) {
  const employee = employeeStore.action.add(...args)
  logAudit('employee_created', `Funcionário cadastrado: ${employee.name}`); return employee
}
export function deleteEmployee(id: string) {
  const employee = employeeStore.action.get(id)
  employeeStore.action.delete(id); logAudit('employee_deleted', `Funcionário excluído: ${employee?.name ?? id}`)
}
export function addStaffPayment(data: Parameters<typeof staffPaymentStore.action.add>[0]) {
  const entry = staffPaymentStore.action.add({ ...data, date: localDateKey(data.date) })
  const receiver = data.receiver?.type === 'employee' ? employeeStore.action.get(data.receiver.id)?.name : data.receiver?.id
  logAudit('payment_created', `Diária de R$ ${data.amount} para ${receiver ?? '?'}`); return entry
}
export function deleteStaffPayment(id: string) {
  const entry = staffPaymentStore.action.get(id)
  staffPaymentStore.action.delete(id); logAudit('payment_deleted', `Diária excluída - R$ ${entry?.amount ?? '?'}`)
}
export function addExpense(data: Parameters<typeof expenseStore.action.add>[0]) {
  const entry = expenseStore.action.add({ ...data, date: localDateKey(data.date) })
  logAudit('expense_created', `Gasto: ${entry.description} - ${entry.amount}`); return entry
}
export function deleteExpense(id: string) {
  expenseStore.action.delete(id); logAudit('expense_deleted', `Gasto excluído: ${id}`)
}
