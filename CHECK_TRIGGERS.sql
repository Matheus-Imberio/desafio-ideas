-- ============================================
-- Verificar Triggers que Podem Estar Causando Problema
-- ============================================

-- 1. Verificar todos os triggers no schema auth (onde ficam os usuários)
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
ORDER BY event_object_table, trigger_name;

-- 2. Verificar triggers no schema public que podem estar relacionados
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND (trigger_name LIKE '%user%' OR trigger_name LIKE '%restaurant%' OR action_statement LIKE '%restaurant%')
ORDER BY event_object_table;

-- 3. Verificar se há função que tenta criar restaurante automaticamente
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%restaurant%' OR routine_name LIKE '%user%')
ORDER BY routine_name;

-- ============================================
-- SE ENCONTRAR TRIGGER PROBLEMÁTICO:
-- ============================================
-- Desabilitar temporariamente:
-- ALTER TABLE auth.users DISABLE TRIGGER nome_do_trigger;

-- Ou deletar se não for necessário:
-- DROP TRIGGER IF EXISTS nome_do_trigger ON auth.users;
