import * as React from 'react'
import { useAuth } from './AuthProvider'
import { getUserPreferences, applyTheme, applyPrimaryColor } from '@/lib/preferences'
import type { UserPreferences } from '@/lib/types'

type ThemeContextValue = {
  preferences: UserPreferences | null
  loading: boolean
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [preferences, setPreferences] = React.useState<UserPreferences | null>(null)
  const [loading, setLoading] = React.useState(true)

  // Carrega preferências ao montar
  React.useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function loadPreferences() {
      try {
        const prefs = await getUserPreferences(user.id)
        setPreferences(prefs)

        if (prefs) {
          // Aplica tema imediatamente
          setTimeout(() => {
            applyTheme(prefs.theme)
            applyPrimaryColor(prefs.primary_color)
          }, 0)
        }
      } catch (error) {
        console.error('Erro ao carregar preferências:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [user])

  // Aplica tema quando preferências mudam
  React.useEffect(() => {
    if (preferences) {
      // Usa requestAnimationFrame para garantir que seja aplicado após renderização
      requestAnimationFrame(() => {
        applyTheme(preferences.theme)
        applyPrimaryColor(preferences.primary_color)
        
        // Salva no localStorage para uso futuro
        try {
          localStorage.setItem('theme-preference', preferences.theme)
        } catch (e) {
          // Ignora erros de localStorage
        }
      })
    }
  }, [preferences])

  // Atualiza preferências
  const updatePreferences = React.useCallback(
    async (newPrefs: Partial<UserPreferences>) => {
      if (!user) return

      try {
        const { updateUserPreferences } = await import('@/lib/preferences')
        const updated = await updateUserPreferences(user.id, newPrefs)
        setPreferences(updated)

        if (newPrefs.theme !== undefined) {
          applyTheme(newPrefs.theme)
        }
        if (newPrefs.primary_color !== undefined) {
          applyPrimaryColor(newPrefs.primary_color)
        }
      } catch (error) {
        console.error('Erro ao atualizar preferências:', error)
        throw error
      }
    },
    [user]
  )

  const value = React.useMemo(
    () => ({
      preferences,
      loading,
      updatePreferences,
    }),
    [preferences, loading, updatePreferences]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
