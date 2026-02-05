-- ============================================
-- Limpar Restaurantes Duplicados
-- ============================================
-- Mantém apenas o primeiro restaurante (mais antigo) de cada usuário

-- 1. VERIFICAR ANTES DE DELETAR (execute primeiro para ver o que será deletado)
SELECT 
    r.id,
    r.name,
    r.owner_id,
    r.created_at,
    ROW_NUMBER() OVER (PARTITION BY r.owner_id ORDER BY r.created_at ASC) as rn
FROM restaurants r
ORDER BY r.owner_id, r.created_at;

-- 2. DELETAR DUPLICADOS (mantém apenas o primeiro de cada usuário)
-- ATENÇÃO: Isso vai deletar restaurantes duplicados!
-- Execute o SELECT acima primeiro para verificar

WITH ranked_restaurants AS (
    SELECT 
        id,
        owner_id,
        ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at ASC) as rn
    FROM restaurants
)
DELETE FROM restaurants
WHERE id IN (
    SELECT id FROM ranked_restaurants WHERE rn > 1
);

-- 3. VERIFICAR RESULTADO (deve mostrar apenas 1 restaurante por usuário)
SELECT 
    owner_id,
    COUNT(*) as total_restaurants
FROM restaurants
GROUP BY owner_id;

-- Deve retornar apenas 1 para cada owner_id
