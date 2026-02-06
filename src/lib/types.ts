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

// ============================================
// Novos tipos para funcionalidades estendidas
// ============================================

export interface Supplier {
  id: string
  restaurant_id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface SupplierProduct {
  id: string
  supplier_id: string
  ingredient_name: string
  unit: IngredientUnit
  price: number | null
  delivery_days: number
  created_at: string
  updated_at: string
}

export interface Recipe {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  servings: number
  preparation_time: number | null
  cost_per_serving: number | null
  created_at: string
  updated_at: string
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  ingredient_id: string | null
  ingredient_name: string
  quantity: number
  unit: IngredientUnit
  created_at: string
}

export interface RecipeSale {
  id: string
  recipe_id: string
  restaurant_id: string
  quantity: number
  price: number | null
  sold_at: string
  user_id: string
}

export interface ShoppingList {
  id: string
  restaurant_id: string
  name: string
  status: 'draft' | 'active' | 'completed' | 'archived'
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface ShoppingListItem {
  id: string
  shopping_list_id: string
  ingredient_id: string | null
  ingredient_name: string
  quantity_needed: number
  unit: IngredientUnit
  priority: 'low' | 'normal' | 'high' | 'urgent'
  supplier_id: string | null
  category: string | null
  is_purchased: boolean
  purchased_at: string | null
  notes: string | null
  price: number | null
  created_at: string
}

export interface FinancialTransaction {
  id: string
  restaurant_id: string
  type: 'revenue' | 'expense'
  description: string
  amount: number
  category: string | null
  reference_id: string | null
  supplier_id: string | null
  user_id: string
  transaction_date: string
  created_at: string
}

export interface UserPreferences {
  id: string
  user_id: string
  theme: 'light' | 'dark' | 'auto'
  primary_color: string
  layout: string
  created_at: string
  updated_at: string
}

export interface DashboardStats {
  totalIngredients: number
  totalCategories: number
  lowStockCount: number
  expiringSoonCount: number
  expiredCount: number
  totalStockValue: number | null
  stockByCategory: Array<{ category: string; count: number; totalQuantity: number }>
  topUsedIngredients: Array<{ ingredient_id: string; ingredient_name: string; count: number }>
  movementsLast30Days: Array<{ date: string; count: number }>
  expiringNext7Days: Array<Ingredient>
  // Faturamento/Vendas
  totalRevenue: number
  totalSales: number
  totalExpenses: number
  revenueLast30Days: Array<{ date: string; revenue: number; sales: number }>
  topSellingRecipes: Array<{ recipe_id: string; recipe_name: string; sales: number; revenue: number }>
  // Compras e Vendas Mensais
  monthlyExpenses: number
  monthlyRevenue: number
  monthlySales: number
}

export interface ConsumptionAnalysis {
  ingredient_id: string
  ingredient_name: string
  averageDailyConsumption: number
  averageWeeklyConsumption: number
  daysUntilEmpty: number | null
  predictedEmptyDate: string | null
  consumptionTrend: 'increasing' | 'decreasing' | 'stable'
  lastMovementDate: string | null
}
