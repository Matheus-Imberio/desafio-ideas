import { supabase } from './supabase'
import type { Supplier, SupplierProduct } from './types'

/**
 * Busca todos os fornecedores de um restaurante
 */
export async function getSuppliers(restaurantId: string): Promise<Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .order('name', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar fornecedores: ${error.message}`)
  }

  return data || []
}

/**
 * Busca um fornecedor por ID
 */
export async function getSupplierById(id: string): Promise<Supplier | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Erro ao buscar fornecedor: ${error.message}`)
  }

  return data
}

/**
 * Cria um novo fornecedor
 */
export async function createSupplier(
  restaurantId: string,
  data: {
    name: string
    contact_name?: string
    email?: string
    phone?: string
    address?: string
    notes?: string
  }
): Promise<Supplier> {
  const { data: supplier, error } = await supabase
    .from('suppliers')
    .insert({
      restaurant_id: restaurantId,
      ...data,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar fornecedor: ${error.message}`)
  }

  return supplier
}

/**
 * Atualiza um fornecedor
 */
export async function updateSupplier(
  id: string,
  data: Partial<Omit<Supplier, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>>
): Promise<Supplier> {
  const { data: supplier, error } = await supabase
    .from('suppliers')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar fornecedor: ${error.message}`)
  }

  return supplier
}

/**
 * Deleta um fornecedor
 */
export async function deleteSupplier(id: string): Promise<void> {
  const { error } = await supabase.from('suppliers').delete().eq('id', id)

  if (error) {
    throw new Error(`Erro ao deletar fornecedor: ${error.message}`)
  }
}

/**
 * Busca produtos de um fornecedor
 */
export async function getSupplierProducts(supplierId: string): Promise<SupplierProduct[]> {
  const { data, error } = await supabase
    .from('supplier_products')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('ingredient_name', { ascending: true })

  if (error) {
    throw new Error(`Erro ao buscar produtos do fornecedor: ${error.message}`)
  }

  return data || []
}

/**
 * Adiciona um produto a um fornecedor
 */
export async function addSupplierProduct(
  supplierId: string,
  data: {
    ingredient_name: string
    unit: SupplierProduct['unit']
    price?: number
    delivery_days?: number
  }
): Promise<SupplierProduct> {
  const { data: product, error } = await supabase
    .from('supplier_products')
    .insert({
      supplier_id: supplierId,
      ...data,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao adicionar produto: ${error.message}`)
  }

  return product
}

/**
 * Atualiza um produto de fornecedor
 */
export async function updateSupplierProduct(
  id: string,
  data: Partial<Omit<SupplierProduct, 'id' | 'supplier_id' | 'created_at' | 'updated_at'>>
): Promise<SupplierProduct> {
  const { data: product, error } = await supabase
    .from('supplier_products')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar produto: ${error.message}`)
  }

  return product
}

/**
 * Remove um produto de fornecedor
 */
export async function deleteSupplierProduct(id: string): Promise<void> {
  const { error } = await supabase.from('supplier_products').delete().eq('id', id)

  if (error) {
    throw new Error(`Erro ao remover produto: ${error.message}`)
  }
}
