import { supabase } from './supabase'
import type { Ingredient, IngredientFormData, StockMovement, Alert } from './types'

const ITEMS_PER_PAGE = 20

export interface IngredientFilters {
  category?: string | null
  status?: 'all' | 'low_stock' | 'expiring_soon' | 'expired' | null
  search?: string
}

export interface PaginatedIngredients {
  data: Ingredient[]
  count: number
  page: number
  totalPages: number
}

/**
 * Busca ingredientes com paginação, filtros e busca
 */
export async function getIngredients(
  restaurantId: string,
  page: number = 1,
  filters: IngredientFilters = {}
): Promise<PaginatedIngredients> {
  let query = supabase
    .from('ingredients')
    .select('*', { count: 'exact' })
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  // Filtro de busca por nome
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  // Filtro por categoria
  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  // Filtro por status
  // Nota: O filtro de estoque baixo será feito no cliente após buscar os dados
  // pois o Supabase não suporta comparação direta entre colunas facilmente
  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'expired') {
      const today = new Date().toISOString().split('T')[0]
      query = query.lt('expiry_date', today)
    } else if (filters.status === 'expiring_soon') {
      const today = new Date().toISOString().split('T')[0]
      const threeDaysFromNow = new Date()
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
      const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0]
      query = query
        .gte('expiry_date', today)
        .lte('expiry_date', threeDaysStr)
    }
  }

  // Paginação (só aplica se não for filtro de estoque baixo)
  if (filters.status !== 'low_stock') {
    const from = (page - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1
    query = query.range(from, to)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Erro ao buscar ingredientes: ${error.message}`)
  }

  let filteredData = data || []

  // Filtro de estoque baixo no cliente (se necessário)
  if (filters.status === 'low_stock') {
    filteredData = filteredData.filter((item) => item.quantity <= item.min_stock)
  }

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  return {
    data: paginatedData,
    count: filteredData.length,
    page,
    totalPages: totalPages || 1,
  }
}

/**
 * Busca um ingrediente por ID
 */
export async function getIngredientById(id: string): Promise<Ingredient | null> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Erro ao buscar ingrediente: ${error.message}`)
  }

  return data
}

/**
 * Cria um novo ingrediente
 */
export async function createIngredient(
  restaurantId: string,
  data: IngredientFormData
): Promise<Ingredient> {
  const { data: ingredient, error } = await supabase
    .from('ingredients')
    .insert({
      restaurant_id: restaurantId,
      ...data,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar ingrediente: ${error.message}`)
  }

  return ingredient
}

/**
 * Atualiza um ingrediente
 */
export async function updateIngredient(
  id: string,
  data: Partial<IngredientFormData>
): Promise<Ingredient> {
  const { data: ingredient, error } = await supabase
    .from('ingredients')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar ingrediente: ${error.message}`)
  }

  return ingredient
}

/**
 * Deleta um ingrediente
 */
export async function deleteIngredient(id: string): Promise<void> {
  const { error } = await supabase.from('ingredients').delete().eq('id', id)

  if (error) {
    throw new Error(`Erro ao deletar ingrediente: ${error.message}`)
  }
}

/**
 * Busca categorias únicas de ingredientes
 */
export async function getCategories(restaurantId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('category')
    .eq('restaurant_id', restaurantId)
    .not('category', 'is', null)

  if (error) {
    throw new Error(`Erro ao buscar categorias: ${error.message}`)
  }

  const categories = [...new Set(data.map((item) => item.category).filter(Boolean))]
  return categories as string[]
}

/**
 * Busca histórico de movimentações de um ingrediente
 */
export async function getIngredientMovements(
  ingredientId: string
): Promise<StockMovement[]> {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('ingredient_id', ingredientId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar movimentações: ${error.message}`)
  }

  return data || []
}

/**
 * Cria uma movimentação manual de estoque
 */
export async function createStockMovement(
  ingredientId: string,
  type: StockMovement['type'],
  quantity: number,
  notes?: string
): Promise<void> {
  // Busca ingrediente atual
  const ingredient = await getIngredientById(ingredientId)
  if (!ingredient) {
    throw new Error('Ingrediente não encontrado')
  }

  const previousQuantity = ingredient.quantity
  let newQuantity = previousQuantity

  // Calcula nova quantidade baseado no tipo
  if (type === 'purchase') {
    newQuantity = previousQuantity + quantity
  } else if (type === 'sale' || type === 'waste' || type === 'expired') {
    newQuantity = Math.max(0, previousQuantity - quantity)
  } else if (type === 'adjustment') {
    newQuantity = quantity
  }

  // Atualiza ingrediente (isso vai criar a movimentação via trigger)
  const { error: updateError } = await supabase
    .from('ingredients')
    .update({ quantity: newQuantity })
    .eq('id', ingredientId)

  if (updateError) {
    throw new Error(`Erro ao atualizar estoque: ${updateError.message}`)
  }

  // Se tiver notas, atualiza a última movimentação criada pelo trigger
  if (notes) {
    const { data: movements } = await supabase
      .from('stock_movements')
      .select('id')
      .eq('ingredient_id', ingredientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (movements) {
      await supabase
        .from('stock_movements')
        .update({ notes, type })
        .eq('id', movements.id)
    }
  }
}

/**
 * Busca alertas não lidos do restaurante
 */
export async function getUnreadAlerts(restaurantId: string): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar alertas: ${error.message}`)
  }

  return data || []
}

/**
 * Busca todos os alertas de um restaurante (lidos e não lidos)
 */
export async function getAllAlerts(restaurantId: string): Promise<Alert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar alertas: ${error.message}`)
  }

  return data || []
}

/**
 * Marca alerta como lido
 */
export async function markAlertAsRead(alertId: string): Promise<void> {
  const { error } = await supabase
    .from('alerts')
    .update({ is_read: true })
    .eq('id', alertId)

  if (error) {
    throw new Error(`Erro ao marcar alerta como lido: ${error.message}`)
  }
}

/**
 * Calcula o status de um ingrediente baseado em quantidade e validade
 * Retorna apenas o status mais crítico (para compatibilidade)
 */
export function getIngredientStatus(ingredient: Ingredient): {
  type: 'low_stock' | 'expiring_soon' | 'expired' | 'ok'
  label: string
  variant: 'destructive' | 'warning' | 'success' | 'default'
} {
  const statuses = getIngredientStatuses(ingredient)
  // Retorna o mais crítico (vencido > vencendo > estoque baixo > ok)
  return statuses[0] || {
    type: 'ok',
    label: 'OK',
    variant: 'success',
  }
}

/**
 * Retorna todos os status ativos de um ingrediente
 */
export function getIngredientStatuses(ingredient: Ingredient): Array<{
  type: 'low_stock' | 'expiring_soon' | 'expired'
  label: string
  variant: 'destructive' | 'warning'
}> {
  const statuses: Array<{
    type: 'low_stock' | 'expiring_soon' | 'expired'
    label: string
    variant: 'destructive' | 'warning'
  }> = []
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Verifica se está vencido
  if (ingredient.expiry_date) {
    // Cria data no fuso horário local para evitar problema de um dia a menos
    const parts = ingredient.expiry_date.split('-')
    const expiryDate = parts.length === 3
      ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      : new Date(ingredient.expiry_date)
    expiryDate.setHours(0, 0, 0, 0)

    if (expiryDate < today) {
      statuses.push({
        type: 'expired',
        label: 'Vencido',
        variant: 'destructive',
      })
    } else {
      // Verifica se está vencendo em até 3 dias
      const threeDaysFromNow = new Date(today)
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

      if (expiryDate <= threeDaysFromNow) {
        statuses.push({
          type: 'expiring_soon',
          label: 'Vencendo em breve',
          variant: 'warning',
        })
      }
    }
  }

  // Verifica estoque baixo (pode coexistir com alertas de vencimento)
  if (ingredient.quantity <= ingredient.min_stock) {
    statuses.push({
      type: 'low_stock',
      label: 'Estoque baixo',
      variant: 'warning',
    })
  }

  return statuses
}
