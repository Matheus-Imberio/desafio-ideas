import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ChefHat, ArrowLeft, ShoppingBag, RefreshCw, Edit, Trash2, MoreVertical } from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { RecipeForm } from '@/components/RecipeForm'
import { SellRecipeDialog } from '@/components/SellRecipeDialog'
import { getOrCreateRestaurant } from '@/lib/restaurant'
import { getRecipes, getRecipeById, sellRecipe, createRecipe, updateRecipe, deleteRecipe } from '@/lib/recipes'
import type { Recipe } from '@/lib/types'

export default function Recipes() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [restaurant, setRestaurant] = React.useState<{ id: string; name: string } | null>(null)
  const [recipes, setRecipes] = React.useState<Recipe[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [formOpen, setFormOpen] = React.useState(false)
  const [formLoading, setFormLoading] = React.useState(false)
  const [selectedRecipe, setSelectedRecipe] = React.useState<(Recipe & { ingredients: Array<{ ingredient_name: string; quantity: number; unit: string }> }) | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [recipeToDelete, setRecipeToDelete] = React.useState<Recipe | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [sellDialogOpen, setSellDialogOpen] = React.useState(false)
  const [recipeToSell, setRecipeToSell] = React.useState<Recipe | null>(null)
  const [selling, setSelling] = React.useState(false)

  const loadRecipes = React.useCallback(async () => {
    if (!user || !restaurant) return

    try {
      setRefreshing(true)
      const recipesData = await getRecipes(restaurant.id)
      setRecipes(recipesData)
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar receitas',
        variant: 'destructive',
      })
    } finally {
      setRefreshing(false)
    }
  }, [user, restaurant, toast])

  // Carrega dados
  React.useEffect(() => {
    if (!user) return

    async function loadData() {
      try {
        setLoading(true)
        const restaurantData = await getOrCreateRestaurant(user.id)
        setRestaurant(restaurantData)

        const recipesData = await getRecipes(restaurantData.id)
        setRecipes(recipesData)
      } catch (error) {
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Erro ao carregar receitas',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, toast])

  // Abre formulário para editar receita
  const handleOpenEditForm = async (recipeId: string) => {
    try {
      const fullRecipe = await getRecipeById(recipeId)
      if (fullRecipe) {
        setSelectedRecipe(fullRecipe)
        setFormOpen(true)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar receita',
        variant: 'destructive',
      })
    }
  }

  // Abre diálogo de exclusão
  const handleOpenDeleteDialog = (recipe: Recipe) => {
    setRecipeToDelete(recipe)
    setDeleteDialogOpen(true)
  }

  // Cria ou atualiza receita
  const handleSaveRecipe = async (data: {
    name: string
    description?: string
    servings: number
    preparation_time?: number
    cost_per_serving?: number
    ingredients: Array<{
      ingredient_name: string
      quantity: number
      unit: 'kg' | 'liters' | 'units' | 'g' | 'ml'
    }>
  }) => {
    if (!restaurant) return

    try {
      setFormLoading(true)
      
      if (selectedRecipe) {
        // Atualiza receita existente
        await updateRecipe(selectedRecipe.id, {
          name: data.name,
          description: data.description,
          servings: data.servings,
          preparation_time: data.preparation_time,
          cost_per_serving: data.cost_per_serving,
          ingredients: data.ingredients,
        })
        toast({
          title: 'Sucesso',
          description: 'Receita atualizada com sucesso',
        })
      } else {
        // Cria nova receita
        await createRecipe(restaurant.id, data)
        toast({
          title: 'Sucesso',
          description: 'Receita criada com sucesso',
        })
      }
      
      setFormOpen(false)
      setSelectedRecipe(null)
      await loadRecipes()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar receita',
        variant: 'destructive',
      })
    } finally {
      setFormLoading(false)
    }
  }

  // Deleta receita
  const handleDeleteRecipe = async () => {
    if (!recipeToDelete) return

    try {
      setDeleting(true)
      await deleteRecipe(recipeToDelete.id)
      toast({
        title: 'Sucesso',
        description: 'Receita excluída com sucesso',
      })
      setDeleteDialogOpen(false)
      setRecipeToDelete(null)
      await loadRecipes()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir receita',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  // Abre diálogo de venda
  const handleOpenSellDialog = (recipe: Recipe) => {
    setRecipeToSell(recipe)
    setSellDialogOpen(true)
  }

  // Vende prato (baixa automática)
  const handleSellRecipe = async (data: { price?: number; quantity?: number }) => {
    if (!restaurant || !user || !recipeToSell) return

    try {
      setSelling(true)
      await sellRecipe(
        recipeToSell.id,
        restaurant.id,
        data.quantity || 1,
        data.price,
        user.id
      )
      const totalPrice = data.price && data.price > 0 
        ? (data.price * (data.quantity || 1)).toFixed(2).replace('.', ',')
        : null
      
      toast({
        title: 'Sucesso',
        description: totalPrice
          ? `Prato vendido por R$ ${totalPrice}! Estoque atualizado.`
          : 'Prato vendido e estoque atualizado',
      })
      setSellDialogOpen(false)
      setRecipeToSell(null)
      // Recarrega receitas após vender
      await loadRecipes()
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao vender prato',
        variant: 'destructive',
      })
    } finally {
      setSelling(false)
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
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary-icon shadow-lg">
                <ShoppingBag className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold gradient-primary-text">
                  Vendas
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{restaurant?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setSelectedRecipe(null)
                  setFormOpen(true)
                }}
                className="rounded-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Receita
              </Button>
              <Button
                variant="outline"
                onClick={loadRecipes}
                disabled={refreshing}
                className="rounded-xl"
                title="Atualizar receitas"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="rounded-xl hover:bg-orange-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </div>

          {recipes.length === 0 ? (
            <Card className="card-restaurant">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ChefHat className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">Nenhuma receita cadastrada</CardTitle>
                <CardDescription>
                  Use o diálogo de sugestões de receitas na página de estoque para começar
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recipes.map(recipe => (
                <Card key={recipe.id} className="card-restaurant">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="break-words">{recipe.name}</CardTitle>
                        {recipe.description && (
                          <CardDescription className="line-clamp-2">{recipe.description}</CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditForm(recipe.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenDeleteDialog(recipe)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {recipe.servings && (
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">{recipe.servings} porções</Badge>
                        </div>
                      )}
                      {recipe.preparation_time && (
                        <div className="text-sm text-muted-foreground">
                          Tempo: {recipe.preparation_time} min
                        </div>
                      )}
                      {recipe.cost_per_serving && (
                        <div className="text-sm text-muted-foreground">
                          Custo: R$ {recipe.cost_per_serving.toFixed(2).replace('.', ',')} por porção
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleOpenSellDialog(recipe)}
                      className="w-full"
                      size="sm"
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Vender Prato
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Formulário de nova/editar receita */}
        <RecipeForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open)
            if (!open) {
              setSelectedRecipe(null)
            }
          }}
          onSubmit={handleSaveRecipe}
          loading={formLoading}
          recipe={selectedRecipe}
        />

        {/* Diálogo de vender prato */}
        {recipeToSell && (
          <SellRecipeDialog
            open={sellDialogOpen}
            onOpenChange={(open) => {
              setSellDialogOpen(open)
              if (!open) {
                setRecipeToSell(null)
              }
            }}
            onSell={handleSellRecipe}
            recipeName={recipeToSell.name}
            pricePerServing={recipeToSell.cost_per_serving}
            loading={selling}
          />
        )}

        {/* Diálogo de confirmar exclusão */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Receita</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{recipeToDelete?.name}"?
                Esta ação não pode ser desfeita e todos os ingredientes e vendas relacionadas serão removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteRecipe}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
