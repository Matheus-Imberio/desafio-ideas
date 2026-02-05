-- ============================================
-- Diagnóstico e Correção de Problemas
-- ============================================
-- Execute este SQL no Supabase para diagnosticar problemas

-- 1. Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Verificar se há triggers problemáticos
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- 3. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Verificar se há funções que podem estar causando problema
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public';

-- 5. Verificar constraints da tabela restaurants
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.restaurants'::regclass;

-- ============================================
-- POSSÍVEL SOLUÇÃO: Remover trigger problemático
-- ============================================
-- Se houver um trigger tentando criar restaurante automaticamente e falhando:

-- Desabilitar temporariamente triggers (se existirem)
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================
-- VERIFICAR LOGS DE ERRO
-- ============================================
-- No Supabase Dashboard, vá em:
-- Logs → Postgres Logs
-- Procure por erros relacionados a criação de usuário
