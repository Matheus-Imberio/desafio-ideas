import { supabase } from './supabase'
import type { DashboardStats, Ingredient } from './types'

/**
 * Busca estatísticas do dashboard
 */
export async function getDashboardStats(restaurantId: string): Promise<DashboardStats> {
  // Busca todos os ingredientes
  const { data: ingredients, error: ingredientsError } = await supabase
    .from('ingredients')
    .select('*')
    .eq('restaurant_id', restaurantId)

  if (ingredientsError) {
    throw new Error(`Erro ao buscar ingredientes: ${ingredientsError.message}`)
  }

  const allIngredients = ingredients || []

  // Calcula estatísticas básicas
  const totalIngredients = allIngredients.length
  const categories = new Set(allIngredients.map(i => i.category).filter(Boolean))
  const totalCategories = categories.size

  // Conta alertas
  let lowStockCount = 0
  let expiringSoonCount = 0
  let expiredCount = 0
  const expiringNext7Days: Ingredient[] = []

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysFromNow = new Date(today)
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

  for (const ing of allIngredients) {
    // Estoque baixo
    if (ing.quantity <= ing.min_stock) {
      lowStockCount++
    }

    // Vencimento
    if (ing.expiry_date) {
      const parts = ing.expiry_date.split('-')
      if (parts.length === 3) {
        const expiryDate = new Date(
          parseInt(parts[0]),
          parseInt(parts[1]) - 1,
          parseInt(parts[2])
        )
        expiryDate.setHours(0, 0, 0, 0)

        const daysDiff = Math.floor(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysDiff < 0) {
          expiredCount++
        } else if (daysDiff <= 3) {
          expiringSoonCount++
        }

        // Próximos 7 dias
        if (daysDiff >= 0 && daysDiff <= 7) {
          expiringNext7Days.push(ing)
        }
      }
    }
  }

  // Estoque por categoria
  const stockByCategoryMap = new Map<string, { count: number; totalQuantity: number }>()
  for (const ing of allIngredients) {
    const category = ing.category || 'Sem categoria'
    const current = stockByCategoryMap.get(category) || { count: 0, totalQuantity: 0 }
    stockByCategoryMap.set(category, {
      count: current.count + 1,
      totalQuantity: current.totalQuantity + ing.quantity,
    })
  }
  const stockByCategory = Array.from(stockByCategoryMap.entries()).map(([category, data]) => ({
    category,
    ...data,
  }))

  // Top 10 ingredientes mais usados (últimos 30 dias)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: movements, error: movementsError } = await supabase
    .from('stock_movements')
    .select('ingredient_id, ingredients(name)')
    .eq('type', 'sale')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .in(
      'ingredient_id',
      allIngredients.map(i => i.id)
    )

  if (movementsError) {
    console.error('Erro ao buscar movimentações:', movementsError)
  }

  const usageMap = new Map<string, { ingredient_id: string; ingredient_name: string; count: number }>()
  if (movements) {
    for (const mov of movements) {
      const ingId = mov.ingredient_id
      const ingName = (mov.ingredients as any)?.name || 'Ingrediente desconhecido'
      const current = usageMap.get(ingId) || { ingredient_id: ingId, ingredient_name: ingName, count: 0 }
      usageMap.set(ingId, { ...current, count: current.count + 1 })
    }
  }

  const topUsedIngredients = Array.from(usageMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Movimentações dos últimos 30 dias (agrupadas por dia)
  const ingredientIds = allIngredients.map(i => i.id)
  const { data: allMovements, error: allMovementsError } = await supabase
    .from('stock_movements')
    .select('created_at')
    .in('ingredient_id', ingredientIds)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  const movementsByDate = new Map<string, number>()
  if (allMovements) {
    for (const mov of allMovements) {
      const date = new Date(mov.created_at).toISOString().split('T')[0]
      movementsByDate.set(date, (movementsByDate.get(date) || 0) + 1)
    }
  }

  const movementsLast30Days = Array.from(movementsByDate.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Valor estimado do estoque (se tiver preços de fornecedores)
  // Por enquanto retorna null, pode ser implementado depois
  const totalStockValue = null

  // Busca vendas de receitas (faturamento)
  const { data: sales, error: salesError } = await supabase
    .from('recipe_sales')
    .select(`
      id,
      recipe_id,
      quantity,
      price,
      sold_at,
      recipes(name)
    `)
    .eq('restaurant_id', restaurantId)

  let totalRevenue = 0
  let totalSales = 0
  const revenueByDate = new Map<string, { revenue: number; sales: number }>()
  const recipeSalesMap = new Map<string, { recipe_id: string; recipe_name: string; sales: number; revenue: number }>()

  if (!salesError && sales) {
    for (const sale of sales) {
      const salePrice = sale.price || 0
      const saleQuantity = sale.quantity || 1
      const revenue = salePrice * saleQuantity
      
      totalRevenue += revenue
      totalSales += saleQuantity

      // Agrupa por data (últimos 30 dias)
      const saleDate = new Date(sale.sold_at)
      if (saleDate >= thirtyDaysAgo) {
        const dateStr = saleDate.toISOString().split('T')[0]
        const current = revenueByDate.get(dateStr) || { revenue: 0, sales: 0 }
        revenueByDate.set(dateStr, {
          revenue: current.revenue + revenue,
          sales: current.sales + saleQuantity,
        })
      }

      // Top receitas vendidas
      const recipeId = sale.recipe_id
      const recipeName = (sale.recipes as any)?.name || 'Receita desconhecida'
      const current = recipeSalesMap.get(recipeId) || {
        recipe_id: recipeId,
        recipe_name: recipeName,
        sales: 0,
        revenue: 0,
      }
      recipeSalesMap.set(recipeId, {
        ...current,
        sales: current.sales + saleQuantity,
        revenue: current.revenue + revenue,
      })
    }
  }

  const revenueLast30Days = Array.from(revenueByDate.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const topSellingRecipes = Array.from(recipeSalesMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Busca gastos (compras) das transações financeiras
  const { data: expenses, error: expensesError } = await supabase
    .from('financial_transactions')
    .select('amount, transaction_date')
    .eq('restaurant_id', restaurantId)
    .eq('type', 'expense')

  let totalExpenses = 0
  let monthlyExpenses = 0
  if (!expensesError && expenses) {
    totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
    
    // Calcula compras do mês atual
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    monthlyExpenses = expenses
      .filter(exp => {
        const expDate = new Date(exp.transaction_date)
        return expDate >= firstDayOfMonth
      })
      .reduce((sum, exp) => sum + (exp.amount || 0), 0)
  }

  // Busca receitas das transações financeiras (mais confiável que recipe_sales)
  const { data: revenues, error: revenuesError } = await supabase
    .from('financial_transactions')
    .select('amount, transaction_date')
    .eq('restaurant_id', restaurantId)
    .eq('type', 'revenue')

  let monthlyRevenue = 0
  let monthlySales = 0
  
  // Calcula vendas (quantidade) do mês atual
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  firstDayOfMonth.setHours(0, 0, 0, 0)
  
  const salesThisMonth = sales?.filter(sale => {
    const saleDate = new Date(sale.sold_at)
    saleDate.setHours(0, 0, 0, 0)
    return saleDate >= firstDayOfMonth
  }) || []
  
  monthlySales = salesThisMonth.reduce((sum, sale) => sum + (sale.quantity || 1), 0)
  
  // Se houver transações financeiras de receita, usa elas (mais confiável)
  if (!revenuesError && revenues && revenues.length > 0) {
    const revenueFromTransactions = revenues.reduce((sum, rev) => sum + (rev.amount || 0), 0)
    // Usa o maior valor entre recipe_sales e financial_transactions
    totalRevenue = Math.max(totalRevenue, revenueFromTransactions)
    
    // Calcula vendas do mês atual (receita em R$)
    monthlyRevenue = revenues
      .filter(rev => {
        const revDate = new Date(rev.transaction_date)
        revDate.setHours(0, 0, 0, 0)
        return revDate >= firstDayOfMonth
      })
      .reduce((sum, rev) => sum + (rev.amount || 0), 0)
  } else {
    // Se não houver transações financeiras, calcula do recipe_sales
    monthlyRevenue = salesThisMonth.reduce((sum, sale) => {
      const salePrice = sale.price || 0
      const saleQuantity = sale.quantity || 1
      return sum + (salePrice * saleQuantity)
    }, 0)
  }

  return {
    totalIngredients,
    totalCategories,
    lowStockCount,
    expiringSoonCount,
    expiredCount,
    totalStockValue,
    stockByCategory,
    topUsedIngredients,
    movementsLast30Days,
    expiringNext7Days,
    totalRevenue,
    totalSales,
    revenueLast30Days,
    topSellingRecipes,
    totalExpenses,
    monthlyExpenses,
    monthlyRevenue,
    monthlySales,
  }
}
