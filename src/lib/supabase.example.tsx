/**
 * Exemplos de uso do Supabase
 * 
 * Importe o cliente assim:
 * import { supabase } from '@/lib/supabase'
 */

// Exemplo 1: Buscar dados de uma tabela
export async function fetchIdeas() {
  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Erro ao buscar ideias:', error)
    return null
  }
  
  return data
}

// Exemplo 2: Inserir dados
export async function createIdea(idea: { title: string; description: string }) {
  const { data, error } = await supabase
    .from('ideas')
    .insert([idea])
    .select()
  
  if (error) {
    console.error('Erro ao criar ideia:', error)
    return null
  }
  
  return data?.[0]
}

// Exemplo 3: Atualizar dados
export async function updateIdea(id: string, updates: Partial<{ title: string; description: string }>) {
  const { data, error } = await supabase
    .from('ideas')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) {
    console.error('Erro ao atualizar ideia:', error)
    return null
  }
  
  return data?.[0]
}

// Exemplo 4: Deletar dados
export async function deleteIdea(id: string) {
  const { error } = await supabase
    .from('ideas')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('Erro ao deletar ideia:', error)
    return false
  }
  
  return true
}

// Exemplo 5: Autenticação - Login
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    console.error('Erro ao fazer login:', error)
    return null
  }
  
  return data
}

// Exemplo 6: Autenticação - Cadastro
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) {
    console.error('Erro ao cadastrar:', error)
    return null
  }
  
  return data
}

// Exemplo 7: Autenticação - Logout
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Erro ao fazer logout:', error)
    return false
  }
  
  return true
}

// Exemplo 8: Escutar mudanças em tempo real
export function subscribeToIdeas(callback: (idea: any) => void) {
  return supabase
    .channel('ideas-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'ideas' }, 
      callback
    )
    .subscribe()
}
