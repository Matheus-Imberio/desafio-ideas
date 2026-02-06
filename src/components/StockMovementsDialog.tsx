import * as React from 'react'
import { History } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import type { StockMovement, Ingredient } from '@/lib/types'
import { getIngredientMovements } from '@/lib/ingredients'
import { translateUnit, formatDateTimePT, formatQuantity } from '@/lib/utils'

interface StockMovementsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingredient: Ingredient | null
}

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  purchase: 'Compra',
  sale: 'Venda',
  adjustment: 'Ajuste Manual',
  waste: 'Desperdício',
  expired: 'Vencido',
}

const MOVEMENT_TYPE_VARIANTS: Record<string, 'default' | 'destructive' | 'warning' | 'success'> = {
  purchase: 'success',
  sale: 'default',
  adjustment: 'warning',
  waste: 'destructive',
  expired: 'destructive',
}

export function StockMovementsDialog({
  open,
  onOpenChange,
  ingredient,
}: StockMovementsDialogProps) {
  const [movements, setMovements] = React.useState<StockMovement[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (open && ingredient) {
      loadMovements()
    }
  }, [open, ingredient])

  const loadMovements = async () => {
    if (!ingredient) return
    setLoading(true)
    try {
      const data = await getIngredientMovements(ingredient.id)
      setMovements(data)
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!ingredient) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Movimentações
          </DialogTitle>
          <DialogDescription>
            {ingredient.name} • Estoque atual: {ingredient.quantity.toFixed(2)} {translateUnit(ingredient.unit)}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Carregando histórico...
          </div>
        ) : movements.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Nenhuma movimentação registrada ainda
          </div>
        ) : (
          <div className="space-y-3">
            {movements.map((movement) => {
              const isIncrease = movement.new_quantity > movement.previous_quantity
              const difference = Math.abs(movement.new_quantity - movement.previous_quantity)

              return (
                <Card key={movement.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={MOVEMENT_TYPE_VARIANTS[movement.type] || 'default'}>
                            {MOVEMENT_TYPE_LABELS[movement.type]}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDateTimePT(movement.created_at)}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Anterior:</span>
                            <p className="font-medium">
                              {formatQuantity(movement.previous_quantity, ingredient.unit)} {translateUnit(ingredient.unit)}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Quantidade:</span>
                            <p className="font-medium">
                              {isIncrease ? '+' : '-'} {difference.toFixed(2)} {translateUnit(ingredient.unit)}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Nova:</span>
                            <p className="font-medium">
                              {formatQuantity(movement.new_quantity, ingredient.unit)} {translateUnit(ingredient.unit)}
                            </p>
                          </div>
                        </div>

                        {movement.notes && (
                          <p className="text-sm text-muted-foreground italic">
                            "{movement.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
