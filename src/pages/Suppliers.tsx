import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2, ArrowLeft, Mail, Phone, MapPin, Edit, Trash2, MoreVertical } from 'lucide-react'

import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { SupplierForm } from '@/components/SupplierForm'
import { getOrCreateRestaurant } from '@/lib/restaurant'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/lib/suppliers'
import type { Supplier } from '@/lib/types'

export default function Suppliers() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()

  const [restaurant, setRestaurant] = React.useState<{ id: string; name: string } | null>(null)
  const [suppliers, setSuppliers] = React.useState<Supplier[]>([])
  const [loading, setLoading] = React.useState(true)
  const [formOpen, setFormOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [selectedSupplier, setSelectedSupplier] = React.useState<Supplier | null>(null)
  const [formLoading, setFormLoading] = React.useState(false)

  // Carrega dados
  React.useEffect(() => {
    if (!user) return

    async function loadData() {
      try {
        setLoading(true)
        const restaurantData = await getOrCreateRestaurant(user.id)
        setRestaurant(restaurantData)

        const suppliersData = await getSuppliers(restaurantData.id)
        setSuppliers(suppliersData)
      } catch (error) {
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Erro ao carregar fornecedores',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, toast])

  const handleCreateSupplier = async (data: {
    name: string
    contact_name?: string
    email?: string
    phone?: string
    address?: string
    notes?: string
  }) => {
    if (!restaurant) return

    try {
      setFormLoading(true)
      await createSupplier(restaurant.id, data)
      toast({
        title: 'Sucesso',
        description: 'Fornecedor criado com sucesso',
      })
      setFormOpen(false)
      setSelectedSupplier(null)
      const updatedSuppliers = await getSuppliers(restaurant.id)
      setSuppliers(updatedSuppliers)
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar fornecedor',
        variant: 'destructive',
      })
      throw error
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateSupplier = async (data: {
    name: string
    contact_name?: string
    email?: string
    phone?: string
    address?: string
    notes?: string
  }) => {
    if (!selectedSupplier) return

    try {
      setFormLoading(true)
      await updateSupplier(selectedSupplier.id, data)
      toast({
        title: 'Sucesso',
        description: 'Fornecedor atualizado com sucesso',
      })
      setFormOpen(false)
      setSelectedSupplier(null)
      if (restaurant) {
        const updatedSuppliers = await getSuppliers(restaurant.id)
        setSuppliers(updatedSuppliers)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar fornecedor',
        variant: 'destructive',
      })
      throw error
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return

    try {
      setFormLoading(true)
      await deleteSupplier(selectedSupplier.id)
      toast({
        title: 'Sucesso',
        description: 'Fornecedor excluído com sucesso',
      })
      setDeleteOpen(false)
      setSelectedSupplier(null)
      if (restaurant) {
        const updatedSuppliers = await getSuppliers(restaurant.id)
        setSuppliers(updatedSuppliers)
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir fornecedor',
        variant: 'destructive',
      })
    } finally {
      setFormLoading(false)
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
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary-icon shadow-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold gradient-primary-text">
                  Fornecedores
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{restaurant?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setSelectedSupplier(null)
                  setFormOpen(true)
                }}
                className="shadow-lg"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Fornecedor
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="rounded-xl hover:bg-orange-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </div>
          </div>

          {suppliers.length === 0 ? (
            <Card className="card-restaurant">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="mb-2">Nenhum fornecedor cadastrado</CardTitle>
                <CardDescription>
                  Cadastre fornecedores para facilitar a gestão de compras
                </CardDescription>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suppliers.map(supplier => (
                <Card key={supplier.id} className="card-restaurant">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{supplier.name}</CardTitle>
                        {supplier.contact_name && (
                          <CardDescription>Contato: {supplier.contact_name}</CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSupplier(supplier)
                              setFormOpen(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSupplier(supplier)
                              setDeleteOpen(true)
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {supplier.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                      {supplier.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="line-clamp-2">{supplier.address}</span>
                        </div>
                      )}
                      {supplier.notes && (
                        <div className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                          <p className="line-clamp-2">{supplier.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Formulário de Fornecedor */}
          <SupplierForm
            open={formOpen}
            onOpenChange={setFormOpen}
            onSubmit={selectedSupplier ? handleUpdateSupplier : handleCreateSupplier}
            supplier={selectedSupplier}
            loading={formLoading}
          />

          {/* Diálogo de Confirmação de Exclusão */}
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Fornecedor</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir "{selectedSupplier?.name}"?
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={formLoading}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteSupplier}
                  disabled={formLoading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {formLoading ? 'Excluindo...' : 'Excluir'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
