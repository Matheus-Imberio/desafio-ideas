import { supabase } from './supabase'
import type { ConsumptionAnalysis, Ingredient, StockMovement } from './types'

/**
 * Analisa consumo de um ingrediente
 */
export async function analyzeIngredientConsumption(
  ingredientId: string,
  days: number = 30
): Promise<ConsumptionAnalysis | null> {
  // Busca o ingrediente
  const { data: ingredient, error: ingError } = await supabase
    .from('ingredients')
    .select('*')
    .eq('id', ingredientId)
    .single()

  if (ingError || !ingredient) {
    return null
  }

  // Busca movimentações de venda dos últimos N dias
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: movements, error: movError } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('ingredient_id', ingredientId)
    .eq('type', 'sale')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })

  if (movError) {
    throw new Error(`Erro ao buscar movimentações: ${movError.message}`)
  }

  const salesMovements = (movements || []) as StockMovement[]

  if (salesMovements.length === 0) {
    return {
      ingredient_id: ingredientId,
      ingredient_name: ingredient.name,
      averageDailyConsumption: 0,
      averageWeeklyConsumption: 0,
      daysUntilEmpty: null,
      predictedEmptyDate: null,
      consumptionTrend: 'stable',
      lastMovementDate: null,
    }
  }

  // Calcula consumo total no período
  const totalConsumption = salesMovements.reduce((sum, mov) => sum + mov.quantity, 0)
  const averageDailyConsumption = totalConsumption / days
  const averageWeeklyConsumption = averageDailyConsumption * 7

  // Calcula quando o estoque vai acabar (se consumo > 0)
  let daysUntilEmpty: number | null = null
  let predictedEmptyDate: string | null = null

  if (averageDailyConsumption > 0 && ingredient.quantity > 0) {
    daysUntilEmpty = Math.floor(ingredient.quantity / averageDailyConsumption)
    const predictedDate = new Date()
    predictedDate.setDate(predictedDate.getDate() + daysUntilEmpty)
    predictedEmptyDate = predictedDate.toISOString().split('T')[0]
  }

  // Analisa tendência de consumo
  // Compara primeira metade com segunda metade do período
  const halfPoint = Math.floor(salesMovements.length / 2)
  const firstHalf = salesMovements.slice(0, halfPoint)
  const secondHalf = salesMovements.slice(halfPoint)

  const firstHalfConsumption = firstHalf.reduce((sum, mov) => sum + mov.quantity, 0)
  const secondHalfConsumption = secondHalf.reduce((sum, mov) => sum + mov.quantity, 0)

  let consumptionTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (secondHalfConsumption > firstHalfConsumption * 1.1) {
    consumptionTrend = 'increasing'
  } else if (secondHalfConsumption < firstHalfConsumption * 0.9) {
    consumptionTrend = 'decreasing'
  }

  // Data da última movimentação
  const lastMovement = salesMovements[salesMovements.length - 1]
  const lastMovementDate = lastMovement ? lastMovement.created_at : null

  return {
    ingredient_id: ingredientId,
    ingredient_name: ingredient.name,
    averageDailyConsumption,
    averageWeeklyConsumption,
    daysUntilEmpty,
    predictedEmptyDate,
    consumptionTrend,
    lastMovementDate,
  }
}

/**
 * Analisa consumo de todos os ingredientes
 */
export async function analyzeAllConsumption(
  restaurantId: string,
  days: number = 30
): Promise<ConsumptionAnalysis[]> {
  // Busca todos os ingredientes
  const { data: ingredients, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('restaurant_id', restaurantId)

  if (error) {
    throw new Error(`Erro ao buscar ingredientes: ${error.message}`)
  }

  // Analisa cada ingrediente
  const analyses: ConsumptionAnalysis[] = []
  for (const ing of ingredients || []) {
    const analysis = await analyzeIngredientConsumption(ing.id, days)
    if (analysis) {
      analyses.push(analysis)
    }
  }

  return analyses
}

/**
 * Identifica ingredientes com risco de ruptura
 */
export async function getRuptureRiskIngredients(
  restaurantId: string,
  days: number = 30
): Promise<Array<ConsumptionAnalysis & { riskLevel: 'high' | 'medium' | 'low' }>> {
  const analyses = await analyzeAllConsumption(restaurantId, days)

  return analyses
    .filter(analysis => {
      // Só inclui ingredientes com consumo e previsão de acabar
      return analysis.daysUntilEmpty !== null && analysis.daysUntilEmpty < 7
    })
    .map(analysis => {
      let riskLevel: 'high' | 'medium' | 'low' = 'low'

      if (analysis.daysUntilEmpty !== null) {
        if (analysis.daysUntilEmpty <= 2) {
          riskLevel = 'high'
        } else if (analysis.daysUntilEmpty <= 4) {
          riskLevel = 'medium'
        }
      }

      return {
        ...analysis,
        riskLevel,
      }
    })
    .sort((a, b) => {
      // Ordena por risco (high primeiro) e depois por dias até acabar
      if (a.riskLevel !== b.riskLevel) {
        const order = { high: 0, medium: 1, low: 2 }
        return order[a.riskLevel] - order[b.riskLevel]
      }
      return (a.daysUntilEmpty || 999) - (b.daysUntilEmpty || 999)
    })
}
