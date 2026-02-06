import * as React from 'react'
import { ShoppingCart } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import type { Supplier } from '@/lib/types'

interface SelectSupplierDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (supplierId: string | null) => Promise<void>
  suppliers: Supplier[]
  loading?: boolean
}

export function SelectSupplierDialog({
  open,
  onOpenChange,
  onSelect,
  suppliers,
  loading = false,
}: SelectSupplierDialogProps) {
  const { toast } = useToast()
  const [selectedSupplierId, setSelectedSupplierId] = React.useState<string>('none')

  React.useEffect(() => {
    if (open) {
      setSelectedSupplierId('none')
    }
  }, [open])

  const handleSubmit = async () => {
    try {
      await onSelect(selectedSupplierId === 'none' ? null : selectedSupplierId)
      setSelectedSupplierId('none')
      onOpenChange(false)
    } catch (error) {
      // Erro já tratado no onSelect
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selecionar Fornecedor</DialogTitle>
          <DialogDescription>
            Escolha o fornecedor desta compra para vincular às transações financeiras
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Fornecedor</label>
            <Select
              value={selectedSupplierId}
              onValueChange={setSelectedSupplierId}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um fornecedor (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem fornecedor</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                    {supplier.contact_name && ` - ${supplier.contact_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Você pode deixar em branco se não houver fornecedor específico
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedSupplierId('none')
              onOpenChange(false)
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            {loading ? 'Concluindo...' : 'Concluir Compra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
