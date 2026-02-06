import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  Bell,
  LogOut,
  User,
  ChefHat,
  ShoppingBag,
  TrendingUp,
  ShoppingCart,
  Building2,
  Settings,
  DollarSign,
} from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { IngredientForm } from '@/components/IngredientForm'
import { IngredientList } from '@/components/IngredientList'
import { AdjustStockDialog } from '@/components/AdjustStockDialog'
import { StockMovementsDialog } from '@/components/StockMovementsDialog'
import { RecipeSuggestionsDialog } from '@/components/RecipeSuggestionsDialog'
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
  getAllAlerts,
  markAlertAsRead,
  type IngredientFilters,
} from '@/lib/ingredients'
import type { Ingredient, IngredientFormData, StockMovementType, Alert } from '@/lib/types'

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
  const [alertsOpen, setAlertsOpen] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [recipesOpen, setRecipesOpen] = React.useState(false)
  const [alerts, setAlerts] = React.useState<Alert[]>([])
  const [alertsLoading, setAlertsLoading] = React.useState(false)
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

  // Função para carregar ingredientes (reutilizável)
  const loadIngredients = React.useCallback(async () => {
    if (!restaurant) return

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
  }, [restaurant, page, filters, toast])

  // Carrega ingredientes quando filtros ou página mudam
  React.useEffect(() => {
    loadIngredients()
  }, [loadIngredients])

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
      setSelectedIngredient(null)

      // Recarrega categorias e ingredientes
      const categoriesData = await getCategories(restaurant.id)
      setCategories(categoriesData)
      await loadIngredients()
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

      // Recarrega categorias e ingredientes
      if (restaurant) {
        const categoriesData = await getCategories(restaurant.id)
        setCategories(categoriesData)
        await loadIngredients()
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
      
      // Recarrega ingredientes e alertas
      await loadIngredients()
      if (restaurant) {
        const alerts = await getUnreadAlerts(restaurant.id)
        setAlertsCount(alerts.length)
      }
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
      
      // Recarrega ingredientes e alertas
      await loadIngredients()
      if (restaurant) {
        const alerts = await getUnreadAlerts(restaurant.id)
        setAlertsCount(alerts.length)
      }
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

  const handleOpenAlerts = async () => {
    if (!restaurant) return
    setAlertsOpen(true)
    setAlertsLoading(true)
    try {
      const allAlerts = await getAllAlerts(restaurant.id)
      setAlerts(allAlerts)
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Erro ao carregar alertas',
        variant: 'destructive',
      })
    } finally {
      setAlertsLoading(false)
    }
  }

  const getIngredientName = (ingredientId: string) => {
    const ingredient = ingredients.find((ing) => ing.id === ingredientId)
    return ingredient?.name || `Ingrediente #${ingredientId.slice(0, 8)}`
  }

  const handleMarkAlertAsRead = async (alertId: string) => {
    try {
      await markAlertAsRead(alertId)
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
      )
      setAlertsCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          error instanceof Error
            ? error.message
            : 'Erro ao marcar alerta como lido',
        variant: 'destructive',
      })
    }
  }

  const getAlertLabel = (type: string) => {
    switch (type) {
      case 'low_stock':
        return 'Estoque Baixo'
      case 'expiring_soon':
        return 'Vencendo em Breve'
      case 'expired':
        return 'Vencido'
      default:
        return 'Alerta'
    }
  }

  const getAlertVariant = (type: string): 'destructive' | 'default' | 'warning' => {
    switch (type) {
      case 'low_stock':
        return 'warning'
      case 'expiring_soon':
        return 'warning'
      case 'expired':
        return 'destructive'
      default:
        return 'default'
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 mb-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              {/* Logo e Informações */}
              <div className="flex items-center gap-4 flex-1">
                <div className="p-3 rounded-2xl bg-primary-icon shadow-lg shrink-0">
                  <ChefHat className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl sm:text-4xl font-bold gradient-primary-text whitespace-nowrap">
                    Controle de Estoque
                  </h1>
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-orange-700 dark:text-orange-400">{restaurant?.name}</span>
                    <span className="hidden sm:inline text-muted-foreground">•</span>
                    <span className="text-xs sm:text-sm break-all sm:break-normal">{user?.email}</span>
                  </div>
                </div>
              </div>

              {/* Navegação */}
              <div className="w-full lg:w-auto">
                <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
                  {/* Grupo Principal */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="relative rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    onClick={handleOpenAlerts}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Alertas
                    {alertsCount > 0 && (
                      <span className="ml-2 h-5 w-5 rounded-full bg-gradient-to-r from-red-500 to-rose-500 text-[10px] text-white flex items-center justify-center font-bold shadow-md">
                        {alertsCount > 9 ? '9+' : alertsCount}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    onClick={() => navigate('/dashboard')}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    onClick={() => navigate('/shopping-lists')}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Compras
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    onClick={() => navigate('/recipes')}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Vendas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    onClick={() => navigate('/suppliers')}
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Fornecedores
                  </Button>

                  {/* Separador */}
                  <div className="hidden lg:inline-block h-6 w-px bg-border mx-1" />

                  {/* Grupo Secundário */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    onClick={() => navigate('/settings')}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
                    onClick={() => navigate('/profile')}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros e Busca */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary-dynamic" />
                Filtros
              </CardTitle>
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => {
                  setSelectedIngredient(null)
                  setFormOpen(true)
                }}
                className="shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Ingrediente
              </Button>
              <Button
                variant="outline"
                onClick={() => setRecipesOpen(true)}
                disabled={ingredients.length === 0}
              >
                <ChefHat className="mr-2 h-4 w-4" />
                Receitas
              </Button>
            </div>

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
            onViewHistory={(ingredient) => {
              setSelectedIngredient(ingredient)
              setHistoryOpen(true)
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

          <Dialog open={alertsOpen} onOpenChange={setAlertsOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Alertas e Notificações</DialogTitle>
                <DialogDescription>
                  Acompanhe os alertas do seu estoque
                </DialogDescription>
              </DialogHeader>
              {alertsLoading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Carregando alertas...
                </div>
              ) : alerts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Nenhum alerta no momento
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <Card
                      key={alert.id}
                      className={`cursor-pointer transition-colors ${
                        alert.is_read ? 'opacity-60' : ''
                      }`}
                      onClick={() => !alert.is_read && handleMarkAlertAsRead(alert.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getAlertVariant(alert.type)}>
                                {getAlertLabel(alert.type)}
                              </Badge>
                              {!alert.is_read && (
                                <span className="h-2 w-2 rounded-full bg-primary"></span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {getIngredientName(alert.ingredient_id)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(alert.created_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>

          <StockMovementsDialog
            open={historyOpen}
            onOpenChange={setHistoryOpen}
            ingredient={selectedIngredient}
          />

          <RecipeSuggestionsDialog
            open={recipesOpen}
            onOpenChange={setRecipesOpen}
            ingredients={ingredients}
          />
        </div>
      </div>
    </div>
  )
}
