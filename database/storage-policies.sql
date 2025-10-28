-- ============================================
-- POLÍTICAS DE STORAGE PARA BUCKET "referencias"
-- ============================================
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================

-- 1. Política para SUBIR archivos (INSERT)
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'referencias'
);

-- 2. Política para LEER archivos (SELECT)
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'referencias'
);

-- 3. Política para ACTUALIZAR archivos (UPDATE)
CREATE POLICY "Allow public updates"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'referencias'
)
WITH CHECK (
  bucket_id = 'referencias'
);

-- 4. Política para ELIMINAR archivos (DELETE)
CREATE POLICY "Allow public deletes"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'referencias'
);

-- ============================================
-- VERIFICAR POLÍTICAS CREADAS
-- ============================================
-- Ejecuta esta query para verificar:
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
