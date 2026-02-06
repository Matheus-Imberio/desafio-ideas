import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

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
import type { Ingredient, StockMovementType } from '@/lib/types'
import { translateUnit, formatQuantity } from '@/lib/utils'

const adjustStockSchema = z.object({
  type: z.enum(['purchase', 'sale', 'adjustment', 'waste', 'expired']),
  quantity: z.number().min(0.01, 'Quantidade deve ser maior que 0'),
  notes: z.string().optional(),
})

type AdjustStockFormValues = z.infer<typeof adjustStockSchema>

interface AdjustStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredient: Ingredient | null
  onSubmit: (
    type: StockMovementType,
    quantity: number,
    notes?: string
  ) => Promise<void>
  loading?: boolean
}

const MOVEMENT_TYPES: { value: StockMovementType; label: string }[] = [
  { value: 'purchase', label: 'Compra' },
  { value: 'sale', label: 'Venda' },
  { value: 'adjustment', label: 'Ajuste Manual' },
  { value: 'waste', label: 'Desperdício' },
  { value: 'expired', label: 'Vencido' },
]

export function AdjustStockDialog({
  open,
  onOpenChange,
  ingredient,
  onSubmit,
  loading = false,
}: AdjustStockDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustStockSchema),
    defaultValues: {
      type: 'adjustment',
      quantity: 0,
      notes: '',
    },
  })

  const typeValue = watch('type')

  React.useEffect(() => {
    if (ingredient && open) {
      reset({
        type: 'adjustment',
        quantity: ingredient.quantity,
        notes: '',
      })
    }
  }, [ingredient, open, reset])

  const onFormSubmit = async (data: AdjustStockFormValues) => {
    await onSubmit(data.type, data.quantity, data.notes)
    reset()
    onOpenChange(false)
  }

  if (!ingredient) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajustar Estoque</DialogTitle>
          <DialogDescription>
            Atualize a quantidade de {ingredient.name} no estoque
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Movimentação *</Label>
            <Select
              value={typeValue}
              onValueChange={(value) =>
                setValue('type', value as StockMovementType)
              }
              disabled={loading}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOVEMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantidade {typeValue === 'adjustment' ? '(Nova quantidade)' : '*'}
            </Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              {...register('quantity', { valueAsNumber: true })}
              placeholder="0"
              disabled={loading}
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">
                {errors.quantity.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Estoque atual: {formatQuantity(ingredient.quantity, ingredient.unit)} {translateUnit(ingredient.unit)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Input
              id="notes"
              {...register('notes')}
              placeholder="Ex: Compra realizada no fornecedor X"
              disabled={loading}
            />
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
              {loading ? 'Salvando...' : 'Aplicar Ajuste'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
