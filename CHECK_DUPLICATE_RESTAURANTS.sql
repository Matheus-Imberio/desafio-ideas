-- ============================================
-- Verificar Restaurantes Duplicados
-- ============================================

-- Verificar se há múltiplos restaurantes para o mesmo usuário
SELECT 
    owner_id,
    COUNT(*) as total_restaurants,
    array_agg(id) as restaurant_ids,
    array_agg(name) as restaurant_names
FROM restaurants
GROUP BY owner_id
HAVING COUNT(*) > 1;

-- Se houver duplicados, você pode:
-- 1. Manter apenas o primeiro (mais antigo)
-- 2. Ou deletar os duplicados

-- Para manter apenas o primeiro de cada usuário:
/*
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
*/

-- Verificar todos os restaurantes
SELECT id, name, owner_id, created_at 
FROM restaurants 
ORDER BY owner_id, created_at;
