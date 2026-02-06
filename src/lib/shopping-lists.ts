import { supabase } from './supabase'
import type { ShoppingList, ShoppingListItem, Ingredient } from './types'

/**
 * Busca todas as listas de compras de um restaurante
 */
export async function getShoppingLists(restaurantId: string): Promise<ShoppingList[]> {
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Erro ao buscar listas de compras: ${error.message}`)
  }

  return data || []
}

/**
 * Busca uma lista de compras por ID com seus itens
 */
export async function getShoppingListById(
  id: string
): Promise<(ShoppingList & { items: ShoppingListItem[] }) | null> {
  const { data: list, error: listError } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('id', id)
    .single()

  if (listError) {
    if (listError.code === 'PGRST116') {
      return null
    }
    throw new Error(`Erro ao buscar lista de compras: ${listError.message}`)
  }

  const { data: items, error: itemsError } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('shopping_list_id', id)
    .order('priority', { ascending: false })
    .order('ingredient_name', { ascending: true })

  if (itemsError) {
    throw new Error(`Erro ao buscar itens da lista: ${itemsError.message}`)
  }

  return {
    ...list,
    items: items || [],
  }
}

/**
 * Cria uma nova lista de compras
 */
export async function createShoppingList(
  restaurantId: string,
  name: string
): Promise<ShoppingList> {
  const { data: list, error } = await supabase
    .from('shopping_lists')
    .insert({
      restaurant_id: restaurantId,
      name,
      status: 'draft',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar lista de compras: ${error.message}`)
  }

  return list
}

/**
 * Atualiza uma lista de compras
 */
export async function updateShoppingList(
  id: string,
  data: Partial<Pick<ShoppingList, 'name' | 'status'>>,
  userId?: string,
  supplierId?: string
): Promise<ShoppingList> {
  const updateData: any = { ...data }
  if (data.status === 'completed') {
    updateData.completed_at = new Date().toISOString()
    
    // Quando concluir a lista, registra as compras como gastos
    if (userId) {
      try {
        const { createFinancialTransaction } = await import('./financial')
        const list = await getShoppingListById(id)
        
        if (list && list.items.length > 0) {
          // Calcula total gasto
          let totalSpent = 0
          const itemsWithPrice = list.items.filter(item => item.price && item.price > 0)
          
          for (const item of itemsWithPrice) {
            totalSpent += item.price || 0
          }
          
          // Registra transação de gasto se houver itens com preço
          if (totalSpent > 0 && list.restaurant_id) {
            // Cria descrição detalhada com itens comprados
            const itemsDescription = itemsWithPrice
              .slice(0, 5) // Limita a 5 itens na descrição
              .map(item => `${item.ingredient_name} (R$ ${(item.price || 0).toFixed(2).replace('.', ',')})`)
              .join(', ')
            
            const description = itemsWithPrice.length > 5
              ? `Lista de compras: ${list.name} - ${itemsDescription} e mais ${itemsWithPrice.length - 5} item(s)`
              : `Lista de compras: ${list.name} - ${itemsDescription}`
            
            await createFinancialTransaction(list.restaurant_id, {
              type: 'expense',
              description,
              amount: totalSpent,
              category: 'shopping_list',
              reference_id: id,
              supplier_id: supplierId,
              userId,
            })
          }
        }
      } catch (error) {
        console.error('Erro ao registrar gastos da lista:', error)
        // Não bloqueia a conclusão da lista se houver erro ao registrar gastos
      }
    }
  }

  const { data: list, error } = await supabase
    .from('shopping_lists')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar lista de compras: ${error.message}`)
  }

  return list
}

/**
 * Deleta uma lista de compras
 */
export async function deleteShoppingList(id: string): Promise<void> {
  const { error } = await supabase.from('shopping_lists').delete().eq('id', id)

  if (error) {
    throw new Error(`Erro ao deletar lista de compras: ${error.message}`)
  }
}

/**
 * Gera lista de compras inteligente baseada no estoque
 */
export async function generateSmartShoppingList(
  restaurantId: string,
  listName: string = 'Lista Automática'
): Promise<ShoppingList & { items: ShoppingListItem[] }> {
  // Busca TODOS os ingredientes (sem paginação)
  const { data: ingredients, error: ingredientsError } = await supabase
    .from('ingredients')
    .select('*')
    .eq('restaurant_id', restaurantId)

  if (ingredientsError) {
    throw new Error(`Erro ao buscar ingredientes: ${ingredientsError.message}`)
  }

  const allIngredients = ingredients || []

  if (allIngredients.length === 0) {
    throw new Error('Nenhum ingrediente cadastrado. Adicione ingredientes ao estoque primeiro.')
  }

  // Cria a lista
  const list = await createShoppingList(restaurantId, listName)

  const itemsToAdd: Array<{
    shopping_list_id: string
    ingredient_id: string | null
    ingredient_name: string
    quantity_needed: number
    unit: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
    category: string | null
  }> = []

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Verifica ingredientes vencidos primeiro (precisam ser substituídos)
  const expiredIngredients: Ingredient[] = []
  const expiringSoonIngredients: Ingredient[] = []
  const lowStockIngredients: Ingredient[] = []
  const normalStockIngredients: Ingredient[] = []

  for (const ing of allIngredients) {
    let isExpired = false
    let isExpiringSoon = false
    let isLowStock = false

    const minStock = ing.min_stock > 0 ? ing.min_stock : 1

    // Verifica se está vencido ou próximo do vencimento
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
          isExpired = true
          expiredIngredients.push(ing)
        } else if (daysDiff >= 0 && daysDiff <= 7) {
          // Próximos 7 dias
          isExpiringSoon = true
          expiringSoonIngredients.push(ing)
        }
      }
    }

    // Verifica estoque baixo (não vencido)
    if (!isExpired && ing.quantity < minStock) {
      isLowStock = true
      lowStockIngredients.push(ing)
    } else if (!isExpired && !isLowStock && ing.quantity >= minStock) {
      // Ingredientes com estoque normal mas podem precisar de reposição preventiva
      normalStockIngredients.push(ing)
    }
  }

  // Adiciona ingredientes vencidos (precisam ser substituídos)
  for (const ing of expiredIngredients) {
    const minStock = ing.min_stock > 0 ? ing.min_stock : 1
    // Para vencidos, adiciona quantidade suficiente para repor (mínimo 1 unidade)
    const needed = Math.max(minStock, 1)

    itemsToAdd.push({
      shopping_list_id: list.id,
      ingredient_id: ing.id,
      ingredient_name: ing.name,
      quantity_needed: needed,
      unit: ing.unit,
      priority: 'urgent',
      category: ing.category,
    })
  }

  // Adiciona ingredientes próximos do vencimento (precisam ser substituídos)
  // Mas só se não estão vencidos e têm estoque baixo
  for (const ing of expiringSoonIngredients) {
    const minStock = ing.min_stock > 0 ? ing.min_stock : 1
    const needed = minStock - ing.quantity
    
    // Só adiciona se realmente precisa de reposição
    if (needed > 0) {
      itemsToAdd.push({
        shopping_list_id: list.id,
        ingredient_id: ing.id,
        ingredient_name: ing.name,
        quantity_needed: needed,
        unit: ing.unit,
        priority: 'high',
        category: ing.category,
      })
    } else {
      // Mesmo com estoque suficiente, se está próximo do vencimento, sugere substituição preventiva
      itemsToAdd.push({
        shopping_list_id: list.id,
        ingredient_id: ing.id,
        ingredient_name: ing.name,
        quantity_needed: minStock, // Quantidade para substituir o que vai vencer
        unit: ing.unit,
        priority: 'high',
        category: ing.category,
      })
    }
  }

  // Adiciona ingredientes com estoque baixo
  for (const ing of lowStockIngredients) {
    const minStock = ing.min_stock > 0 ? ing.min_stock : 1
    const needed = minStock - ing.quantity

    if (needed > 0) {
      // Determina prioridade
      let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'

      // Urgente: estoque zero ou negativo
      if (ing.quantity <= 0) {
        priority = 'urgent'
      }
      // Alta: estoque muito baixo (menos de 50% do mínimo)
      else if (minStock > 0 && ing.quantity < minStock * 0.5) {
        priority = 'high'
      }
      // Normal: precisa repor mas não é urgente
      else {
        priority = 'normal'
      }

      // Verifica se está vencendo (prioridade alta)
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

          if (daysDiff >= 0 && daysDiff <= 3) {
            priority = 'high'
          }
        }
      }

      itemsToAdd.push({
        shopping_list_id: list.id,
        ingredient_id: ing.id,
        ingredient_name: ing.name,
        quantity_needed: needed,
        unit: ing.unit,
        priority: 'urgent', // Estoque baixo é urgente
        category: ing.category,
      })
    }
  }

  // Adiciona ingredientes que precisam de reposição (mas não estão críticos)
  for (const ing of normalStockIngredients) {
    const minStock = ing.min_stock > 0 ? ing.min_stock : 1
    const needed = minStock - ing.quantity

    if (needed > 0) {
      let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'

      // Urgente: estoque zero ou negativo
      if (ing.quantity <= 0) {
        priority = 'urgent'
      }
      // Alta: estoque muito baixo (menos de 50% do mínimo)
      else if (minStock > 0 && ing.quantity < minStock * 0.5) {
        priority = 'high'
      }

      // Verifica se está vencendo (prioridade alta)
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

          if (daysDiff >= 0 && daysDiff <= 3) {
            priority = 'high'
          }
        }
      }

      itemsToAdd.push({
        shopping_list_id: list.id,
        ingredient_id: ing.id,
        ingredient_name: ing.name,
        quantity_needed: needed,
        unit: ing.unit,
        priority,
        category: ing.category,
      })
    }
  }

  // Adiciona os itens
  if (itemsToAdd.length > 0) {
    const { error } = await supabase.from('shopping_list_items').insert(itemsToAdd)

    if (error) {
      // Se der erro, deleta a lista criada
      await deleteShoppingList(list.id)
      throw new Error(`Erro ao adicionar itens: ${error.message}`)
    }
  } else {
    // Se não há itens para adicionar, informa o usuário mas mantém a lista vazia
    console.log('Nenhum ingrediente precisa de reposição no momento. Todos os estoques estão acima do mínimo.')
  }

  // Busca a lista completa
  const fullList = await getShoppingListById(list.id)
  if (!fullList) {
    throw new Error('Erro ao buscar lista criada')
  }

  return fullList
}

/**
 * Adiciona item à lista de compras
 */
export async function addShoppingListItem(
  shoppingListId: string,
  data: {
    ingredient_id?: string
    ingredient_name: string
    quantity_needed: number
    unit: ShoppingListItem['unit']
    priority?: ShoppingListItem['priority']
    supplier_id?: string
    category?: string
    notes?: string
    price?: number | null
  }
): Promise<ShoppingListItem> {
  const { data: item, error } = await supabase
    .from('shopping_list_items')
    .insert({
      shopping_list_id: shoppingListId,
      ...data,
      priority: data.priority || 'normal',
      price: data.price || null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao adicionar item: ${error.message}`)
  }

  return item
}

/**
 * Atualiza item da lista de compras
 */
export async function updateShoppingListItem(
  id: string,
  data: Partial<Omit<ShoppingListItem, 'id' | 'shopping_list_id' | 'created_at'>>
): Promise<ShoppingListItem> {
  const updateData: any = { ...data }
  if (data.is_purchased && !data.purchased_at) {
    updateData.purchased_at = new Date().toISOString()
  }

  const { data: item, error } = await supabase
    .from('shopping_list_items')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar item: ${error.message}`)
  }

  return item
}

/**
 * Remove item da lista de compras
 */
export async function deleteShoppingListItem(id: string): Promise<void> {
  const { error } = await supabase.from('shopping_list_items').delete().eq('id', id)

  if (error) {
    throw new Error(`Erro ao remover item: ${error.message}`)
  }
}
