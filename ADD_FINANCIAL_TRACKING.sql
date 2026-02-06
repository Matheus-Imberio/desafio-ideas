-- Adiciona campo de preço nos itens da lista de compras
-- Execute este SQL no Supabase SQL Editor

-- Adiciona coluna price se não existir
ALTER TABLE shopping_list_items 
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2);

-- Comentário na coluna
COMMENT ON COLUMN shopping_list_items.price IS 'Preço pago pelo item (opcional)';

-- Cria tabela de transações financeiras
CREATE TABLE IF NOT EXISTS financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category TEXT, -- 'recipe_sale', 'shopping_list', 'other'
  reference_id UUID, -- ID da receita vendida ou lista de compras
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT positive_amount CHECK (amount > 0)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_restaurant ON financial_transactions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_reference ON financial_transactions(reference_id);

-- RLS para financial_transactions
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

-- Política para visualizar transações do próprio restaurante
DROP POLICY IF EXISTS "Users can view financial transactions from own restaurants" ON financial_transactions;
CREATE POLICY "Users can view financial transactions from own restaurants"
  ON financial_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = financial_transactions.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Política para criar transações no próprio restaurante
DROP POLICY IF EXISTS "Users can create financial transactions in own restaurants" ON financial_transactions;
CREATE POLICY "Users can create financial transactions in own restaurants"
  ON financial_transactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = financial_transactions.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Política para atualizar transações do próprio restaurante
DROP POLICY IF EXISTS "Users can update financial transactions in own restaurants" ON financial_transactions;
CREATE POLICY "Users can update financial transactions in own restaurants"
  ON financial_transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = financial_transactions.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- Política para deletar transações do próprio restaurante
DROP POLICY IF EXISTS "Users can delete financial transactions from own restaurants" ON financial_transactions;
CREATE POLICY "Users can delete financial transactions from own restaurants"
  ON financial_transactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = financial_transactions.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );
