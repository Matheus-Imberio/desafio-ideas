import * as React from 'react'
import { format } from 'date-fns'
import { MoreVertical, Edit, Trash2, Package } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Ingredient } from '@/lib/types'
import { getIngredientStatus } from '@/lib/ingredients'

interface IngredientListProps {
  ingredients: Ingredient[]
  onEdit: (ingredient: Ingredient) => void
  onDelete: (ingredient: Ingredient) => void
  onAdjustStock: (ingredient: Ingredient) => void
  loading?: boolean
}

export function IngredientList({
  ingredients,
  onEdit,
  onDelete,
  onAdjustStock,
  loading = false,
}: IngredientListProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (ingredients.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="mb-2">Nenhum ingrediente cadastrado</CardTitle>
          <CardDescription>
            Comece adicionando seu primeiro ingrediente ao estoque
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {ingredients.map((ingredient) => {
        const status = getIngredientStatus(ingredient)
        const isExpired = status.type === 'expired'

        return (
          <Card key={ingredient.id} className={isExpired ? 'border-destructive' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{ingredient.name}</CardTitle>
                  {ingredient.category && (
                    <CardDescription className="mt-1">
                      {ingredient.category}
                    </CardDescription>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onAdjustStock(ingredient)}>
                      Ajustar Estoque
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(ingredient)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(ingredient)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Quantidade</span>
                <span className="text-lg font-semibold">
                  {ingredient.quantity.toFixed(2)} {ingredient.unit}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Estoque Mínimo
                </span>
                <span className="text-sm">{ingredient.min_stock} {ingredient.unit}</span>
              </div>

              {ingredient.expiry_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Validade</span>
                  <span
                    className={`text-sm ${
                      isExpired ? 'text-destructive font-semibold' : ''
                    }`}
                  >
                    {format(new Date(ingredient.expiry_date), "dd 'de' MMM")}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t">
                <Badge variant={status.variant} className="w-full justify-center">
                  {status.label}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
