-- Script para limpiar emails de participantes que tienen @temp.com duplicado
-- Ejecutar en Supabase SQL Editor

-- Ver participantes con emails malformados
SELECT id, nombre, email 
FROM participantes 
WHERE email LIKE '%@gmail.com@temp.com' 
   OR email LIKE '%@hotmail.com@temp.com'
   OR email LIKE '%@yahoo.com@temp.com'
   OR email LIKE '%@outlook.com@temp.com';

-- Limpiar emails malformados
UPDATE participantes 
SET email = REPLACE(email, '@temp.com', '')
WHERE email LIKE '%@gmail.com@temp.com' 
   OR email LIKE '%@hotmail.com@temp.com'
   OR email LIKE '%@yahoo.com@temp.com'
   OR email LIKE '%@outlook.com@temp.com';

-- Verificar que se limpiaron correctamente
SELECT id, nombre, email 
FROM participantes 
WHERE email LIKE '%@temp.com'
ORDER BY nombre;
