-- Script para arreglar políticas RLS que están bloqueando

-- Eliminar todas las políticas existentes de la tabla tareas
DROP POLICY IF EXISTS "Todos pueden ver tareas" ON tareas;
DROP POLICY IF EXISTS "Todos pueden crear tareas" ON tareas;
DROP POLICY IF EXISTS "Todos pueden actualizar tareas" ON tareas;
DROP POLICY IF EXISTS "Todos pueden eliminar tareas" ON tareas;

-- Eliminar todas las políticas existentes de la tabla participantes
DROP POLICY IF EXISTS "Todos pueden ver participantes" ON participantes;
DROP POLICY IF EXISTS "Todos pueden crear participantes" ON participantes;
DROP POLICY IF EXISTS "Todos pueden actualizar participantes" ON participantes;
DROP POLICY IF EXISTS "Todos pueden eliminar participantes" ON participantes;

-- Recrear políticas para tareas (acceso total público)
CREATE POLICY "Todos pueden ver tareas"
  ON tareas FOR SELECT
  USING (true);

CREATE POLICY "Todos pueden crear tareas"
  ON tareas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos pueden actualizar tareas"
  ON tareas FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Todos pueden eliminar tareas"
  ON tareas FOR DELETE
  USING (true);

-- Recrear políticas para participantes (acceso total público)
CREATE POLICY "Todos pueden ver participantes"
  ON participantes FOR SELECT
  USING (true);

CREATE POLICY "Todos pueden crear participantes"
  ON participantes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos pueden actualizar participantes"
  ON participantes FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Todos pueden eliminar participantes"
  ON participantes FOR DELETE
  USING (true);
