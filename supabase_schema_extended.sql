-- ============================================
-- Schema Estendido - Novas Funcionalidades
-- Execute este SQL após o schema base
-- ============================================

-- ============================================
-- TABELAS NOVAS
-- ============================================

-- Tabela de Fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_supplier_per_restaurant UNIQUE (restaurant_id, name)
);

-- Tabela de Produtos de Fornecedores
CREATE TABLE IF NOT EXISTS supplier_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'liters', 'units', 'g', 'ml')),
  price NUMERIC(10, 2),
  delivery_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Receitas/Pratos
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  servings INTEGER DEFAULT 1,
  preparation_time INTEGER, -- em minutos
  cost_per_serving NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_recipe_per_restaurant UNIQUE (restaurant_id, name)
);

-- Tabela de Ingredientes de Receitas
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  ingredient_name TEXT NOT NULL, -- Nome do ingrediente (pode não estar cadastrado)
  quantity NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'liters', 'units', 'g', 'ml')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Vendas de Pratos (para baixa automática)
CREATE TABLE IF NOT EXISTS recipe_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1, -- Quantidade de pratos vendidos
  sold_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabela de Listas de Compras
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Tabela de Itens de Lista de Compras
CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
  ingredient_name TEXT NOT NULL,
  quantity_needed NUMERIC(10, 2) NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('kg', 'liters', 'units', 'g', 'ml')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  category TEXT,
  is_purchased BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Preferências do Usuário (Tema, cores, etc)
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  primary_color TEXT DEFAULT 'orange',
  layout TEXT DEFAULT 'default',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_suppliers_restaurant ON suppliers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_recipes_restaurant ON recipes(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_recipe_sales_recipe ON recipe_sales(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_sales_restaurant ON recipe_sales(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_recipe_sales_sold_at ON recipe_sales(sold_at DESC);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_restaurant ON shopping_lists(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_status ON shopping_lists(status);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list ON shopping_list_items(shopping_list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_ingredient ON shopping_list_items(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_items_purchased ON shopping_list_items(is_purchased);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para updated_at em suppliers
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at em recipes
DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at em shopping_lists
DROP TRIGGER IF EXISTS update_shopping_lists_updated_at ON shopping_lists;
CREATE TRIGGER update_shopping_lists_updated_at
  BEFORE UPDATE ON shopping_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at em user_preferences
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para baixa automática de estoque ao vender prato
CREATE OR REPLACE FUNCTION reduce_stock_on_recipe_sale()
RETURNS TRIGGER AS $$
DECLARE
  recipe_ing RECORD;
  ingredient_record RECORD;
  quantity_to_reduce NUMERIC;
BEGIN
  -- Para cada ingrediente da receita
  FOR recipe_ing IN 
    SELECT * FROM recipe_ingredients WHERE recipe_id = NEW.recipe_id
  LOOP
    -- Tenta encontrar o ingrediente pelo ID ou pelo nome
    IF recipe_ing.ingredient_id IS NOT NULL THEN
      SELECT * INTO ingredient_record 
      FROM ingredients 
      WHERE id = recipe_ing.ingredient_id 
      AND restaurant_id = NEW.restaurant_id;
    ELSE
      SELECT * INTO ingredient_record 
      FROM ingredients 
      WHERE name ILIKE recipe_ing.ingredient_name 
      AND restaurant_id = NEW.restaurant_id
      LIMIT 1;
    END IF;
    
    -- Se encontrou o ingrediente, reduz o estoque
    IF ingredient_record IS NOT NULL THEN
      -- Calcula quantidade a reduzir (quantidade por porção * número de porções vendidas)
      quantity_to_reduce := recipe_ing.quantity * NEW.quantity;
      
      -- Atualiza o estoque
      UPDATE ingredients
      SET quantity = GREATEST(0, quantity - quantity_to_reduce)
      WHERE id = ingredient_record.id;
      
      -- Cria movimentação de estoque
      INSERT INTO stock_movements (
        ingredient_id,
        type,
        quantity,
        previous_quantity,
        new_quantity,
        user_id,
        notes
      )
      VALUES (
        ingredient_record.id,
        'sale',
        quantity_to_reduce,
        ingredient_record.quantity,
        GREATEST(0, ingredient_record.quantity - quantity_to_reduce),
        NEW.user_id,
        'Venda de prato: ' || (SELECT name FROM recipes WHERE id = NEW.recipe_id) || ' (x' || NEW.quantity || ')'
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para baixa automática ao vender prato
DROP TRIGGER IF EXISTS trigger_reduce_stock_on_sale ON recipe_sales;
CREATE TRIGGER trigger_reduce_stock_on_sale
  AFTER INSERT ON recipe_sales
  FOR EACH ROW
  EXECUTE FUNCTION reduce_stock_on_recipe_sale();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas para SUPPLIERS
DROP POLICY IF EXISTS "Users can view suppliers from own restaurants" ON suppliers;
CREATE POLICY "Users can view suppliers from own restaurants"
  ON suppliers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = suppliers.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create suppliers in own restaurants" ON suppliers;
CREATE POLICY "Users can create suppliers in own restaurants"
  ON suppliers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = suppliers.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update suppliers in own restaurants" ON suppliers;
CREATE POLICY "Users can update suppliers in own restaurants"
  ON suppliers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = suppliers.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete suppliers from own restaurants" ON suppliers;
CREATE POLICY "Users can delete suppliers from own restaurants"
  ON suppliers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = suppliers.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Políticas para SUPPLIER_PRODUCTS
DROP POLICY IF EXISTS "Users can manage supplier products" ON supplier_products;
CREATE POLICY "Users can manage supplier products"
  ON supplier_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM suppliers
      JOIN restaurants ON restaurants.id = suppliers.restaurant_id
      WHERE suppliers.id = supplier_products.supplier_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Políticas para RECIPES
DROP POLICY IF EXISTS "Users can view recipes from own restaurants" ON recipes;
CREATE POLICY "Users can view recipes from own restaurants"
  ON recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = recipes.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage recipes in own restaurants" ON recipes;
CREATE POLICY "Users can manage recipes in own restaurants"
  ON recipes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = recipes.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Políticas para RECIPE_INGREDIENTS
DROP POLICY IF EXISTS "Users can manage recipe ingredients" ON recipe_ingredients;
CREATE POLICY "Users can manage recipe ingredients"
  ON recipe_ingredients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM recipes
      JOIN restaurants ON restaurants.id = recipes.restaurant_id
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Políticas para RECIPE_SALES
DROP POLICY IF EXISTS "Users can view recipe sales from own restaurants" ON recipe_sales;
CREATE POLICY "Users can view recipe sales from own restaurants"
  ON recipe_sales FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = recipe_sales.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create recipe sales in own restaurants" ON recipe_sales;
CREATE POLICY "Users can create recipe sales in own restaurants"
  ON recipe_sales FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = recipe_sales.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Políticas para SHOPPING_LISTS
DROP POLICY IF EXISTS "Users can manage shopping lists" ON shopping_lists;
CREATE POLICY "Users can manage shopping lists"
  ON shopping_lists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = shopping_lists.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Políticas para SHOPPING_LIST_ITEMS
DROP POLICY IF EXISTS "Users can manage shopping list items" ON shopping_list_items;
CREATE POLICY "Users can manage shopping list items"
  ON shopping_list_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      JOIN restaurants ON restaurants.id = shopping_lists.restaurant_id
      WHERE shopping_lists.id = shopping_list_items.shopping_list_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Políticas para USER_PREFERENCES
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;
CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- FIM DO SCHEMA ESTENDIDO
-- ============================================
