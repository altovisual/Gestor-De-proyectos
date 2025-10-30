-- Script para verificar si la columna participantes existe
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'lanzamientos' 
ORDER BY ordinal_position;

-- Verificar datos existentes
SELECT 
    id, 
    nombre, 
    participantes,
    CASE 
        WHEN participantes IS NULL THEN 'NULL'
        WHEN participantes = '[]'::jsonb THEN 'EMPTY ARRAY'
        ELSE 'HAS DATA'
    END as participantes_status
FROM lanzamientos 
ORDER BY fecha_creacion DESC 
LIMIT 5;
