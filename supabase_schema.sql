-- ============================================
-- Schema do Supabase para Sistema de Estoque
-- ============================================
-- Execute este SQL no SQL Editor do Supabase
-- https://app.supabase.com/project/[SEU_PROJECT_REF]/sql/new

-- ============================================
-- 1. EXTENSÕES
-- ============================================
-- Habilita UUID v4
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. TABELAS
-- ============================================

-- Tabela de Restaurantes (multi-tenancy)
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Ingredientes
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit TEXT NOT NULL DEFAULT 'units' CHECK (unit IN ('kg', 'liters', 'units', 'g', 'ml')),
  min_stock NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  expiry_date DATE,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_ingredient_per_restaurant UNIQUE (restaurant_id, name)
);

-- Tabela de Movimentações de Estoque
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'adjustment', 'waste', 'expired')),
  quantity NUMERIC(10, 2) NOT NULL,
  previous_quantity NUMERIC(10, 2) NOT NULL,
  new_quantity NUMERIC(10, 2) NOT NULL,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Alertas
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('low_stock', 'expiring_soon', 'expired')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. ÍNDICES (Performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ingredients_restaurant ON ingredients(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_expiry ON ingredients(expiry_date);
CREATE INDEX IF NOT EXISTS idx_stock_movements_ingredient ON stock_movements(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_ingredient ON alerts(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_restaurant ON alerts(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner ON restaurants(owner_id);

-- ============================================
-- 4. FUNÇÕES
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar alertas automaticamente
CREATE OR REPLACE FUNCTION check_and_create_alerts()
RETURNS TRIGGER AS $$
DECLARE
  days_until_expiry INTEGER;
BEGIN
  -- Remove alertas antigos deste ingrediente
  DELETE FROM alerts WHERE ingredient_id = NEW.id;
  
  -- Alerta de estoque baixo
  IF NEW.quantity <= NEW.min_stock THEN
    INSERT INTO alerts (ingredient_id, restaurant_id, type, is_read)
    VALUES (NEW.id, NEW.restaurant_id, 'low_stock', FALSE)
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Alertas de vencimento (só se tiver data de validade)
  IF NEW.expiry_date IS NOT NULL THEN
    days_until_expiry := NEW.expiry_date - CURRENT_DATE;
    
    -- Vencido
    IF days_until_expiry < 0 THEN
      INSERT INTO alerts (ingredient_id, restaurant_id, type, is_read)
      VALUES (NEW.id, NEW.restaurant_id, 'expired', FALSE)
      ON CONFLICT DO NOTHING;
    -- Vencendo em até 3 dias
    ELSIF days_until_expiry <= 3 THEN
      INSERT INTO alerts (ingredient_id, restaurant_id, type, is_read)
      VALUES (NEW.id, NEW.restaurant_id, 'expiring_soon', FALSE)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar movimentação automaticamente ao atualizar estoque
CREATE OR REPLACE FUNCTION create_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Só cria movimentação se a quantidade mudou
  IF OLD.quantity != NEW.quantity THEN
    INSERT INTO stock_movements (
      ingredient_id,
      type,
      quantity,
      previous_quantity,
      new_quantity,
      user_id
    )
    VALUES (
      NEW.id,
      'adjustment', -- Tipo padrão para mudanças manuais
      ABS(NEW.quantity - OLD.quantity),
      OLD.quantity,
      NEW.quantity,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Trigger para updated_at em restaurants
DROP TRIGGER IF EXISTS update_restaurants_updated_at ON restaurants;
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para updated_at em ingredients
DROP TRIGGER IF EXISTS update_ingredients_updated_at ON ingredients;
CREATE TRIGGER update_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para criar alertas automaticamente
DROP TRIGGER IF EXISTS trigger_check_alerts ON ingredients;
CREATE TRIGGER trigger_check_alerts
  AFTER INSERT OR UPDATE ON ingredients
  FOR EACH ROW
  EXECUTE FUNCTION check_and_create_alerts();

-- Trigger para criar movimentações automaticamente
DROP TRIGGER IF EXISTS trigger_create_movement ON ingredients;
CREATE TRIGGER trigger_create_movement
  AFTER UPDATE ON ingredients
  FOR EACH ROW
  WHEN (OLD.quantity IS DISTINCT FROM NEW.quantity)
  EXECUTE FUNCTION create_stock_movement();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS - RESTAURANTS
-- ============================================

-- Usuários podem ver apenas seus próprios restaurantes
DROP POLICY IF EXISTS "Users can view own restaurants" ON restaurants;
CREATE POLICY "Users can view own restaurants"
  ON restaurants FOR SELECT
  USING (auth.uid() = owner_id);

-- Usuários podem criar seus próprios restaurantes
DROP POLICY IF EXISTS "Users can create own restaurants" ON restaurants;
CREATE POLICY "Users can create own restaurants"
  ON restaurants FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Usuários podem atualizar seus próprios restaurantes
DROP POLICY IF EXISTS "Users can update own restaurants" ON restaurants;
CREATE POLICY "Users can update own restaurants"
  ON restaurants FOR UPDATE
  USING (auth.uid() = owner_id);

-- Usuários podem deletar seus próprios restaurantes
DROP POLICY IF EXISTS "Users can delete own restaurants" ON restaurants;
CREATE POLICY "Users can delete own restaurants"
  ON restaurants FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================
-- POLÍTICAS RLS - INGREDIENTS
-- ============================================

-- Usuários podem ver ingredientes dos seus restaurantes
DROP POLICY IF EXISTS "Users can view ingredients from own restaurants" ON ingredients;
CREATE POLICY "Users can view ingredients from own restaurants"
  ON ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = ingredients.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Usuários podem criar ingredientes nos seus restaurantes
DROP POLICY IF EXISTS "Users can create ingredients in own restaurants" ON ingredients;
CREATE POLICY "Users can create ingredients in own restaurants"
  ON ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = ingredients.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Usuários podem atualizar ingredientes dos seus restaurantes
DROP POLICY IF EXISTS "Users can update ingredients in own restaurants" ON ingredients;
CREATE POLICY "Users can update ingredients in own restaurants"
  ON ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = ingredients.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Usuários podem deletar ingredientes dos seus restaurantes
DROP POLICY IF EXISTS "Users can delete ingredients from own restaurants" ON ingredients;
CREATE POLICY "Users can delete ingredients from own restaurants"
  ON ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = ingredients.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS RLS - STOCK_MOVEMENTS
-- ============================================

-- Usuários podem ver movimentações dos ingredientes dos seus restaurantes
DROP POLICY IF EXISTS "Users can view movements from own restaurants" ON stock_movements;
CREATE POLICY "Users can view movements from own restaurants"
  ON stock_movements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ingredients
      JOIN restaurants ON restaurants.id = ingredients.restaurant_id
      WHERE ingredients.id = stock_movements.ingredient_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Usuários podem criar movimentações (via triggers e manualmente)
DROP POLICY IF EXISTS "Users can create movements" ON stock_movements;
CREATE POLICY "Users can create movements"
  ON stock_movements FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM ingredients
      JOIN restaurants ON restaurants.id = ingredients.restaurant_id
      WHERE ingredients.id = stock_movements.ingredient_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS RLS - ALERTS
-- ============================================

-- Usuários podem ver alertas dos seus restaurantes
DROP POLICY IF EXISTS "Users can view alerts from own restaurants" ON alerts;
CREATE POLICY "Users can view alerts from own restaurants"
  ON alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = alerts.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Usuários podem atualizar alertas dos seus restaurantes (marcar como lido)
DROP POLICY IF EXISTS "Users can update alerts from own restaurants" ON alerts;
CREATE POLICY "Users can update alerts from own restaurants"
  ON alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = alerts.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Alertas são criados automaticamente via triggers (não precisa política INSERT)

-- ============================================
-- 7. DADOS INICIAIS (OPCIONAL)
-- ============================================

-- Comentário: Quando um usuário se cadastra, você pode criar um restaurante padrão
-- Isso pode ser feito via função ou no código da aplicação
-- Exemplo de função (opcional):
/*
CREATE OR REPLACE FUNCTION create_default_restaurant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO restaurants (name, owner_id)
  VALUES ('Meu Restaurante', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_restaurant();
*/

-- ============================================
-- FIM DO SCHEMA
-- ============================================

-- Para verificar se tudo foi criado corretamente:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;
