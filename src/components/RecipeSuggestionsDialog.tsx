import * as React from 'react'
import { ChefHat, Clock, Users, AlertCircle, CheckCircle2, Save } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from './AuthProvider'
import { getOrCreateRestaurant } from '@/lib/restaurant'
import { createRecipe } from '@/lib/recipes'
import { SaveRecipeDialog } from './SaveRecipeDialog'
import type { Ingredient } from '@/lib/types'
import { 
  getRecipeSuggestions, 
  getExpiredIngredients,
  type RecipeSuggestion,
  type RecipeTag
} from '@/lib/recipes'

// Alias para compatibilidade
type Recipe = RecipeSuggestion

interface RecipeSuggestionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredients: Ingredient[]
}

export function RecipeSuggestionsDialog({
  open,
  onOpenChange,
  ingredients,
}: RecipeSuggestionsDialogProps) {
  const [recipes, setRecipes] = React.useState<Recipe[]>([])
  const [expiredIngredients, setExpiredIngredients] = React.useState<Ingredient[]>([])
  const [loadingAI, setLoadingAI] = React.useState(false)

  React.useEffect(() => {
    if (open && ingredients.length > 0) {
      loadRecipes()
    }
  }, [open, ingredients])

  const loadRecipes = async () => {
    try {
      setLoadingAI(true)
      const [allRecipes, expired] = await Promise.all([
        getRecipeSuggestions(ingredients, 20),
        Promise.resolve(getExpiredIngredients(ingredients))
      ])
      
      setRecipes(allRecipes)
      setExpiredIngredients(expired)
    } catch (error) {
      console.error('Erro ao carregar receitas:', error)
    } finally {
      setLoadingAI(false)
    }
  }

  // Agrupa receitas por tags
  const groupedRecipes = React.useMemo(() => {
    const groups: Record<RecipeTag, Recipe[]> = {
      expiring_soon: [],
      high_stock: [],
      ok: []
    }
    
    recipes.forEach(recipe => {
      recipe.tags.forEach(tag => {
        if (!groups[tag].find(r => r.id === recipe.id)) {
          groups[tag].push(recipe)
        }
      })
    })
    
    return groups
  }, [recipes])

  const getTagLabel = (tag: RecipeTag): string => {
    switch (tag) {
      case 'expiring_soon':
        return 'Produtos quase vencendo'
      case 'high_stock':
        return 'Produtos com alto estoque'
      case 'ok':
        return 'Produtos ok'
    }
  }

  const getTagVariant = (tag: RecipeTag): 'destructive' | 'warning' | 'default' => {
    switch (tag) {
      case 'expiring_soon':
        return 'destructive'
      case 'high_stock':
        return 'warning'
      case 'ok':
        return 'default'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Receitas Sugeridas
          </DialogTitle>
          <DialogDescription>
            Receitas baseadas nos seus ingredientes disponíveis
          </DialogDescription>
        </DialogHeader>

        {ingredients.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Adicione ingredientes ao estoque para receber sugestões de receitas
          </div>
        ) : loadingAI ? (
          <div className="py-8 text-center text-muted-foreground">
            <div className="animate-pulse">Gerando receitas inteligentes...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Alerta de ingredientes vencidos */}
            {expiredIngredients.length > 0 && (
              <Card className="border-destructive bg-destructive/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-destructive mb-1">
                        Ingredientes Vencidos Detectados
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Os seguintes ingredientes estão vencidos e devem ser descartados antes de usar receitas:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {expiredIngredients.map((ing) => (
                          <Badge key={ing.id} variant="destructive">
                            {ing.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {recipes.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Nenhuma receita encontrada com os ingredientes disponíveis
              </div>
            ) : (
              <div className="space-y-6">
                {/* Receitas de produtos quase vencendo */}
                {groupedRecipes.expiring_soon.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <h3 className="font-semibold text-sm">
                        Receitas de produtos quase vencendo ({groupedRecipes.expiring_soon.length})
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {groupedRecipes.expiring_soon.map((recipe) => (
                        <RecipeCard key={recipe.id} recipe={recipe} getTagLabel={getTagLabel} getTagVariant={getTagVariant} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Receitas de produtos com alto estoque */}
                {groupedRecipes.high_stock.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <h3 className="font-semibold text-sm">
                        Receitas de produtos com alto estoque ({groupedRecipes.high_stock.length})
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {groupedRecipes.high_stock.map((recipe) => (
                        <RecipeCard key={recipe.id} recipe={recipe} getTagLabel={getTagLabel} getTagVariant={getTagVariant} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Receitas de produtos ok */}
                {groupedRecipes.ok.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <h3 className="font-semibold text-sm">
                        Receitas de produtos ok ({groupedRecipes.ok.length})
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {groupedRecipes.ok.map((recipe) => (
                        <RecipeCard key={recipe.id} recipe={recipe} getTagLabel={getTagLabel} getTagVariant={getTagVariant} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Componente separado para o card de receita
function RecipeCard({ 
  recipe, 
  getTagLabel, 
  getTagVariant
}: { 
  recipe: Recipe
  getTagLabel: (tag: RecipeTag) => string
  getTagVariant: (tag: RecipeTag) => 'destructive' | 'warning' | 'default'
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [saving, setSaving] = React.useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false)
  const [recipeToSave, setRecipeToSave] = React.useState<Recipe | null>(null)

  const handleOpenSaveDialog = () => {
    setRecipeToSave(recipe)
    setSaveDialogOpen(true)
  }

  const handleSaveRecipe = async (data: { price?: number; servings?: number }) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para salvar receitas',
        variant: 'destructive',
      })
      return
    }

    try {
      setSaving(true)
      const restaurant = await getOrCreateRestaurant(user.id)
      
      // Formata descrição com instruções
      const fullDescription = [
        recipe.description,
        '',
        'Modo de Preparo:',
        ...recipe.instructions.map((step, idx) => `${idx + 1}. ${step}`),
      ].join('\n')
      
      // Converte RecipeSuggestion para formato de criação
      const savedRecipe = await createRecipe(restaurant.id, {
        name: recipe.name,
        description: fullDescription,
        servings: data.servings || recipe.servings,
        preparation_time: recipe.cookingTime,
        cost_per_serving: data.price ? data.price / (data.servings || recipe.servings) : null,
        ingredients: recipe.ingredients.map(ingName => ({
          ingredient_name: ingName,
          quantity: 1, // Quantidade padrão, pode ser ajustada depois
          unit: 'units' as const,
        })),
      })

      console.log('Receita salva com sucesso:', savedRecipe)

      toast({
        title: 'Sucesso',
        description: 'Receita salva com sucesso! Você pode encontrá-la na página de Receitas.',
        duration: 5000,
      })

      // Não recarrega as sugestões - isso causa um flash desnecessário
      // As sugestões da IA não mudam quando salvamos uma receita
    } catch (error) {
      console.error('Erro ao salvar receita:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar receita',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }
  const getPriorityVariantLocal = (priority: Recipe['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive' as const
      case 'medium':
        return 'warning' as const
      default:
        return 'default' as const
    }
  }

  const getPriorityLabelLocal = (priority: Recipe['priority']) => {
    switch (priority) {
      case 'high':
        return 'Alta Prioridade'
      case 'medium':
        return 'Média Prioridade'
      default:
        return 'Baixa Prioridade'
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{recipe.name}</CardTitle>
              {recipe.isAI && (
                <Badge variant="outline" className="text-xs">
                  IA
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {recipe.description}
            </p>
            {recipe.reason && (
              <p className="text-xs text-primary mt-1 italic">
                💡 {recipe.reason}
              </p>
            )}
            {/* Tags da receita */}
            <div className="flex flex-wrap gap-1 mt-2">
              {recipe.tags.map((tag) => (
                <Badge key={tag} variant={getTagVariant(tag)} className="text-xs">
                  {getTagLabel(tag)}
                </Badge>
              ))}
            </div>
          </div>
          <Badge variant={getPriorityVariantLocal(recipe.priority)}>
            {getPriorityLabelLocal(recipe.priority)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações da receita */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {recipe.cookingTime} min
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {recipe.servings} {recipe.servings === 1 ? 'porção' : 'porções'}
          </div>
        </div>

        {/* Ingredientes */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Ingredientes:</h4>
          <div className="flex flex-wrap gap-2">
            {recipe.ingredients.map((ing, index) => {
              const isAvailable = recipe.matchedIngredients.includes(ing)
              return (
                <Badge
                  key={index}
                  variant={isAvailable ? 'default' : 'outline'}
                  className="text-xs"
                >
                  {isAvailable && (
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                  )}
                  {ing}
                </Badge>
              )
            })}
          </div>
          {recipe.missingIngredients.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Faltam: {recipe.missingIngredients.join(', ')}
            </p>
          )}
        </div>

        {/* Modo de preparo */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-semibold text-primary hover:underline">
            Ver modo de preparo
          </summary>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            {recipe.instructions.map((step, index) => (
              <li key={index} className="pl-2">
                {step}
              </li>
            ))}
          </ol>
        </details>

        {/* Botão de salvar */}
        {user && (
          <div className="pt-2 border-t">
            <Button
              onClick={handleOpenSaveDialog}
              disabled={saving}
              className="w-full"
              size="sm"
            >
              <Save className="mr-2 h-4 w-4" />
              Salvar Receita
            </Button>
          </div>
        )}
      </CardContent>
      
      {/* Diálogo para salvar receita */}
      {recipeToSave && (
        <SaveRecipeDialog
          open={saveDialogOpen}
          onOpenChange={(open) => {
            setSaveDialogOpen(open)
            if (!open) {
              setRecipeToSave(null)
            }
          }}
          onSave={handleSaveRecipe}
          recipeName={recipeToSave.name}
          loading={saving}
        />
      )}
    </Card>
  )
}
