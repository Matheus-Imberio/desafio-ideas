export type IngredientUnit = 'kg' | 'liters' | 'units' | 'g' | 'ml'

export type StockMovementType = 'purchase' | 'sale' | 'adjustment' | 'waste' | 'expired'

export type AlertType = 'low_stock' | 'expiring_soon' | 'expired'

export interface Restaurant {
  id: string
  name: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface Ingredient {
  id: string
  restaurant_id: string
  name: string
  quantity: number
  unit: IngredientUnit
  min_stock: number
  expiry_date: string | null
  category: string | null
  created_at: string
  updated_at: string
}

export interface StockMovement {
  id: string
  ingredient_id: string
  type: StockMovementType
  quantity: number
  previous_quantity: number
  new_quantity: number
  notes: string | null
  user_id: string
  created_at: string
}

export interface Alert {
  id: string
  ingredient_id: string
  restaurant_id: string
  type: AlertType
  is_read: boolean
  created_at: string
}

export interface IngredientFormData {
  name: string
  quantity: number
  unit: IngredientUnit
  min_stock: number
  expiry_date: string | null
  category: string | null
}
