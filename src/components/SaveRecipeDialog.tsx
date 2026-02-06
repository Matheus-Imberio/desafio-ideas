import * as React from 'react'
import { Save } from 'lucide-react'

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

interface SaveRecipeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: { price?: number; servings?: number }) => Promise<void>
  recipeName: string
  loading?: boolean
}

export function SaveRecipeDialog({
  open,
  onOpenChange,
  onSave,
  recipeName,
  loading = false,
}: SaveRecipeDialogProps) {
  const { toast } = useToast()
  const [price, setPrice] = React.useState<string>('')
  const [servings, setServings] = React.useState<string>('1')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const priceNum = price ? parseFloat(price) : undefined
    const servingsNum = servings ? parseInt(servings) : undefined

    if (priceNum !== undefined && (isNaN(priceNum) || priceNum < 0)) {
      toast({
        title: 'Erro',
        description: 'Preço inválido',
        variant: 'destructive',
      })
      return
    }

    if (servingsNum !== undefined && (isNaN(servingsNum) || servingsNum < 1)) {
      toast({
        title: 'Erro',
        description: 'Quantidade de porções deve ser pelo menos 1',
        variant: 'destructive',
      })
      return
    }

    try {
      await onSave({
        price: priceNum,
        servings: servingsNum,
      })
      // Limpa os campos
      setPrice('')
      setServings('1')
      onOpenChange(false)
    } catch (error) {
      // Erro já tratado no onSave
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar Receita</DialogTitle>
          <DialogDescription>
            Configure o preço e quantidade de porções para "{recipeName}"
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="servings">Quantidade de Porções *</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                placeholder="1"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Preço de Venda (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Opcional. Você pode definir o preço depois na página de Receitas.
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
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Receita'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
