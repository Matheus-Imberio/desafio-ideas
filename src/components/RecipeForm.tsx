import * as React from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { IngredientUnit, Recipe } from '@/lib/types'

const recipeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  servings: z.number().min(1, 'Deve ter pelo menos 1 porção'),
  preparation_time: z.number().min(0).optional(),
  cost_per_serving: z.number().min(0).optional(),
  ingredients: z.array(
    z.object({
      ingredient_name: z.string().min(1, 'Nome do ingrediente é obrigatório'),
      quantity: z.number().min(0.01, 'Quantidade deve ser maior que 0'),
      unit: z.enum(['kg', 'liters', 'units', 'g', 'ml']),
    })
  ).min(1, 'Adicione pelo menos um ingrediente'),
})

type RecipeFormValues = z.infer<typeof recipeSchema>

interface RecipeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: RecipeFormValues) => Promise<void>
  loading?: boolean
  recipe?: (Recipe & { ingredients: Array<{ ingredient_name: string; quantity: number; unit: string }> }) | null
}

const UNITS: { value: IngredientUnit; label: string }[] = [
  { value: 'units', label: 'Unidades' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'g', label: 'Gramas (g)' },
  { value: 'liters', label: 'Litros (L)' },
  { value: 'ml', label: 'Mililitros (ml)' },
]

export function RecipeForm({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  recipe = null,
}: RecipeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: '',
      description: '',
      servings: 1,
      preparation_time: undefined,
      cost_per_serving: undefined,
      ingredients: [{ ingredient_name: '', quantity: 1, unit: 'units' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients',
  })

  React.useEffect(() => {
    if (open && recipe) {
      // Preenche formulário para edição
      reset({
        name: recipe.name,
        description: recipe.description || '',
        servings: recipe.servings || 1,
        preparation_time: recipe.preparation_time || undefined,
        cost_per_serving: recipe.cost_per_serving || undefined,
        ingredients: recipe.ingredients && recipe.ingredients.length > 0
          ? recipe.ingredients.map(ing => ({
              ingredient_name: ing.ingredient_name,
              quantity: ing.quantity,
              unit: ing.unit as IngredientUnit,
            }))
          : [{ ingredient_name: '', quantity: 1, unit: 'units' }],
      })
    } else if (!open) {
      // Limpa formulário ao fechar
      reset({
        name: '',
        description: '',
        servings: 1,
        preparation_time: undefined,
        cost_per_serving: undefined,
        ingredients: [{ ingredient_name: '', quantity: 1, unit: 'units' }],
      })
    }
  }, [open, recipe, reset])

  const onFormSubmit = async (data: RecipeFormValues) => {
    await onSubmit(data)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipe ? 'Editar Receita' : 'Nova Receita'}</DialogTitle>
          <DialogDescription>
            {recipe ? 'Atualize as informações da receita' : 'Adicione uma nova receita ou prato ao seu cardápio'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Receita *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Risotto de Camarão"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              {...register('description')}
              placeholder="Descrição da receita..."
              className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="servings">Porções *</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                {...register('servings', { valueAsNumber: true })}
                disabled={loading}
              />
              {errors.servings && (
                <p className="text-sm text-destructive">{errors.servings.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preparation_time">Tempo (min)</Label>
              <Input
                id="preparation_time"
                type="number"
                min="0"
                {...register('preparation_time', { valueAsNumber: true })}
                placeholder="30"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost_per_serving">Custo por Porção (R$)</Label>
              <Input
                id="cost_per_serving"
                type="number"
                step="0.01"
                min="0"
                {...register('cost_per_serving', { valueAsNumber: true })}
                placeholder="0.00"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ingredientes *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ ingredient_name: '', quantity: 1, unit: 'units' })}
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Input
                        {...register(`ingredients.${index}.ingredient_name`)}
                        placeholder="Nome do ingrediente"
                        disabled={loading}
                      />
                      {errors.ingredients?.[index]?.ingredient_name && (
                        <p className="text-xs text-destructive">
                          {errors.ingredients[index]?.ingredient_name?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...register(`ingredients.${index}.quantity`, { valueAsNumber: true })}
                        placeholder="Quantidade"
                        disabled={loading}
                      />
                      {errors.ingredients?.[index]?.quantity && (
                        <p className="text-xs text-destructive">
                          {errors.ingredients[index]?.quantity?.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Select
                        {...register(`ingredients.${index}.unit`)}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNITS.map((unit) => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {errors.ingredients && typeof errors.ingredients.message === 'string' && (
              <p className="text-sm text-destructive">{errors.ingredients.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : recipe ? 'Atualizar Receita' : 'Salvar Receita'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
