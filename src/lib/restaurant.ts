import { supabase } from './supabase'
import type { Restaurant } from './types'

/**
 * Obtém ou cria o restaurante padrão do usuário
 */
export async function getOrCreateRestaurant(
  userId: string,
  restaurantName?: string
): Promise<Restaurant> {
  // Tenta buscar restaurante existente (pega o primeiro se houver múltiplos)
  const { data: existing, error: fetchError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`Erro ao buscar restaurante: ${fetchError.message}`)
  }

  // Se já existe, retorna o primeiro
  if (existing) {
    return existing
  }

  // Se não existe, cria um novo
  const name = restaurantName?.trim() || 'Meu Restaurante'
  const { data: newRestaurant, error: createError } = await supabase
    .from('restaurants')
    .insert({
      name,
      owner_id: userId,
    })
    .select()
    .single()

  if (createError) {
    throw new Error(`Erro ao criar restaurante: ${createError.message}`)
  }

  if (!newRestaurant) {
    throw new Error('Erro ao criar restaurante: nenhum dado retornado')
  }

  return newRestaurant
}

/**
 * Atualiza o nome do restaurante
 */
export async function updateRestaurant(
  restaurantId: string,
  name: string
): Promise<Restaurant> {
  const { data, error } = await supabase
    .from('restaurants')
    .update({ name: name.trim() })
    .eq('id', restaurantId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar restaurante: ${error.message}`)
  }

  if (!data) {
    throw new Error('Erro ao atualizar restaurante: nenhum dado retornado')
  }

  return data
}
