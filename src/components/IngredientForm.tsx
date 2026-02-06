import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'

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
import { useToast } from '@/components/ui/use-toast'
import { validateIngredientName, quickValidateIngredientName } from '@/lib/ingredient-validation'
import type { Ingredient, IngredientFormData, IngredientUnit } from '@/lib/types'

const ingredientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  quantity: z.number().min(0, 'Quantidade deve ser maior ou igual a 0'),
  unit: z.enum(['kg', 'liters', 'units', 'g', 'ml']),
  min_stock: z.number().min(0, 'Estoque mínimo deve ser maior ou igual a 0'),
  expiry_date: z.string().nullable(),
  category: z.string().nullable(),
})

type IngredientFormValues = z.infer<typeof ingredientSchema>

interface IngredientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: IngredientFormData) => Promise<void>
  ingredient?: Ingredient | null
  loading?: boolean
}

const UNITS: { value: IngredientUnit; label: string }[] = [
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'g', label: 'Gramas (g)' },
  { value: 'liters', label: 'Litros (L)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'units', label: 'Unidades' },
]

export function IngredientForm({
  open,
  onOpenChange,
  onSubmit,
  ingredient,
  loading = false,
}: IngredientFormProps) {
  const { toast } = useToast()
  const [validating, setValidating] = React.useState(false)
  const [validationError, setValidationError] = React.useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<IngredientFormValues>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: '',
      quantity: 0,
      unit: 'units',
      min_stock: 0,
      expiry_date: null,
      category: null,
    },
  })

  const unitValue = watch('unit')
  const nameValue = watch('name')

  // Preenche formulário quando editar
  React.useEffect(() => {
    if (ingredient && open) {
      reset({
        name: ingredient.name,
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        min_stock: ingredient.min_stock,
        expiry_date: ingredient.expiry_date
          ? format(new Date(ingredient.expiry_date), 'yyyy-MM-dd')
          : null,
        category: ingredient.category || null,
      })
    } else if (!ingredient && open) {
      reset({
        name: '',
        quantity: 0,
        unit: 'units',
        min_stock: 0,
        expiry_date: null,
        category: null,
      })
    }
  }, [ingredient, open, reset])

  // Valida nome quando muda (apenas para novos ingredientes)
  React.useEffect(() => {
    if (!ingredient && nameValue && nameValue.trim().length > 2) {
      const timeoutId = setTimeout(async () => {
        setValidating(true)
        setValidationError(null)
        
        try {
          // SEMPRE usa IA para validar (quando disponível)
          const validation = await validateIngredientName(nameValue)
          if (!validation.isValid) {
            let errorMessage = validation.reason || 'Este não parece ser um ingrediente comestível'
            if (validation.suggestion) {
              errorMessage = `${validation.reason} (Sugestão: ${validation.suggestion})`
            }
            setValidationError(errorMessage)
          } else {
            setValidationError(null)
            // Se houver sugestão de correção, mostra como aviso (não erro)
            if (validation.suggestion && validation.suggestion.toLowerCase() !== nameValue.toLowerCase()) {
              // Não bloqueia, mas pode mostrar sugestão opcionalmente
            }
          }
        } catch (error) {
          // Em caso de erro, não bloqueia (fail-safe)
          console.error('Erro ao validar ingrediente:', error)
          setValidationError(null)
        } finally {
          setValidating(false)
        }
      }, 1000) // Debounce de 1 segundo para dar tempo da IA processar

      return () => clearTimeout(timeoutId)
    } else {
      setValidationError(null)
    }
  }, [nameValue, ingredient])

  const onFormSubmit = async (data: IngredientFormValues) => {
    // Validação final antes de submeter (apenas para novos ingredientes)
    if (!ingredient) {
      setValidating(true)
      try {
        const quickCheck = quickValidateIngredientName(data.name)
        if (!quickCheck.isValid) {
          toast({
            title: 'Ingrediente inválido',
            description: quickCheck.reason || 'Este não parece ser um ingrediente comestível.',
            variant: 'destructive',
          })
          setValidating(false)
          return
        }

        const validation = await validateIngredientName(data.name)
        if (!validation.isValid) {
          toast({
            title: 'Ingrediente inválido',
            description: validation.reason || 'Este não parece ser um ingrediente comestível.',
            variant: 'destructive',
          })
          setValidating(false)
          return
        }
      } catch (error) {
        // Em caso de erro, permite continuar (fail-safe)
        console.error('Erro ao validar ingrediente:', error)
      } finally {
        setValidating(false)
      }
    }

    await onSubmit({
      ...data,
      expiry_date: data.expiry_date || null,
      category: data.category || null,
    })
    reset()
    setValidationError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {ingredient ? 'Editar Ingrediente' : 'Novo Ingrediente'}
          </DialogTitle>
          <DialogDescription>
            {ingredient
              ? 'Atualize as informações do ingrediente'
              : 'Adicione um novo ingrediente ao estoque'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Tomate"
              disabled={loading || validating}
              className={validationError ? 'border-destructive' : ''}
            />
            {validating && (
              <p className="text-sm text-muted-foreground">
                Verificando se é um ingrediente válido...
              </p>
            )}
            {validationError && (
              <p className="text-sm text-destructive">{validationError}</p>
            )}
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                {...register('quantity', { valueAsNumber: true })}
                disabled={loading}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unidade *</Label>
              <Select
                value={unitValue}
                onValueChange={(value) => setValue('unit', value as IngredientUnit)}
                disabled={loading}
              >
                <SelectTrigger id="unit">
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

          <div className="space-y-2">
            <Label htmlFor="min_stock">Estoque Mínimo *</Label>
            <Input
              id="min_stock"
              type="number"
              step="0.01"
              {...register('min_stock', { valueAsNumber: true })}
              placeholder="0"
              disabled={loading}
            />
            {errors.min_stock && (
              <p className="text-sm text-destructive">
                {errors.min_stock.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry_date">Data de Validade</Label>
              <Input
                id="expiry_date"
                type="date"
                {...register('expiry_date')}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                {...register('category')}
                placeholder="Ex: Carnes"
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || validating}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || validating || (!!validationError && !ingredient)}>
              {loading || validating ? 'Validando...' : ingredient ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
