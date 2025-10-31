-- Script para eliminar la publicación problemática
-- Ejecuta este script en Supabase SQL Editor

-- Primero, ver qué publicaciones existen
SELECT * FROM publicaciones;

-- Eliminar todas las publicaciones (si solo hay una problemática)
DELETE FROM publicaciones;

-- Verificar que se eliminó
SELECT COUNT(*) as total_publicaciones FROM publicaciones;
