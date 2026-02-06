import { supabase } from './supabase'
import type { Recipe, RecipeIngredient, RecipeSale, Ingredient } from './types'

/**
 * Busca todas as receitas de um restaurante
 */
export async function getRecipes(restaurantId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar receitas: ${error.message}`)
  }

  return data || []
}

/**
 * Busca uma receita por ID com seus ingredientes
 */
export async function getRecipeById(id: string): Promise<(Recipe & { ingredients: RecipeIngredient[] }) | null> {
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  if (recipeError) {
    if (recipeError.code === 'PGRST116') {
      return null
    }
    throw new Error(`Erro ao buscar receita: ${recipeError.message}`)
  }

  const { data: ingredients, error: ingredientsError } = await supabase
    .from('recipe_ingredients')
    .select('*')
    .eq('recipe_id', id)
    .order('ingredient_name', { ascending: true })

  if (ingredientsError) {
    throw new Error(`Erro ao buscar ingredientes da receita: ${ingredientsError.message}`)
  }

  return {
    ...recipe,
    ingredients: ingredients || [],
  }
}

/**
 * Cria uma nova receita
 */
export async function createRecipe(
  restaurantId: string,
  data: {
    name: string
    description?: string
    servings?: number
    preparation_time?: number
    cost_per_serving?: number
    ingredients: Array<{
      ingredient_id?: string
      ingredient_name: string
      quantity: number
      unit: RecipeIngredient['unit']
    }>
  }
): Promise<Recipe & { ingredients: RecipeIngredient[] }> {
  console.log('Criando receita:', { restaurantId, data })
  
  // Validação básica
  if (!data.name || data.name.trim() === '') {
    throw new Error('O nome da receita é obrigatório')
  }

  if (!data.ingredients || data.ingredients.length === 0) {
    throw new Error('A receita deve ter pelo menos um ingrediente')
  }

  // Cria a receita
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      restaurant_id: restaurantId,
      name: data.name.trim(),
      description: data.description || null,
      servings: data.servings || 1,
      preparation_time: data.preparation_time || null,
      cost_per_serving: data.cost_per_serving || null,
    })
    .select()
    .single()

  if (recipeError) {
    console.error('Erro ao criar receita:', recipeError)
    
    // Trata erro de receita duplicada
    if (recipeError.code === '23505') {
      throw new Error(`Já existe uma receita com o nome "${data.name}" cadastrada.`)
    }
    
    throw new Error(`Erro ao criar receita: ${recipeError.message} (código: ${recipeError.code})`)
  }

  if (!recipe) {
    throw new Error('Receita criada mas não retornada pelo banco de dados')
  }

  console.log('Receita criada:', recipe)

  // Adiciona os ingredientes
  if (data.ingredients.length > 0) {
    const ingredientsToInsert = data.ingredients.map(ing => ({
      recipe_id: recipe.id,
      ingredient_id: ing.ingredient_id || null,
      ingredient_name: ing.ingredient_name.trim(),
      quantity: ing.quantity,
      unit: ing.unit,
    }))

    console.log('Inserindo ingredientes:', ingredientsToInsert)

    const { error: ingredientsError } = await supabase
      .from('recipe_ingredients')
      .insert(ingredientsToInsert)

    if (ingredientsError) {
      console.error('Erro ao inserir ingredientes:', ingredientsError)
      // Se der erro ao inserir ingredientes, tenta deletar a receita criada
      await supabase.from('recipes').delete().eq('id', recipe.id)
      throw new Error(`Erro ao adicionar ingredientes: ${ingredientsError.message} (código: ${ingredientsError.code})`)
    }
  }

  // Busca a receita completa
  const fullRecipe = await getRecipeById(recipe.id)
  if (!fullRecipe) {
    throw new Error('Erro ao buscar receita criada')
  }

  console.log('Receita completa retornada:', fullRecipe)
  return fullRecipe
}

/**
 * Atualiza uma receita
 */
export async function updateRecipe(
  id: string,
  data: {
    name?: string
    description?: string
    servings?: number
    preparation_time?: number
    cost_per_serving?: number
    ingredients?: Array<{
      ingredient_id?: string
      ingredient_name: string
      quantity: number
      unit: RecipeIngredient['unit']
    }>
  }
): Promise<Recipe & { ingredients: RecipeIngredient[] }> {
  // Atualiza a receita
  const updateData: any = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.servings !== undefined) updateData.servings = data.servings
  if (data.preparation_time !== undefined) updateData.preparation_time = data.preparation_time
  if (data.cost_per_serving !== undefined) updateData.cost_per_serving = data.cost_per_serving

  if (Object.keys(updateData).length > 0) {
    const { error: recipeError } = await supabase
      .from('recipes')
      .update(updateData)
      .eq('id', id)

    if (recipeError) {
      throw new Error(`Erro ao atualizar receita: ${recipeError.message}`)
    }
  }

  // Se forneceu novos ingredientes, substitui todos
  if (data.ingredients !== undefined) {
    // Remove ingredientes antigos
    const { error: deleteError } = await supabase
      .from('recipe_ingredients')
      .delete()
      .eq('recipe_id', id)

    if (deleteError) {
      throw new Error(`Erro ao remover ingredientes antigos: ${deleteError.message}`)
    }

    // Adiciona novos ingredientes
    if (data.ingredients.length > 0) {
      const { error: insertError } = await supabase.from('recipe_ingredients').insert(
        data.ingredients.map(ing => ({
          recipe_id: id,
          ingredient_id: ing.ingredient_id || null,
          ingredient_name: ing.ingredient_name,
          quantity: ing.quantity,
          unit: ing.unit,
        }))
      )

      if (insertError) {
        throw new Error(`Erro ao adicionar ingredientes: ${insertError.message}`)
      }
    }
  }

  // Busca a receita atualizada
  const updatedRecipe = await getRecipeById(id)
  if (!updatedRecipe) {
    throw new Error('Erro ao buscar receita atualizada')
  }

  return updatedRecipe
}

/**
 * Deleta uma receita
 */
export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id)

  if (error) {
    throw new Error(`Erro ao deletar receita: ${error.message}`)
  }
}

/**
 * Registra venda de um prato (baixa automática de estoque)
 */
export async function sellRecipe(
  recipeId: string,
  restaurantId: string,
  quantity: number = 1,
  price?: number,
  userId?: string
): Promise<RecipeSale> {
  // Obtém o user_id atual se não foi fornecido
  let currentUserId = userId
  if (!currentUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Usuário não autenticado')
    }
    currentUserId = user.id
  }

  const insertData: any = {
    recipe_id: recipeId,
    restaurant_id: restaurantId,
    quantity,
    user_id: currentUserId,
  }

  // Adiciona preço se fornecido
  if (price !== undefined && price !== null) {
    insertData.price = price
  }

  const { data: sale, error } = await supabase
    .from('recipe_sales')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao registrar venda: ${error.message}`)
  }

  // Registra transação financeira de receita (sempre que houver preço)
  if (price !== undefined && price !== null && price > 0 && currentUserId) {
    try {
      const { createFinancialTransaction } = await import('./financial')
      const recipe = await getRecipeById(recipeId)
      const totalAmount = price * quantity
      await createFinancialTransaction(restaurantId, {
        type: 'revenue',
        description: `Venda: ${recipe?.name || 'Receita'} (x${quantity})`,
        amount: totalAmount,
        category: 'recipe_sale',
        reference_id: sale.id,
        userId: currentUserId,
        transaction_date: sale.sold_at,
      })
    } catch (error) {
      console.error('Erro ao registrar transação financeira:', error)
      // Não bloqueia a venda se houver erro ao registrar transação
    }
  }

  return sale
}

/**
 * Calcula o custo de uma receita baseado nos preços dos fornecedores
 */
export async function calculateRecipeCost(
  recipeId: string,
  restaurantId: string
): Promise<number | null> {
  const recipe = await getRecipeById(recipeId)
  if (!recipe) return null

  let totalCost = 0
  let hasPrice = false

  for (const recipeIng of recipe.ingredients) {
    // Tenta encontrar o ingrediente cadastrado
    let ingredient: Ingredient | null = null
    if (recipeIng.ingredient_id) {
      const { data } = await supabase
        .from('ingredients')
        .select('*')
        .eq('id', recipeIng.ingredient_id)
        .single()
      ingredient = data
    } else {
      // Busca por nome
      const { data } = await supabase
        .from('ingredients')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .ilike('name', recipeIng.ingredient_name)
        .limit(1)
        .single()
      ingredient = data || null
    }

    // Busca preço do fornecedor
    if (ingredient) {
      const { data: supplierProduct } = await supabase
        .from('supplier_products')
        .select('price')
        .ilike('ingredient_name', ingredient.name)
        .not('price', 'is', null)
        .limit(1)
        .single()

      if (supplierProduct?.price) {
        totalCost += supplierProduct.price * recipeIng.quantity
        hasPrice = true
      }
    }
  }

  return hasPrice ? totalCost : null
}

/**
 * Busca receitas que podem ser feitas com ingredientes disponíveis
 */
export async function getAvailableRecipes(
  restaurantId: string,
  ingredients: Ingredient[]
): Promise<Array<Recipe & { ingredients: RecipeIngredient[]; canMake: boolean; missingIngredients: string[] }>> {
  const recipes = await getRecipes(restaurantId)
  const availableRecipes: Array<Recipe & { ingredients: RecipeIngredient[]; canMake: boolean; missingIngredients: string[] }> = []

  for (const recipe of recipes) {
    const fullRecipe = await getRecipeById(recipe.id)
    if (!fullRecipe) continue

    const missingIngredients: string[] = []
    let canMake = true

    for (const recipeIng of fullRecipe.ingredients) {
      // Tenta encontrar o ingrediente
      let found = false
      if (recipeIng.ingredient_id) {
        found = ingredients.some(ing => ing.id === recipeIng.ingredient_id)
      } else {
        const normalizedName = recipeIng.ingredient_name.toLowerCase().trim()
        found = ingredients.some(ing => {
          const ingName = ing.name.toLowerCase().trim()
          return ingName.includes(normalizedName) || normalizedName.includes(ingName)
        })
      }

      if (!found) {
        canMake = false
        missingIngredients.push(recipeIng.ingredient_name)
      }
    }

    availableRecipes.push({
      ...fullRecipe,
      canMake,
      missingIngredients,
    })
  }

  return availableRecipes
}

/**
 * Retorna lista de ingredientes vencidos que devem ser descartados
 */
export function getExpiredIngredients(ingredients: Ingredient[]): Ingredient[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return ingredients.filter(ing => {
    if (!ing.expiry_date) return false

    const parts = ing.expiry_date.split('-')
    if (parts.length !== 3) return false

    const expiryDate = new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2])
    )
    expiryDate.setHours(0, 0, 0, 0)

    return expiryDate < today
  })
}

/**
 * Tipo para receitas de sugestão (diferente das receitas cadastradas)
 * Exportado como Recipe para compatibilidade com RecipeSuggestionsDialog
 */
export type RecipeTag = 'expiring_soon' | 'high_stock' | 'ok'

export interface RecipeSuggestion {
  id: string
  name: string
  description: string
  ingredients: string[]
  instructions: string[]
  cookingTime: number
  servings: number
  priority: 'high' | 'medium' | 'low'
  matchedIngredients: string[]
  missingIngredients: string[]
  reason?: string
  isAI?: boolean
  tags: RecipeTag[]
}

/**
 * Busca sugestões de receitas baseadas nos ingredientes disponíveis
 * Usa receitas estáticas e pode usar IA se configurada
 */
export async function getRecipeSuggestions(
  ingredients: Ingredient[],
  maxResults: number = 5
): Promise<RecipeSuggestion[]> {
  // Importa função de IA dinamicamente para evitar erros se não estiver configurada
  try {
    const { getAIRecipeSuggestions } = await import('./ai')
    const { quickValidateIngredientName } = await import('./ingredient-validation')
    
    // Filtra ingredientes vencidos E ingredientes inválidos (não comestíveis)
    const validIngredients = ingredients.filter(ing => {
      // Verifica se não está vencido
      if (ing.expiry_date) {
        const parts = ing.expiry_date.split('-')
        if (parts.length === 3) {
          const expiryDate = new Date(
            parseInt(parts[0]),
            parseInt(parts[1]) - 1,
            parseInt(parts[2])
          )
          expiryDate.setHours(0, 0, 0, 0)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (expiryDate < today) {
            return false // Vencido
          }
        }
      }
      
      // Verifica se é um ingrediente válido (comestível)
      const validation = quickValidateIngredientName(ing.name)
      return validation.isValid
    })

    // Identifica ingredientes vencendo e com alto estoque
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiringIngredients = validIngredients.filter(ing => {
      if (!ing.expiry_date) return false
      const parts = ing.expiry_date.split('-')
      if (parts.length !== 3) return false
      const expiryDate = new Date(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2])
      )
      expiryDate.setHours(0, 0, 0, 0)
      const daysDiff = Math.floor(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysDiff >= 0 && daysDiff <= 3
    })

    const highStockIngredients = validIngredients.filter(
      ing => ing.quantity > ing.min_stock * 2
    )

    // Tenta buscar receitas da IA
    const aiRecipes = await getAIRecipeSuggestions(
      validIngredients,
      expiringIngredients,
      highStockIngredients
    )

    // Converte receitas da IA para o formato RecipeSuggestion
    const aiSuggestions: RecipeSuggestion[] = aiRecipes.map((aiRecipe, index) => {
      const matchedNames: string[] = []
      const missingIngredients: string[] = []

      for (const recipeIng of aiRecipe.ingredients) {
        const normalized = recipeIng.toLowerCase().trim()
        const found = validIngredients.some(ing => {
          const ingName = ing.name.toLowerCase().trim()
          return normalized.includes(ingName) || ingName.includes(normalized)
        })

        if (found) {
          matchedNames.push(recipeIng)
        } else {
          missingIngredients.push(recipeIng)
        }
      }

      const tags: RecipeTag[] = []
      if (expiringIngredients.length > 0) tags.push('expiring_soon')
      if (highStockIngredients.length > 0) tags.push('high_stock')
      if (tags.length === 0) tags.push('ok')

      return {
        id: `ai-${index}`,
        name: aiRecipe.name,
        description: aiRecipe.description,
        ingredients: aiRecipe.ingredients,
        instructions: aiRecipe.instructions,
        cookingTime: aiRecipe.cookingTime,
        servings: aiRecipe.servings,
        priority: expiringIngredients.length > 0 ? 'high' : 'medium',
        matchedIngredients: matchedNames,
        missingIngredients,
        reason: aiRecipe.reason,
        isAI: true,
        tags,
      }
    })

    return aiSuggestions.slice(0, maxResults)
  } catch (error) {
    console.error('Erro ao buscar sugestões de receitas:', error)
    // Retorna array vazio em caso de erro
    return []
  }
}

// Exporta RecipeSuggestion para uso em sugestões
export type { RecipeSuggestion }
