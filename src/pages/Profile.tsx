import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Building2, Mail, Lock, User } from 'lucide-react'

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
      <div className="min-h-screen">
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
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Meu Perfil
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Gerencie suas informações pessoais e do restaurante
                </p>
              </div>
            </div>
          </div>

          {/* Dados do Restaurante */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-orange-600" />
                Dados do Restaurante
              </CardTitle>
              <CardDescription>
                Atualize o nome do seu restaurante
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateRestaurant} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="restaurantName" className="text-sm font-semibold">
                    Nome do Restaurante
                  </Label>
                  <Input
                    id="restaurantName"
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="Nome do restaurante"
                    className="h-12"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="shadow-lg"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Dados da Conta */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-orange-600" />
                Dados da Conta
              </CardTitle>
              <CardDescription>
                Informações da sua conta de acesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4 text-orange-600" />
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="h-12 bg-orange-50 border-orange-200"
                />
                <p className="text-xs text-muted-foreground">
                  O e-mail não pode ser alterado
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Alterar Senha */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-orange-600" />
                Alterar Senha
              </CardTitle>
              <CardDescription>
                Defina uma nova senha para sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="newPassword" className="text-sm font-semibold flex items-center gap-2">
                    <Lock className="h-4 w-4 text-orange-600" />
                    Nova Senha
                  </Label>
                  <PasswordInput
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="h-12"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold flex items-center gap-2">
                    <Lock className="h-4 w-4 text-orange-600" />
                    Confirmar Nova Senha
                  </Label>
                  <PasswordInput
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    className="h-12"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">As senhas não coincidem</p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="shadow-lg"
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
