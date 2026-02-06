import { supabase } from './supabase'
import type { FinancialTransaction } from './types'

/**
 * Cria uma transação financeira
 */
export async function createFinancialTransaction(
  restaurantId: string,
  data: {
    type: 'revenue' | 'expense'
    description: string
    amount: number
    category?: string
    reference_id?: string
    supplier_id?: string
    userId: string
    transaction_date?: string
  }
): Promise<FinancialTransaction> {
  const { data: transaction, error } = await supabase
    .from('financial_transactions')
    .insert({
      restaurant_id: restaurantId,
      type: data.type,
      description: data.description,
      amount: data.amount,
      category: data.category || null,
      reference_id: data.reference_id || null,
      supplier_id: data.supplier_id || null,
      user_id: data.userId,
      transaction_date: data.transaction_date || new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar transação financeira: ${error.message}`)
  }

  return transaction
}

/**
 * Busca todas as transações financeiras de um restaurante
 */
export async function getFinancialTransactions(
  restaurantId: string,
  filters?: {
    type?: 'revenue' | 'expense'
    startDate?: string
    endDate?: string
    limit?: number
  }
): Promise<FinancialTransaction[]> {
  let query = supabase
    .from('financial_transactions')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('transaction_date', { ascending: false })

  if (filters?.type) {
    query = query.eq('type', filters.type)
  }

  if (filters?.startDate) {
    query = query.gte('transaction_date', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('transaction_date', filters.endDate)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Erro ao buscar transações financeiras: ${error.message}`)
  }

  // Busca detalhes adicionais (itens da lista e fornecedor)
  const transactionsWithDetails = await Promise.all(
    (data || []).map(async (transaction) => {
      let enhancedTransaction = { ...transaction }
      
      // Busca nome do fornecedor se houver supplier_id
      if (transaction.supplier_id) {
        try {
          const { getSupplierById } = await import('./suppliers')
          const supplier = await getSupplierById(transaction.supplier_id)
          if (supplier) {
            enhancedTransaction = {
              ...enhancedTransaction,
              description: `${enhancedTransaction.description}\nFornecedor: ${supplier.name}`,
            }
          }
        } catch (error) {
          console.error('Erro ao buscar fornecedor:', error)
        }
      }
      
      // Se for uma transação de lista de compras, busca os detalhes dos itens
      if (transaction.category === 'shopping_list' && transaction.reference_id) {
        try {
          const { getShoppingListById } = await import('./shopping-lists')
          const list = await getShoppingListById(transaction.reference_id)
          
          if (list && list.items.length > 0) {
            const itemsWithPrice = list.items.filter(item => item.price && item.price > 0)
            if (itemsWithPrice.length > 0) {
              // Melhora a descrição com detalhes dos itens
              const itemsDetail = itemsWithPrice
                .map(item => `${item.ingredient_name} (${item.quantity_needed} ${item.unit}) - R$ ${(item.price || 0).toFixed(2).replace('.', ',')}`)
                .join('; ')
              
              enhancedTransaction = {
                ...enhancedTransaction,
                description: `${enhancedTransaction.description}\nItens: ${itemsDetail}`,
              }
            }
          }
        } catch (error) {
          console.error('Erro ao buscar detalhes da lista:', error)
        }
      }
      
      return enhancedTransaction
    })
  )

  return transactionsWithDetails
}

/**
 * Busca estatísticas financeiras
 */
export async function getFinancialStats(restaurantId: string): Promise<{
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  revenueLast30Days: Array<{ date: string; revenue: number; expenses: number }>
}> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: transactions, error } = await supabase
    .from('financial_transactions')
    .select('type, amount, transaction_date')
    .eq('restaurant_id', restaurantId)
    .gte('transaction_date', thirtyDaysAgo.toISOString())

  if (error) {
    throw new Error(`Erro ao buscar estatísticas financeiras: ${error.message}`)
  }

  let totalRevenue = 0
  let totalExpenses = 0
  const revenueByDate = new Map<string, { revenue: number; expenses: number }>()

  if (transactions) {
    for (const transaction of transactions) {
      if (transaction.type === 'revenue') {
        totalRevenue += transaction.amount
      } else {
        totalExpenses += transaction.amount
      }

      const date = new Date(transaction.transaction_date).toISOString().split('T')[0]
      const current = revenueByDate.get(date) || { revenue: 0, expenses: 0 }
      revenueByDate.set(date, {
        revenue: current.revenue + (transaction.type === 'revenue' ? transaction.amount : 0),
        expenses: current.expenses + (transaction.type === 'expense' ? transaction.amount : 0),
      })
    }
  }

  const revenueLast30Days = Array.from(revenueByDate.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    revenueLast30Days,
  }
}

/**
 * Deleta uma transação financeira
 */
export async function deleteFinancialTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Erro ao deletar transação financeira: ${error.message}`)
  }
}
