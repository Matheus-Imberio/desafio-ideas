import { supabase } from './supabase'
import type { UserPreferences } from './types'

/**
 * Busca preferências do usuário
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Cria preferências padrão se não existir
      return await createDefaultPreferences(userId)
    }
    throw new Error(`Erro ao buscar preferências: ${error.message}`)
  }

  return data
}

/**
 * Cria preferências padrão
 */
async function createDefaultPreferences(userId: string): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .insert({
      user_id: userId,
      theme: 'light',
      primary_color: 'orange',
      layout: 'default',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao criar preferências: ${error.message}`)
  }

  return data
}

/**
 * Atualiza preferências do usuário
 */
export async function updateUserPreferences(
  userId: string,
  data: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserPreferences> {
  // Verifica se existe
  const existing = await getUserPreferences(userId)

  if (!existing) {
    // Cria se não existir
    const { data: newPrefs, error: createError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        theme: data.theme || 'light',
        primary_color: data.primary_color || 'orange',
        layout: data.layout || 'default',
      })
      .select()
      .single()

    if (createError) {
      throw new Error(`Erro ao criar preferências: ${createError.message}`)
    }

    return newPrefs
  }

  // Atualiza se existir
  const { data: updated, error } = await supabase
    .from('user_preferences')
    .update(data)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(`Erro ao atualizar preferências: ${error.message}`)
  }

  return updated
}

// Variável global para armazenar o listener do tema automático
let autoThemeListener: ((e: MediaQueryListEvent) => void) | null = null

/**
 * Aplica tema no documento
 */
export function applyTheme(theme: 'light' | 'dark' | 'auto'): void {
  const root = document.documentElement
  const body = document.body

  // Remove listener anterior se existir
  if (autoThemeListener) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.removeEventListener('change', autoThemeListener)
    autoThemeListener = null
  }

  // Remove classe dark primeiro
  root.classList.remove('dark')
  body.classList.remove('dark')

  if (theme === 'auto') {
    // Detecta preferência do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const prefersDark = mediaQuery.matches
    
    if (prefersDark) {
      root.classList.add('dark')
      body.classList.add('dark')
    }
    
    // Listener para mudanças na preferência do sistema
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        root.classList.add('dark')
        body.classList.add('dark')
      } else {
        root.classList.remove('dark')
        body.classList.remove('dark')
      }
    }
    
    autoThemeListener = handleChange
    mediaQuery.addEventListener('change', handleChange)
  } else {
    if (theme === 'dark') {
      root.classList.add('dark')
      body.classList.add('dark')
    } else {
      // Tema claro - garante que não tem classe dark
      root.classList.remove('dark')
      body.classList.remove('dark')
    }
  }
  
  // Força reflow para garantir que as mudanças sejam aplicadas
  void root.offsetHeight
}

/**
 * Aplica cor primária personalizada
 */
export function applyPrimaryColor(color: string): void {
  const root = document.documentElement

  // Mapeia cores para variáveis CSS (HSL sem a função hsl())
  const colorMap: Record<string, { primary: string; primaryHover: string; ring: string; accent: string }> = {
    orange: {
      primary: '24 95% 53%',
      primaryHover: '24 95% 60%',
      ring: '24 95% 53%',
      accent: '24 95% 95%',
    },
    blue: {
      primary: '217 91% 60%',
      primaryHover: '217 91% 70%',
      ring: '217 91% 60%',
      accent: '217 91% 95%',
    },
    green: {
      primary: '142 76% 36%',
      primaryHover: '142 76% 46%',
      ring: '142 76% 36%',
      accent: '142 76% 95%',
    },
    purple: {
      primary: '262 83% 58%',
      primaryHover: '262 83% 68%',
      ring: '262 83% 58%',
      accent: '262 83% 95%',
    },
    red: {
      primary: '0 84% 60%',
      primaryHover: '0 84% 70%',
      ring: '0 84% 60%',
      accent: '0 84% 95%',
    },
    pink: {
      primary: '330 81% 60%',
      primaryHover: '330 81% 70%',
      ring: '330 81% 60%',
      accent: '330 81% 95%',
    },
  }

  const colors = colorMap[color] || colorMap.orange

  // Atualiza todas as variáveis CSS relacionadas à cor primária
  root.style.setProperty('--primary', colors.primary)
  root.style.setProperty('--primary-foreground', '0 0% 100%')
  root.style.setProperty('--ring', colors.ring)
  root.style.setProperty('--accent', colors.accent)
  
  // Adiciona variáveis customizadas para gradientes
  root.style.setProperty('--primary-gradient-from', colors.primary)
  root.style.setProperty('--primary-gradient-to', colors.primaryHover)
}
