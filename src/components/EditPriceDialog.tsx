import * as React from 'react'
import { DollarSign } from 'lucide-react'

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

interface EditPriceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (price: number | null) => Promise<void>
  itemName: string
  currentPrice: number | null
  loading?: boolean
}

export function EditPriceDialog({
  open,
  onOpenChange,
  onSave,
  itemName,
  currentPrice,
  loading = false,
}: EditPriceDialogProps) {
  const { toast } = useToast()
  const [price, setPrice] = React.useState<string>('')

  React.useEffect(() => {
    if (open) {
      setPrice(currentPrice ? currentPrice.toFixed(2).replace('.', ',') : '')
    }
  }, [open, currentPrice])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Remove pontos e substitui vírgula por ponto para parseFloat
    const normalizedPrice = price.replace(/\./g, '').replace(',', '.')
    const priceNum = normalizedPrice ? parseFloat(normalizedPrice) : null

    if (priceNum !== null && (isNaN(priceNum) || priceNum < 0)) {
      toast({
        title: 'Erro',
        description: 'Preço inválido',
        variant: 'destructive',
      })
      return
    }

    try {
      await onSave(priceNum)
      onOpenChange(false)
    } catch (error) {
      // Erro já tratado no onSave
    }
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    
    // Remove tudo exceto números, vírgula e ponto
    value = value.replace(/[^\d,.]/g, '')
    
    // Permite apenas uma vírgula ou ponto
    const parts = value.split(/[,.]/)
    if (parts.length > 2) {
      value = parts[0] + ',' + parts.slice(1).join('')
    }
    
    setPrice(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Preço</DialogTitle>
          <DialogDescription>
            Informe o preço pago por "{itemName}"
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-medium">
                  R$
                </span>
                <Input
                  id="price"
                  type="text"
                  value={price}
                  onChange={handlePriceChange}
                  placeholder="0,00"
                  className="pl-10 text-lg h-12"
                  autoFocus
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Deixe em branco para remover o preço
              </p>
            </div>
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
              <DollarSign className="mr-2 h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
