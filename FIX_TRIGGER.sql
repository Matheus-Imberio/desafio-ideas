-- ============================================
-- Remover Trigger Problemático
-- ============================================

-- 1. Verificar a função associada ao trigger
SELECT 
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_trigger t ON t.tgfoid = p.oid
WHERE t.tgname = 'on_auth_user_created';

-- 2. Remover o trigger (se estiver causando problema)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Remover a função (opcional, se não for mais necessária)
DROP FUNCTION IF EXISTS create_default_restaurant();

-- ============================================
-- Verificar se foi removido
-- ============================================
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Se não retornar nada, o trigger foi removido com sucesso!
