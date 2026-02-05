-- ============================================
-- Corrigir RLS para Alertas - Permitir Triggers Criarem
-- ============================================

-- 1. Atualizar a função para usar SECURITY DEFINER
-- Isso permite que a função rode com privilégios elevados e ignore RLS
ALTER FUNCTION check_and_create_alerts() SECURITY DEFINER;

-- 2. Criar política que permite inserção de alertas via trigger
-- (Triggers precisam de permissão especial)
DROP POLICY IF EXISTS "Allow trigger to create alerts" ON alerts;
CREATE POLICY "Allow trigger to create alerts"
ON alerts FOR INSERT
WITH CHECK (true);

-- 3. Verificar se funcionou
SELECT 
    routine_name,
    security_type
FROM information_schema.routines
WHERE routine_name = 'check_and_create_alerts'
AND routine_schema = 'public';

-- Deve retornar: security_type = 'DEFINER'
