-- Adiciona campo supplier_id na tabela financial_transactions
-- Execute este SQL no Supabase SQL Editor

-- Adiciona coluna supplier_id se não existir
ALTER TABLE financial_transactions 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

-- Comentário na coluna
COMMENT ON COLUMN financial_transactions.supplier_id IS 'Fornecedor relacionado à transação (para compras)';

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_financial_transactions_supplier ON financial_transactions(supplier_id);
