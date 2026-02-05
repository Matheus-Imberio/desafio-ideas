import { supabase } from './supabase'
import type { Restaurant } from './types'

/**
 * Obtém ou cria o restaurante padrão do usuário
 */
export async function getOrCreateRestaurant(userId: string): Promise<Restaurant> {
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
  const { data: newRestaurant, error: createError } = await supabase
    .from('restaurants')
    .insert({
      name: 'Meu Restaurante',
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
