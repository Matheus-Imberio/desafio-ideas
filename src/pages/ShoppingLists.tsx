import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ShoppingCart, Check, X, ArrowLeft, Sparkles, Package, Edit, Trash2, MoreVertical, DollarSign } from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import { getOrCreateRestaurant } from '@/lib/restaurant'
import { getIngredients } from '@/lib/ingredients'
import {
  getShoppingLists,
  getShoppingListById,
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
  generateSmartShoppingList,
  updateShoppingListItem,
  deleteShoppingListItem,
  addShoppingListItem,
} from '@/lib/shopping-lists'
import { getSuppliers } from '@/lib/suppliers'
import { SelectSupplierDialog } from '@/components/SelectSupplierDialog'
import { EditPriceDialog } from '@/components/EditPriceDialog'
import type { ShoppingList, ShoppingListItem, Ingredient, IngredientUnit, Supplier } from '@/lib/types'

export default function ShoppingLists() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [restaurant, setRestaurant] = React.useState<{ id: string; name: string } | null>(null)
  const [lists, setLists] = React.useState<ShoppingList[]>([])
  const [selectedList, setSelectedList] = React.useState<(ShoppingList & { items: ShoppingListItem[] }) | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [newListName, setNewListName] = React.useState('')
  const [creating, setCreating] = React.useState(false)
  const [addItemDialogOpen, setAddItemDialogOpen] = React.useState(false)
  const [availableIngredients, setAvailableIngredients] = React.useState<Ingredient[]>([])
  const [selectedIngredientId, setSelectedIngredientId] = React.useState<string>('')
  const [itemQuantity, setItemQuantity] = React.useState<string>('1')
  const [itemUnit, setItemUnit] = React.useState<IngredientUnit>('units')
  const [itemPriority, setItemPriority] = React.useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [addingItem, setAddingItem] = React.useState(false)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [listToEdit, setListToEdit] = React.useState<ShoppingList | null>(null)
  const [listToDelete, setListToDelete] = React.useState<ShoppingList | null>(null)
  const [editListName, setEditListName] = React.useState('')
  const [updating, setUpdating] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([])
  const [supplierDialogOpen, setSupplierDialogOpen] = React.useState(false)
  const [completing, setCompleting] = React.useState(false)
  const [priceDialogOpen, setPriceDialogOpen] = React.useState(false)
  const [itemToEditPrice, setItemToEditPrice] = React.useState<ShoppingListItem | null>(null)
  const [updatingPrice, setUpdatingPrice] = React.useState(false)

  // Carrega dados
  React.useEffect(() => {
    if (!user) return

    async function loadData() {
      try {
        setLoading(true)
        const restaurantData = await getOrCreateRestaurant(user.id)
        setRestaurant(restaurantData)

        const shoppingLists = await getShoppingLists(restaurantData.id)
        setLists(shoppingLists)

        const suppliersData = await getSuppliers(restaurantData.id)
        setSuppliers(suppliersData)
      } catch (error) {
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Erro ao carregar listas',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, toast])

  // Carrega ingredientes disponíveis quando abre o diálogo de adicionar item
  React.useEffect(() => {
    if (addItemDialogOpen && restaurant) {
      async function loadIngredients() {
        try {
          // Busca todos os ingredientes (primeira página, pode expandir depois)
          const result = await getIngredients(restaurant.id, 1, {})
          setAvailableIngredients(result.data)
        } catch (error) {
          console.error('Erro ao carregar ingredientes:', error)
        }
      }
      loadIngredients()
    }
  }, [addItemDialogOpen, restaurant])

  // Gera lista inteligente
  const handleGenerateSmartList = async () => {
    if (!restaurant) return

    try {
      setGenerating(true)
      const newList = await generateSmartShoppingList(restaurant.id, 'Lista Automática')
      
      if (newList.items.length === 0) {
        toast({
          title: 'Lista Criada',
          description: 'Lista criada, mas nenhum ingrediente precisa de reposição no momento. Todos os estoques estão acima do mínimo.',
        })
      } else {
        toast({
          title: 'Sucesso',
          description: `Lista criada com ${newList.items.length} item${newList.items.length !== 1 ? 's' : ''}`,
        })
      }
      
      const updatedLists = await getShoppingLists(restaurant.id)
      setLists(updatedLists)
      
      // Garante que a lista recém-criada seja selecionada
      // Busca novamente para garantir que está atualizada
      const freshList = await getShoppingListById(newList.id)
      if (freshList) {
        setSelectedList(freshList)
      } else {
        // Se não encontrou, seleciona a primeira da lista atualizada
        if (updatedLists.length > 0) {
          const firstList = await getShoppingListById(updatedLists[0].id)
          if (firstList) {
            setSelectedList(firstList)
          }
        }
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao gerar lista',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  // Carrega lista selecionada
  const handleSelectList = async (listId: string) => {
    try {
      const list = await getShoppingListById(listId)
      if (list) {
        setSelectedList(list)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao carregar lista',
        variant: 'destructive',
      })
    }
  }

  // Marca item como comprado
  const handleTogglePurchased = async (itemId: string, isPurchased: boolean) => {
    if (!selectedList) return

    try {
      await updateShoppingListItem(itemId, { is_purchased: !isPurchased })
      const updatedList = await getShoppingListById(selectedList.id)
      if (updatedList) {
        setSelectedList(updatedList)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar item',
        variant: 'destructive',
      })
    }
  }

  // Remove item
  const handleDeleteItem = async (itemId: string) => {
    if (!selectedList) return

    try {
      await deleteShoppingListItem(itemId)
      const updatedList = await getShoppingListById(selectedList.id)
      if (updatedList) {
        setSelectedList(updatedList)
      }
      toast({
        title: 'Sucesso',
        description: 'Item removido',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao remover item',
        variant: 'destructive',
      })
    }
  }

  // Abre diálogo de edição de preço
  const handleOpenPriceDialog = (item: ShoppingListItem) => {
    setItemToEditPrice(item)
    setPriceDialogOpen(true)
  }

  // Salva preço do item
  const handleSavePrice = async (price: number | null) => {
    if (!itemToEditPrice || !selectedList) return

    try {
      setUpdatingPrice(true)
      await updateShoppingListItem(itemToEditPrice.id, { price })
      const updatedList = await getShoppingListById(selectedList.id)
      if (updatedList) {
        setSelectedList(updatedList)
      }
      toast({
        title: 'Sucesso',
        description: price 
          ? `Preço atualizado: R$ ${price.toFixed(2).replace('.', ',')}`
          : 'Preço removido',
      })
      setPriceDialogOpen(false)
      setItemToEditPrice(null)
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar preço',
        variant: 'destructive',
      })
    } finally {
      setUpdatingPrice(false)
    }
  }

  // Abre diálogo de edição
  const handleOpenEditDialog = (list: ShoppingList, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setListToEdit(list)
    setEditListName(list.name)
    setEditDialogOpen(true)
  }

  // Salva edição da lista
  const handleSaveEdit = async () => {
    if (!listToEdit || !editListName.trim()) return

    try {
      setUpdating(true)
      await updateShoppingList(listToEdit.id, { name: editListName.trim() })
      
      toast({
        title: 'Sucesso',
        description: 'Lista atualizada',
      })

      // Atualiza a lista na lista de listas
      const updatedLists = await getShoppingLists(restaurant!.id)
      setLists(updatedLists)

      // Se a lista editada está selecionada, atualiza ela também
      if (selectedList?.id === listToEdit.id) {
        const updatedList = await getShoppingListById(listToEdit.id)
        if (updatedList) {
          setSelectedList(updatedList)
        }
      }

      setEditDialogOpen(false)
      setListToEdit(null)
      setEditListName('')
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar lista',
        variant: 'destructive',
      })
    } finally {
      setUpdating(false)
    }
  }

  // Abre diálogo de exclusão
  const handleOpenDeleteDialog = (list: ShoppingList, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setListToDelete(list)
    setDeleteDialogOpen(true)
  }

  // Deleta lista
  const handleDeleteList = async () => {
    if (!listToDelete) return

    try {
      setDeleting(true)
      await deleteShoppingList(listToDelete.id)
      
      toast({
        title: 'Sucesso',
        description: 'Lista excluída',
      })

      // Atualiza a lista de listas
      const updatedLists = await getShoppingLists(restaurant!.id)
      setLists(updatedLists)

      // Se a lista deletada estava selecionada, limpa a seleção
      if (selectedList?.id === listToDelete.id) {
        setSelectedList(null)
      }

      setDeleteDialogOpen(false)
      setListToDelete(null)
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir lista',
        variant: 'destructive',
      })
    } finally {
      setDeleting(false)
    }
  }

  // Completa lista
  // Abre diálogo de seleção de fornecedor antes de concluir
  const handleOpenCompleteDialog = () => {
    if (!selectedList || !restaurant || !user) return
    
    // Verifica se há itens com preço
    const itemsWithPrice = selectedList.items.filter(item => item.price && item.price > 0)
    if (itemsWithPrice.length === 0) {
      // Se não houver itens com preço, conclui diretamente sem fornecedor
      handleCompleteList(null)
      return
    }
    
    // Se houver itens com preço, abre diálogo para selecionar fornecedor
    setSupplierDialogOpen(true)
  }

  // Conclui a lista com o fornecedor selecionado
  const handleCompleteList = async (supplierId: string | null) => {
    if (!selectedList || !restaurant || !user) return

    try {
      setCompleting(true)
      await updateShoppingList(selectedList.id, { status: 'completed' }, user.id, supplierId || undefined)
      const updatedLists = await getShoppingLists(restaurant.id)
      setLists(updatedLists)
      const updatedList = await getShoppingListById(selectedList.id)
      if (updatedList) {
        setSelectedList(updatedList)
      }
      
      // Calcula total gasto para mostrar na mensagem
      const totalSpent = selectedList.items
        .filter(item => item.price && item.price > 0)
        .reduce((sum, item) => sum + (item.price || 0), 0)
      
      const supplierName = supplierId 
        ? suppliers.find(s => s.id === supplierId)?.name 
        : null
      
      toast({
        title: 'Sucesso',
        description: totalSpent > 0 
          ? `Lista concluída! Total gasto: R$ ${totalSpent.toFixed(2).replace('.', ',')}${supplierName ? ` - Fornecedor: ${supplierName}` : ''}`
          : 'Lista marcada como concluída',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao completar lista',
        variant: 'destructive',
      })
    } finally {
      setCompleting(false)
    }
  }

  // Adiciona item à lista manualmente
  const handleAddItem = async () => {
    if (!selectedList || !selectedIngredientId || !itemQuantity) return

    const ingredient = availableIngredients.find(ing => ing.id === selectedIngredientId)
    if (!ingredient) {
      toast({
        title: 'Erro',
        description: 'Ingrediente não encontrado',
        variant: 'destructive',
      })
      return
    }

    try {
      setAddingItem(true)
      await addShoppingListItem(selectedList.id, {
        ingredient_id: selectedIngredientId,
        ingredient_name: ingredient.name,
        quantity_needed: parseFloat(itemQuantity),
        unit: itemUnit,
        priority: itemPriority,
        category: ingredient.category || null,
      })

      toast({
        title: 'Sucesso',
        description: 'Item adicionado à lista',
      })

      // Recarrega a lista
      const updatedList = await getShoppingListById(selectedList.id)
      if (updatedList) {
        setSelectedList(updatedList)
      }

      // Limpa o formulário
      setSelectedIngredientId('')
      setItemQuantity('1')
      setItemUnit('units')
      setItemPriority('normal')
      setAddItemDialogOpen(false)
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao adicionar item',
        variant: 'destructive',
      })
    } finally {
      setAddingItem(false)
    }
  }

  // Cria lista manualmente
  const handleCreateList = async () => {
    if (!restaurant || !newListName.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da lista é obrigatório',
        variant: 'destructive',
      })
      return
    }

    try {
      setCreating(true)
      const newList = await createShoppingList(restaurant.id, newListName.trim())
      toast({
        title: 'Sucesso',
        description: 'Lista criada com sucesso',
      })
      const updatedLists = await getShoppingLists(restaurant.id)
      setLists(updatedLists)
      
      // Garante que a lista recém-criada seja selecionada
      const freshList = await getShoppingListById(newList.id)
      if (freshList) {
        setSelectedList(freshList)
      }
      
      setNewListName('')
      setCreateDialogOpen(false)
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar lista',
        variant: 'destructive',
      })
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary-icon shadow-lg shrink-0">
                <ShoppingCart className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-primary-text">
                  Listas de Compras
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{restaurant?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="rounded-xl hover:bg-orange-50 w-full sm:w-auto"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => setCreateDialogOpen(true)} className="shadow-lg">
              <Plus className="mr-2 h-4 w-4" />
              Nova Lista
            </Button>
            <Button onClick={handleGenerateSmartList} disabled={generating} variant="outline" className="shadow-lg">
              <Sparkles className="mr-2 h-4 w-4" />
              {generating ? 'Gerando...' : 'Gerar Lista Inteligente'}
            </Button>
            {selectedList && selectedList.status !== 'completed' && (
              <Button
                onClick={() => setAddItemDialogOpen(true)}
                variant="outline"
                className="shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Item
              </Button>
            )}
          </div>

          {/* Diálogo de criar lista */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Lista de Compras</DialogTitle>
                <DialogDescription>
                  Crie uma lista de compras vazia para adicionar itens manualmente
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="listName">Nome da Lista</Label>
                  <Input
                    id="listName"
                    placeholder="Ex: Compras da Semana"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !creating) {
                        handleCreateList()
                      }
                    }}
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCreateDialogOpen(false)
                      setNewListName('')
                    }}
                    disabled={creating}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateList} disabled={creating || !newListName.trim()}>
                    {creating ? 'Criando...' : 'Criar Lista'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Diálogo de adicionar item */}
          <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Item à Lista</DialogTitle>
                <DialogDescription>
                  Adicione um ingrediente à lista de compras
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="ingredient">
                    Ingrediente <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={selectedIngredientId}
                    onValueChange={setSelectedIngredientId}
                  >
                    <SelectTrigger id="ingredient">
                      <SelectValue placeholder="Selecione um ingrediente" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableIngredients.map(ing => (
                        <SelectItem key={ing.id} value={ing.id}>
                          {ing.name} {ing.category && `(${ing.category})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">
                      Quantidade <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                      placeholder="1.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">
                      Unidade <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={itemUnit}
                      onValueChange={(value: IngredientUnit) => setItemUnit(value)}
                    >
                      <SelectTrigger id="unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="units">Unidades</SelectItem>
                        <SelectItem value="kg">Quilogramas</SelectItem>
                        <SelectItem value="g">Gramas</SelectItem>
                        <SelectItem value="liters">Litros</SelectItem>
                        <SelectItem value="ml">Mililitros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">
                    Prioridade
                  </Label>
                  <Select
                    value={itemPriority}
                    onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') =>
                      setItemPriority(value)
                    }
                  >
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddItemDialogOpen(false)
                      setSelectedIngredientId('')
                      setItemQuantity('1')
                      setItemUnit('units')
                      setItemPriority('normal')
                    }}
                    disabled={addingItem}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddItem}
                    disabled={addingItem || !selectedIngredientId || !itemQuantity}
                  >
                    {addingItem ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Diálogo de editar lista */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Lista de Compras</DialogTitle>
                <DialogDescription>
                  Altere o nome da lista de compras
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="editListName">Nome da Lista</Label>
                  <Input
                    id="editListName"
                    placeholder="Ex: Compras da Semana"
                    value={editListName}
                    onChange={(e) => setEditListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !updating && editListName.trim()) {
                        handleSaveEdit()
                      }
                    }}
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditDialogOpen(false)
                      setListToEdit(null)
                      setEditListName('')
                    }}
                    disabled={updating}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={updating || !editListName.trim()}>
                    {updating ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Diálogo de confirmar exclusão */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Lista de Compras</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir "{listToDelete?.name}"?
                  Esta ação não pode ser desfeita e todos os itens da lista serão removidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteList}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Diálogo de seleção de fornecedor */}
          <SelectSupplierDialog
            open={supplierDialogOpen}
            onOpenChange={setSupplierDialogOpen}
            onSelect={handleCompleteList}
            suppliers={suppliers}
            loading={completing}
          />

          {/* Diálogo de edição de preço */}
          {itemToEditPrice && (
            <EditPriceDialog
              open={priceDialogOpen}
              onOpenChange={(open) => {
                setPriceDialogOpen(open)
                if (!open) {
                  setItemToEditPrice(null)
                }
              }}
              onSave={handleSavePrice}
              itemName={itemToEditPrice.ingredient_name}
              currentPrice={itemToEditPrice.price}
              loading={updatingPrice}
            />
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Lista de Listas */}
            <div className="lg:col-span-1 w-full">
              <Card className="card-restaurant">
                <CardHeader>
                  <CardTitle>Listas</CardTitle>
                  <CardDescription>{lists.length} lista(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  {lists.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma lista criada
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {lists.map(list => (
                        <div
                          key={list.id}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSelectList(list.id)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              handleSelectList(list.id)
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedList?.id === list.id
                              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="font-medium block truncate">{list.name}</span>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(list.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge
                                variant={
                                  list.status === 'completed'
                                    ? 'default'
                                    : list.status === 'active'
                                      ? 'default'
                                      : 'outline'
                                }
                                className="shrink-0"
                              >
                                {list.status === 'completed'
                                  ? 'Concluída'
                                  : list.status === 'active'
                                    ? 'Ativa'
                                    : 'Rascunho'}
                              </Badge>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }}
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                    <span className="sr-only">Menu</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => handleOpenEditDialog(list, e)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => handleOpenDeleteDialog(list, e)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Itens da Lista Selecionada */}
            <div className="lg:col-span-2 w-full">
              {selectedList ? (
                <Card className="card-restaurant">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{selectedList.name}</CardTitle>
                        <CardDescription>
                          {selectedList.items.filter(i => i.is_purchased).length} de{' '}
                          {selectedList.items.length} itens comprados
                          {selectedList.items.some(i => i.price && i.price > 0) && (
                            <span className="ml-2 font-semibold text-green-600">
                              • Total: R${' '}
                              {selectedList.items
                                .filter(i => i.price && i.price > 0)
                                .reduce((sum, i) => sum + (i.price || 0), 0)
                                .toFixed(2)
                                .replace('.', ',')}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      {selectedList.status !== 'completed' && (
                        <Button onClick={handleOpenCompleteDialog} size="sm" disabled={completing}>
                          <Check className="mr-2 h-4 w-4" />
                          Concluir
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedList.items.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="mb-2">Nenhum item nesta lista</p>
                        {selectedList.status !== 'completed' && (
                          <Button
                            onClick={() => setAddItemDialogOpen(true)}
                            variant="outline"
                            size="sm"
                            className="mt-2"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Primeiro Item
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedList.items.map(item => (
                          <div
                            key={item.id}
                            className={`p-3 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
                              item.is_purchased ? 'bg-muted/30 opacity-60' : ''
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium break-words">{item.ingredient_name}</span>
                                <Badge
                                  variant={
                                    item.priority === 'urgent'
                                      ? 'destructive'
                                      : item.priority === 'high'
                                        ? 'default'
                                        : 'outline'
                                  }
                                  className="shrink-0"
                                >
                                  {item.priority === 'urgent'
                                    ? 'Urgente'
                                    : item.priority === 'high'
                                      ? 'Alta'
                                      : item.priority === 'normal'
                                        ? 'Normal'
                                        : 'Baixa'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.quantity_needed} {item.unit}
                                {item.category && ` • ${item.category}`}
                                {item.price && item.price > 0 && (
                                  <span className="ml-2 font-semibold text-green-600">
                                    • R$ {item.price.toFixed(2).replace('.', ',')}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {selectedList.status !== 'completed' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleOpenPriceDialog(item)}
                                    className="min-w-[100px] justify-start"
                                    title="Editar preço"
                                  >
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    {item.price && item.price > 0 
                                      ? `R$ ${item.price.toFixed(2).replace('.', ',')}`
                                      : 'Preço'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleTogglePurchased(item.id, item.is_purchased)}
                                    title={item.is_purchased ? 'Marcar como não comprado' : 'Marcar como comprado'}
                                    className={item.is_purchased ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-green-600'}
                                  >
                                    <Check className={`h-4 w-4 ${item.is_purchased ? 'text-green-600' : ''}`} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteItem(item.id)}
                                    title="Excluir item"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {selectedList.status === 'completed' && item.price && item.price > 0 && (
                                <div className="text-sm font-semibold text-green-600">
                                  R$ {item.price.toFixed(2).replace('.', ',')}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="card-restaurant">
                  <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Selecione uma lista para ver os itens</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
