import type { Ingredient } from './types'
import { getAIRecipeSuggestions } from './ai'

export interface Recipe {
  id: string
  name: string
  description: string
  ingredients: string[]
  instructions: string[]
  cookingTime: number // em minutos
  servings: number
  priority: 'high' | 'medium' | 'low' // Alta prioridade = ingredientes vencendo
  matchedIngredients: string[] // Ingredientes que o usuário tem
  missingIngredients: string[] // Ingredientes que faltam
  reason?: string // Razão da sugestão (quando vem da IA)
  isAI?: boolean // Indica se veio da IA
}

/**
 * Base de dados de receitas comuns
 */
const RECIPES_DATABASE: Omit<Recipe, 'priority' | 'matchedIngredients' | 'missingIngredients'>[] = [
  {
    id: '1',
    name: 'Molho de Tomate',
    description: 'Molho caseiro perfeito para massas e pratos diversos',
    ingredients: ['tomate', 'cebola', 'alho', 'azeite', 'sal', 'pimenta'],
    instructions: [
      'Corte os tomates em cubos pequenos',
      'Refogue a cebola e o alho no azeite até dourar',
      'Adicione os tomates e deixe cozinhar por 20 minutos',
      'Tempere com sal e pimenta a gosto',
      'Bata no liquidificador se desejar textura mais lisa'
    ],
    cookingTime: 30,
    servings: 4
  },
  {
    id: '2',
    name: 'Salada de Tomate e Cebola',
    description: 'Salada fresca e rápida',
    ingredients: ['tomate', 'cebola', 'azeite', 'vinagre', 'sal'],
    instructions: [
      'Corte os tomates em rodelas',
      'Corte a cebola em rodelas finas',
      'Tempere com azeite, vinagre e sal',
      'Sirva imediatamente'
    ],
    cookingTime: 10,
    servings: 2
  },
  {
    id: '3',
    name: 'Arroz com Frango',
    description: 'Prato completo e saboroso',
    ingredients: ['arroz', 'frango', 'cebola', 'alho', 'sal', 'pimenta'],
    instructions: [
      'Tempere o frango com sal e pimenta',
      'Refogue a cebola e o alho',
      'Adicione o frango e deixe dourar',
      'Adicione o arroz e água',
      'Cozinhe até o arroz ficar macio'
    ],
    cookingTime: 45,
    servings: 4
  },
  {
    id: '4',
    name: 'Sopa de Legumes',
    description: 'Sopa nutritiva e reconfortante',
    ingredients: ['tomate', 'cebola', 'batata', 'cenoura', 'sal', 'pimenta'],
    instructions: [
      'Corte todos os legumes em cubos',
      'Refogue a cebola até ficar transparente',
      'Adicione os legumes e cubra com água',
      'Cozinhe até os legumes ficarem macios',
      'Tempere com sal e pimenta'
    ],
    cookingTime: 40,
    servings: 6
  },
  {
    id: '5',
    name: 'Omelete',
    description: 'Prato rápido e versátil',
    ingredients: ['ovo', 'tomate', 'cebola', 'sal', 'pimenta'],
    instructions: [
      'Bata os ovos com sal e pimenta',
      'Corte o tomate e a cebola em cubos pequenos',
      'Aqueça uma frigideira com azeite',
      'Adicione os ovos batidos',
      'Quando começar a firmar, adicione os legumes',
      'Dobre ao meio e sirva'
    ],
    cookingTime: 10,
    servings: 2
  },
  {
    id: '6',
    name: 'Frango Grelhado',
    description: 'Prato simples e saudável',
    ingredients: ['frango', 'sal', 'pimenta', 'alho', 'azeite'],
    instructions: [
      'Tempere o frango com sal, pimenta e alho',
      'Deixe marinar por 30 minutos',
      'Grelhe em fogo médio até dourar',
      'Sirva com acompanhamentos'
    ],
    cookingTime: 30,
    servings: 4
  },
  {
    id: '7',
    name: 'Risotto de Legumes',
    description: 'Risotto cremoso com legumes',
    ingredients: ['arroz', 'cebola', 'alho', 'tomate', 'queijo', 'manteiga'],
    instructions: [
      'Refogue a cebola e o alho',
      'Adicione o arroz e mexa até ficar translúcido',
      'Adicione o caldo quente aos poucos',
      'Quando quase pronto, adicione os legumes',
      'Finalize com queijo e manteiga'
    ],
    cookingTime: 35,
    servings: 4
  },
  {
    id: '8',
    name: 'Salada Completa',
    description: 'Salada nutritiva com vários ingredientes',
    ingredients: ['alface', 'tomate', 'cebola', 'azeite', 'vinagre', 'sal'],
    instructions: [
      'Lave e corte todos os vegetais',
      'Misture em uma saladeira',
      'Tempere com azeite, vinagre e sal',
      'Sirva fresco'
    ],
    cookingTime: 15,
    servings: 4
  }
]

/**
 * Normaliza nome de ingrediente para comparação
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim()
}

/**
 * Verifica se um ingrediente está disponível
 */
function isIngredientAvailable(
  recipeIngredient: string,
  availableIngredients: Ingredient[]
): { available: boolean; ingredient?: Ingredient } {
  const normalized = normalizeIngredientName(recipeIngredient)
  
  for (const ing of availableIngredients) {
    const ingName = normalizeIngredientName(ing.name)
    // Verifica se o nome do ingrediente contém ou é contido no nome da receita
    if (ingName.includes(normalized) || normalized.includes(ingName)) {
      return { available: true, ingredient: ing }
    }
  }
  
  return { available: false }
}

/**
 * Verifica se um ingrediente está vencido
 */
function isIngredientExpired(ingredient: Ingredient): boolean {
  if (!ingredient.expiry_date) return false
  
  // Cria data de hoje no fuso horário local (meia-noite)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  today.setHours(0, 0, 0, 0)
  
  const parts = ingredient.expiry_date.split('-')
  if (parts.length !== 3) return false
  
  const expiryDate = new Date(
    parseInt(parts[0]), 
    parseInt(parts[1]) - 1, 
    parseInt(parts[2])
  )
  expiryDate.setHours(0, 0, 0, 0)
  
  // Compara apenas as datas (sem hora)
  // Só retorna true se a data de vencimento é ANTERIOR a hoje
  // Se hoje é 5 de fev e vence em 6 de fev, retorna false (não está vencido)
  const daysDiff = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  return daysDiff < 0
}

/**
 * Calcula prioridade da receita baseado em:
 * - Ingredientes próximos do vencimento (prioridade alta)
 * - Ingredientes com bastante estoque (prioridade média)
 */
function calculatePriority(
  matchedIngredients: Ingredient[],
  expiringThreshold: number = 3
): 'high' | 'medium' | 'low' {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let expiringCount = 0
  let highStockCount = 0
  
  for (const ing of matchedIngredients) {
    // Verifica ingredientes próximos do vencimento (mas não vencidos)
    if (ing.expiry_date) {
      const parts = ing.expiry_date.split('-')
      const expiryDate = parts.length === 3
        ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        : new Date(ing.expiry_date)
      expiryDate.setHours(0, 0, 0, 0)
      
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      // Não conta vencidos (eles devem ser descartados)
      if (daysUntilExpiry >= 0 && daysUntilExpiry <= expiringThreshold) {
        expiringCount++
      }
    }
    
    // Verifica ingredientes com bastante estoque (mais que 2x o mínimo)
    // Prioriza usar ingredientes que estão acima do estoque mínimo
    if (ing.quantity > ing.min_stock * 2) {
      highStockCount++
    }
  }
  
  // Alta prioridade: tem ingredientes próximos do vencimento
  // Quanto mais ingredientes vencendo, maior a prioridade
  if (expiringCount >= 2) return 'high'
  if (expiringCount === 1) return 'high'
  
  // Média prioridade: tem bastante estoque para usar (evita desperdício)
  // Prioriza receitas que usam ingredientes com estoque alto
  if (highStockCount >= 2) return 'medium'
  if (highStockCount === 1 && matchedIngredients.length >= 3) return 'medium'
  
  return 'low'
}

/**
 * Busca receitas baseadas nos ingredientes disponíveis
 * NÃO inclui receitas que usam ingredientes vencidos
 * Tenta usar IA se disponível, senão usa receitas estáticas
 */
export async function getRecipeSuggestions(
  ingredients: Ingredient[],
  maxResults: number = 5
): Promise<Recipe[]> {
  const suggestions: Recipe[] = []
  
  // Filtra ingredientes vencidos (não devem ser usados)
  const validIngredients = ingredients.filter(ing => !isIngredientExpired(ing))
  
  for (const recipe of RECIPES_DATABASE) {
    const matchedIngredients: Ingredient[] = []
    const matchedNames: string[] = []
    const missingIngredients: string[] = []
    let hasExpiredIngredient = false
    
    // Verifica quais ingredientes da receita estão disponíveis
    for (const recipeIngredient of recipe.ingredients) {
      const result = isIngredientAvailable(recipeIngredient, validIngredients)
      if (result.available && result.ingredient) {
        matchedIngredients.push(result.ingredient)
        matchedNames.push(recipeIngredient)
      } else {
        // Verifica se falta porque está vencido
        const expiredResult = isIngredientAvailable(recipeIngredient, ingredients)
        if (expiredResult.available && expiredResult.ingredient && isIngredientExpired(expiredResult.ingredient)) {
          hasExpiredIngredient = true
          break // Não sugere receitas com ingredientes vencidos
        }
        missingIngredients.push(recipeIngredient)
      }
    }
    
    // Não sugere receitas que precisam de ingredientes vencidos
    if (hasExpiredIngredient) {
      continue
    }
    
    // Só sugere receitas onde tem pelo menos 50% dos ingredientes
    const matchRatio = matchedIngredients.length / recipe.ingredients.length
    if (matchRatio >= 0.5) {
      const priority = calculatePriority(matchedIngredients)
      
      suggestions.push({
        ...recipe,
        priority,
        matchedIngredients: matchedNames,
        missingIngredients,
        // Guarda os ingredientes correspondentes para ordenação
        _matchedIngredientObjects: matchedIngredients
      } as Recipe & { _matchedIngredientObjects?: Ingredient[] })
    }
  }
  
  // Ordena por prioridade (high > medium > low), depois por quantidade de ingredientes correspondentes
  // e finalmente por quantidade de estoque disponível
  suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    }
    
    // Se mesma prioridade, ordena por quantidade de ingredientes correspondentes
    if (b.matchedIngredients.length !== a.matchedIngredients.length) {
      return b.matchedIngredients.length - a.matchedIngredients.length
    }
    
    // Se mesma quantidade, prioriza receitas com mais ingredientes de alto estoque
    const getStockScore = (recipe: Recipe & { _matchedIngredientObjects?: Ingredient[] }) => {
      if (!recipe._matchedIngredientObjects) return 0
      let score = 0
      for (const ing of recipe._matchedIngredientObjects) {
        // Dá mais pontos para ingredientes com estoque alto (acima do mínimo)
        if (ing.min_stock > 0) {
          const stockRatio = ing.quantity / ing.min_stock
          score += stockRatio
        } else {
          // Se não tem estoque mínimo definido, usa a quantidade absoluta
          score += ing.quantity
        }
      }
      return score
    }
    
    return getStockScore(b) - getStockScore(a)
  })
  
  // Remove propriedade temporária antes de retornar
  const staticRecipes = suggestions.map(({ _matchedIngredientObjects, ...recipe }) => recipe).slice(0, maxResults)
  
  // Tenta buscar receitas da IA
  try {
    const expiringIngredients = ingredients.filter(ing => {
      if (!ing.expiry_date || isIngredientExpired(ing)) return false
      const parts = ing.expiry_date.split('-')
      const expiryDate = parts.length === 3
        ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
        : new Date(ing.expiry_date)
      expiryDate.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 3
    })
    
    const highStockIngredients = ingredients.filter(ing => 
      !isIngredientExpired(ing) && ing.quantity > ing.min_stock * 2
    )
    
    const aiRecipes = await getAIRecipeSuggestions(ingredients, expiringIngredients, highStockIngredients)
    
    if (aiRecipes.length > 0) {
      // Converte receitas da IA para o formato Recipe
      const aiRecipesFormatted: Recipe[] = aiRecipes.map((aiRecipe, index) => {
        // Tenta fazer match dos ingredientes
        const matchedNames: string[] = []
        const missingIngredients: string[] = []
        
        for (const recipeIng of aiRecipe.ingredients) {
          const normalized = normalizeIngredientName(recipeIng)
          const found = ingredients.find(ing => {
            const ingName = normalizeIngredientName(ing.name)
            return normalized.includes(ingName) || ingName.includes(normalized)
          })
          
          if (found && !isIngredientExpired(found)) {
            matchedNames.push(recipeIng)
          } else {
            missingIngredients.push(recipeIng)
          }
        }
        
        return {
          id: `ai-${index}`,
          name: aiRecipe.name,
          description: aiRecipe.description,
          ingredients: aiRecipe.ingredients,
          instructions: aiRecipe.instructions,
          cookingTime: aiRecipe.cookingTime,
          servings: aiRecipe.servings,
          priority: expiringIngredients.length > 0 ? 'high' : highStockIngredients.length > 0 ? 'medium' : 'low',
          matchedIngredients: matchedNames,
          missingIngredients,
          reason: aiRecipe.reason,
          isAI: true
        }
      })
      
      // Combina receitas da IA (prioridade) com receitas estáticas
      return [...aiRecipesFormatted, ...staticRecipes].slice(0, maxResults)
    }
  } catch (error) {
    console.error('Erro ao buscar receitas da IA, usando receitas estáticas:', error)
  }
  
  return staticRecipes
}

/**
 * Busca receitas que usam ingredientes específicos próximos do vencimento
 * NÃO inclui ingredientes vencidos
 */
export async function getRecipesForExpiringIngredients(
  ingredients: Ingredient[],
  maxResults: number = 3
): Promise<Recipe[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Filtra ingredientes vencendo em até 3 dias (mas não vencidos)
  const expiringIngredients = ingredients.filter(ing => {
    if (!ing.expiry_date) return false
    
    const parts = ing.expiry_date.split('-')
    const expiryDate = parts.length === 3
      ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      : new Date(ing.expiry_date)
    expiryDate.setHours(0, 0, 0, 0)
    
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    // Apenas ingredientes que ainda não venceram e estão próximos do vencimento
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 3
  })
  
  if (expiringIngredients.length === 0) {
    return []
  }
  
  // Busca receitas que usam esses ingredientes
  const suggestions = await getRecipeSuggestions(ingredients, maxResults * 2)
  
  // Filtra apenas receitas que realmente usam ingredientes vencendo
  return suggestions.filter(recipe => {
    return recipe.matchedIngredients.some(recipeIng => {
      return expiringIngredients.some(expIng => {
        const normalizedRecipe = normalizeIngredientName(recipeIng)
        const normalizedExp = normalizeIngredientName(expIng.name)
        return normalizedRecipe.includes(normalizedExp) || normalizedExp.includes(normalizedRecipe)
      })
    })
  }).slice(0, maxResults)
}

/**
 * Retorna lista de ingredientes vencidos que devem ser descartados
 */
export function getExpiredIngredients(ingredients: Ingredient[]): Ingredient[] {
  return ingredients.filter(ing => isIngredientExpired(ing))
}
