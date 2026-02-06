import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Palette, Moon, Sun, Monitor } from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { useTheme } from '@/components/ThemeProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

const COLORS = [
  { value: 'orange', label: 'Laranja', color: '#f97316' },
  { value: 'blue', label: 'Azul', color: '#3b82f6' },
  { value: 'green', label: 'Verde', color: '#22c55e' },
  { value: 'purple', label: 'Roxo', color: '#a855f7' },
  { value: 'red', label: 'Vermelho', color: '#ef4444' },
  { value: 'pink', label: 'Rosa', color: '#ec4899' },
]

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { preferences, updatePreferences, loading } = useTheme()
  const { toast } = useToast()

  const handleThemeChange = async (theme: 'light' | 'dark' | 'auto') => {
    try {
      // Aplica tema imediatamente antes de salvar
      const { applyTheme } = await import('@/lib/preferences')
      
      // Aplica imediatamente
      applyTheme(theme)
      
      // Salva no localStorage também para persistência
      try {
        localStorage.setItem('theme-preference', theme)
      } catch (e) {
        // Ignora erros
      }
      
      // Salva no banco
      await updatePreferences({ theme })
      
      toast({
        title: 'Sucesso',
        description: 'Tema atualizado',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar tema',
        variant: 'destructive',
      })
    }
  }

  const handleColorChange = async (color: string) => {
    try {
      await updatePreferences({ primary_color: color })
      toast({
        title: 'Sucesso',
        description: 'Cor atualizada',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar cor',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl hover:bg-orange-50"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-icon shadow-lg">
                <Palette className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-primary-text">
                  Configurações
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Personalize sua experiência</p>
              </div>
            </div>
          </div>

          {/* Tema */}
          <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-orange-600" />
                Tema
              </CardTitle>
              <CardDescription>Escolha entre tema claro, escuro ou automático</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label htmlFor="theme" className="text-sm font-semibold">
                  Modo de Tema
                </Label>
                <Select
                  value={preferences?.theme || 'light'}
                  onValueChange={(value: 'light' | 'dark' | 'auto') => handleThemeChange(value)}
                >
                  <SelectTrigger id="theme" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Claro
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Escuro
                      </div>
                    </SelectItem>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Automático
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Cor Primária */}
          <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary-dynamic" />
                Cor Primária
              </CardTitle>
              <CardDescription>Escolha a cor principal da interface</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Cor</Label>
                <div className="grid grid-cols-3 gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => handleColorChange(color.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        preferences?.primary_color === color.value
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                      style={{
                        backgroundColor: color.color + '20',
                        borderColor:
                          preferences?.primary_color === color.value ? color.color : undefined,
                      }}
                    >
                      <div
                        className="w-full h-8 rounded"
                        style={{ backgroundColor: color.color }}
                      />
                      <p className="text-xs mt-2 font-medium">{color.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
