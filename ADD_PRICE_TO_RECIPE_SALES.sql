-- Adiciona campo de preço na tabela recipe_sales
-- Execute este SQL no Supabase SQL Editor

-- Adiciona coluna price se não existir
ALTER TABLE recipe_sales 
ADD COLUMN IF NOT EXISTS price NUMERIC(10, 2);

-- Comentário na coluna
COMMENT ON COLUMN recipe_sales.price IS 'Preço de venda do prato (opcional)';
