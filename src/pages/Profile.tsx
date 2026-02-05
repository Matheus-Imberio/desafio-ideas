import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/PasswordInput'
import { useToast } from '@/components/ui/use-toast'
import { getOrCreateRestaurant, updateRestaurant } from '@/lib/restaurant'
import type { Restaurant } from '@/lib/types'

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
  const [restaurantName, setRestaurantName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [loadingData, setLoadingData] = React.useState(true)

  // Carrega dados do usuário e restaurante
  React.useEffect(() => {
    async function loadData() {
      if (!user) return

      try {
        setLoadingData(true)
        setEmail(user.email || '')

        // Carrega restaurante
        const restaurantData = await getOrCreateRestaurant(user.id)
        setRestaurant(restaurantData)
        setRestaurantName(restaurantData.name)
      } catch (error) {
        toast({
          title: 'Erro',
          description:
            error instanceof Error ? error.message : 'Erro ao carregar dados',
          variant: 'destructive',
        })
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [user, toast])

  const handleUpdateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!restaurant || !restaurantName.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome do restaurante é obrigatório',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      const updated = await updateRestaurant(restaurant.id, restaurantName)
      setRestaurant(updated)
      toast({
        title: 'Sucesso',
        description: 'Nome do restaurante atualizado com sucesso',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Erro ao atualizar restaurante',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 8 caracteres',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) {
        throw error
      }

      toast({
        title: 'Sucesso',
        description: 'Senha atualizada com sucesso',
      })
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Erro ao atualizar senha',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-8 text-muted-foreground">
              Carregando...
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Meu Perfil</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie suas informações pessoais e do restaurante
              </p>
            </div>
          </div>

          {/* Dados do Restaurante */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Restaurante</CardTitle>
              <CardDescription>
                Atualize o nome do seu restaurante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateRestaurant} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="restaurantName">Nome do Restaurante</Label>
                  <Input
                    id="restaurantName"
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Nome do restaurante"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Dados da Conta */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Conta</CardTitle>
              <CardDescription>
                Informações da sua conta de acesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O e-mail não pode ser alterado
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Alterar Senha */}
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>
                Defina uma nova senha para sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <PasswordInput
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <PasswordInput
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Atualizando...' : 'Atualizar Senha'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
