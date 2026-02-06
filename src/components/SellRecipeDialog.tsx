import * as React from 'react'
import { ShoppingBag } from 'lucide-react'

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
import { useToast } from '@/components/ui/use-toast'

interface SellRecipeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSell: (data: { price?: number; quantity?: number }) => Promise<void>
  recipeName: string
  pricePerServing: number | null
  loading?: boolean
}

export function SellRecipeDialog({
  open,
  onOpenChange,
  onSell,
  recipeName,
  pricePerServing,
  loading = false,
}: SellRecipeDialogProps) {
  const { toast } = useToast()
  const [quantity, setQuantity] = React.useState<string>('1')

  React.useEffect(() => {
    if (open) {
      setQuantity('1')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const quantityNum = quantity ? parseInt(quantity) : 1

    if (quantityNum < 1) {
      toast({
        title: 'Erro',
        description: 'Quantidade deve ser pelo menos 1',
        variant: 'destructive',
      })
      return
    }

    // Usa o preço cadastrado no prato (cost_per_serving)
    const priceToUse = pricePerServing && pricePerServing > 0 ? pricePerServing : undefined

    try {
      await onSell({
        price: priceToUse,
        quantity: quantityNum,
      })
      setQuantity('1')
      onOpenChange(false)
    } catch (error) {
      // Erro já tratado no onSell
    }
  }

  const totalPrice = pricePerServing && pricePerServing > 0 
    ? (pricePerServing * (parseInt(quantity) || 1)).toFixed(2).replace('.', ',')
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vender Prato</DialogTitle>
          <DialogDescription>
            Informe a quantidade para "{recipeName}"
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                required
                disabled={loading}
                className="text-lg h-12"
                autoFocus
              />
            </div>

            {pricePerServing && pricePerServing > 0 ? (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Preço por porção:</span>
                  <span className="text-lg font-bold">R$ {pricePerServing.toFixed(2).replace('.', ',')}</span>
                </div>
                {totalPrice && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Total:</span>
                    <span className="text-xl font-bold text-green-600">R$ {totalPrice}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Este prato não tem preço cadastrado. A venda será registrada sem valor no faturamento.
                </p>
              </div>
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
              <ShoppingBag className="mr-2 h-4 w-4" />
              {loading ? 'Vendendo...' : 'Vender'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
