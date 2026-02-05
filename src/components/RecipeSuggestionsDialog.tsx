import * as React from 'react'
import { ChefHat, Clock, Users, AlertCircle, CheckCircle2 } from 'lucide-react'

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
import type { Ingredient } from '@/lib/types'
import { 
  getRecipeSuggestions, 
  getRecipesForExpiringIngredients, 
  getExpiredIngredients,
  type Recipe 
} from '@/lib/recipes'

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
  const [expiringRecipes, setExpiringRecipes] = React.useState<Recipe[]>([])
  const [expiredIngredients, setExpiredIngredients] = React.useState<Ingredient[]>([])
  const [showExpiringOnly, setShowExpiringOnly] = React.useState(true)

  const [loadingAI, setLoadingAI] = React.useState(false)

  React.useEffect(() => {
    if (open && ingredients.length > 0) {
      loadRecipes()
    }
  }, [open, ingredients])

  const loadRecipes = async () => {
    try {
      setLoadingAI(true)
      const [allRecipes, expiring, expired] = await Promise.all([
        getRecipeSuggestions(ingredients, 10),
        getRecipesForExpiringIngredients(ingredients, 5),
        Promise.resolve(getExpiredIngredients(ingredients))
      ])
      
      setRecipes(allRecipes)
      setExpiringRecipes(expiring)
      setExpiredIngredients(expired)
    } catch (error) {
      console.error('Erro ao carregar receitas:', error)
    } finally {
      setLoadingAI(false)
    }
  }

  const displayRecipes = showExpiringOnly && expiringRecipes.length > 0
    ? expiringRecipes
    : recipes

  const getPriorityVariant = (priority: Recipe['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive' as const
      case 'medium':
        return 'warning' as const
      default:
        return 'default' as const
    }
  }

  const getPriorityLabel = (priority: Recipe['priority']) => {
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

            {displayRecipes.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Nenhuma receita encontrada com os ingredientes disponíveis
              </div>
            ) : (
              <>
                {expiringRecipes.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium">
                        {expiringRecipes.length} receita{expiringRecipes.length !== 1 ? 's' : ''} para ingredientes vencendo
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExpiringOnly(!showExpiringOnly)}
                    >
                      {showExpiringOnly ? 'Ver todas' : 'Ver apenas vencendo'}
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  {displayRecipes.map((recipe) => (
                    <Card key={recipe.id} className="overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{recipe.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {recipe.description}
                            </p>
                          </div>
                          <Badge variant={getPriorityVariant(recipe.priority)}>
                            {getPriorityLabel(recipe.priority)}
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
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
