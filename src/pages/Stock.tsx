import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Bell, LogOut } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { IngredientForm } from '@/components/IngredientForm'
import { IngredientList } from '@/components/IngredientList'
import { AdjustStockDialog } from '@/components/AdjustStockDialog'
import {
  getOrCreateRestaurant,
  type Restaurant,
} from '@/lib/restaurant'
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  createStockMovement,
  getCategories,
  getUnreadAlerts,
  type IngredientFilters,
} from '@/lib/ingredients'
import type { Ingredient, IngredientFormData, StockMovementType } from '@/lib/types'

export default function Stock() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null)
  const [ingredients, setIngredients] = React.useState<Ingredient[]>([])
  const [categories, setCategories] = React.useState<string[]>([])
  const [alertsCount, setAlertsCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(0)
  const [totalCount, setTotalCount] = React.useState(0)

  // Filtros
  const [filters, setFilters] = React.useState<IngredientFilters>({
    search: '',
    category: null,
    status: null,
  })

  // Estados dos diálogos
  const [formOpen, setFormOpen] = React.useState(false)
  const [adjustOpen, setAdjustOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [selectedIngredient, setSelectedIngredient] =
    React.useState<Ingredient | null>(null)
  const [formLoading, setFormLoading] = React.useState(false)

  // Carrega restaurante e dados iniciais
  React.useEffect(() => {
    if (!user) return

    async function loadData() {
      try {
        setLoading(true)

        // Cria ou busca restaurante
        const restaurantData = await getOrCreateRestaurant(user.id)
        setRestaurant(restaurantData)

        // Carrega categorias
        const categoriesData = await getCategories(restaurantData.id)
        setCategories(categoriesData)

        // Carrega alertas
        const alerts = await getUnreadAlerts(restaurantData.id)
        setAlertsCount(alerts.length)
      } catch (error) {
        toast({
          title: 'Erro',
          description:
            error instanceof Error ? error.message : 'Erro ao carregar dados',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, toast])

  // Carrega ingredientes quando filtros ou página mudam
  React.useEffect(() => {
    if (!restaurant) return

    async function loadIngredients() {
      try {
        setLoading(true)
        const result = await getIngredients(restaurant.id, page, filters)
        setIngredients(result.data)
        setTotalPages(result.totalPages)
        setTotalCount(result.count)
      } catch (error) {
        toast({
          title: 'Erro',
          description:
            error instanceof Error
              ? error.message
              : 'Erro ao carregar ingredientes',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadIngredients()
  }, [restaurant, page, filters, toast])

  // Atualiza alertas periodicamente
  React.useEffect(() => {
    if (!restaurant) return

    const interval = setInterval(async () => {
      try {
        const alerts = await getUnreadAlerts(restaurant.id)
        setAlertsCount(alerts.length)
      } catch (error) {
        // Silencioso
      }
    }, 30000) // A cada 30 segundos

    return () => clearInterval(interval)
  }, [restaurant])

  const handleCreateIngredient = async (data: IngredientFormData) => {
    if (!restaurant) return

    try {
      setFormLoading(true)
      await createIngredient(restaurant.id, data)
      toast({
        title: 'Sucesso',
        description: 'Ingrediente criado com sucesso',
      })
      setFormOpen(false)

      // Recarrega categorias
      const categoriesData = await getCategories(restaurant.id)
      setCategories(categoriesData)
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          error instanceof Error
            ? error.message
            : 'Erro ao criar ingrediente',
        variant: 'destructive',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateIngredient = async (data: IngredientFormData) => {
    if (!selectedIngredient) return

    try {
      setFormLoading(true)
      await updateIngredient(selectedIngredient.id, data)
      toast({
        title: 'Sucesso',
        description: 'Ingrediente atualizado com sucesso',
      })
      setFormOpen(false)
      setSelectedIngredient(null)

      // Recarrega categorias
      if (restaurant) {
        const categoriesData = await getCategories(restaurant.id)
        setCategories(categoriesData)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          error instanceof Error
            ? error.message
            : 'Erro ao atualizar ingrediente',
        variant: 'destructive',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteIngredient = async () => {
    if (!selectedIngredient) return

    try {
      setFormLoading(true)
      await deleteIngredient(selectedIngredient.id)
      toast({
        title: 'Sucesso',
        description: 'Ingrediente excluído com sucesso',
      })
      setDeleteOpen(false)
      setSelectedIngredient(null)
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          error instanceof Error
            ? error.message
            : 'Erro ao excluir ingrediente',
        variant: 'destructive',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleAdjustStock = async (
    type: StockMovementType,
    quantity: number,
    notes?: string
  ) => {
    if (!selectedIngredient) return

    try {
      setFormLoading(true)
      await createStockMovement(selectedIngredient.id, type, quantity, notes)
      toast({
        title: 'Sucesso',
        description: 'Estoque ajustado com sucesso',
      })
      setAdjustOpen(false)
      setSelectedIngredient(null)
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Erro ao ajustar estoque',
        variant: 'destructive',
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      })
      return
    }
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Controle de Estoque</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {restaurant?.name} • {user?.email}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {alertsCount > 0 && (
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {alertsCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                      {alertsCount > 9 ? '9+' : alertsCount}
                    </span>
                  )}
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>

          {/* Filtros e Busca */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar ingrediente..."
                      value={filters.search || ''}
                      onChange={(e) => {
                        setFilters({ ...filters, search: e.target.value })
                        setPage(1)
                      }}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Select
                  value={filters.category || 'all'}
                  onValueChange={(value) => {
                    setFilters({
                      ...filters,
                      category: value === 'all' ? null : value,
                    })
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => {
                    setFilters({
                      ...filters,
                      status:
                        value === 'all' ? null : (value as IngredientFilters['status']),
                    })
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="low_stock">Estoque Baixo</SelectItem>
                    <SelectItem value="expiring_soon">Vencendo em Breve</SelectItem>
                    <SelectItem value="expired">Vencido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Ações e Info */}
          <div className="flex items-center justify-between">
            <Button onClick={() => {
              setSelectedIngredient(null)
              setFormOpen(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Ingrediente
            </Button>

            {totalCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {totalCount} ingrediente{totalCount !== 1 ? 's' : ''} encontrado
                {totalCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Lista de Ingredientes */}
          <IngredientList
            ingredients={ingredients}
            onEdit={(ingredient) => {
              setSelectedIngredient(ingredient)
              setFormOpen(true)
            }}
            onDelete={(ingredient) => {
              setSelectedIngredient(ingredient)
              setDeleteOpen(true)
            }}
            onAdjustStock={(ingredient) => {
              setSelectedIngredient(ingredient)
              setAdjustOpen(true)
            }}
            loading={loading}
          />

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}

          {/* Diálogos */}
          <IngredientForm
            open={formOpen}
            onOpenChange={setFormOpen}
            onSubmit={selectedIngredient ? handleUpdateIngredient : handleCreateIngredient}
            ingredient={selectedIngredient}
            loading={formLoading}
          />

          <AdjustStockDialog
            open={adjustOpen}
            onOpenChange={setAdjustOpen}
            ingredient={selectedIngredient}
            onSubmit={handleAdjustStock}
            loading={formLoading}
          />

          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Ingrediente</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir "{selectedIngredient?.name}"?
                  Esta ação não pode ser desfeita e o histórico será mantido.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={formLoading}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteIngredient}
                  disabled={formLoading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {formLoading ? 'Excluindo...' : 'Excluir'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
