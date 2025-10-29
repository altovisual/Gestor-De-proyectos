-- Tabla de tareas con sincronización en tiempo real
CREATE TABLE IF NOT EXISTS tareas (
  id TEXT PRIMARY KEY,
  actividad TEXT NOT NULL,
  descripcion TEXT,
  fecha_inicio TIMESTAMP NOT NULL,
  fecha_fin TIMESTAMP NOT NULL,
  responsable TEXT,
  participantes TEXT[], -- Array de emails de participantes
  estatus TEXT DEFAULT 'pendiente',
  progreso INTEGER DEFAULT 0,
  prioridad TEXT DEFAULT 'media',
  subtareas JSONB DEFAULT '[]'::jsonb,
  perspectiva TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by TEXT -- Email del usuario que hizo el último cambio
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_tareas_estatus ON tareas(estatus);
CREATE INDEX IF NOT EXISTS idx_tareas_participantes ON tareas USING GIN(participantes);
CREATE INDEX IF NOT EXISTS idx_tareas_fecha_fin ON tareas(fecha_fin);

-- Habilitar Row Level Security (RLS)
ALTER TABLE tareas ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer todas las tareas
CREATE POLICY "Todos pueden ver tareas"
  ON tareas FOR SELECT
  TO public
  USING (true);

-- Política: Todos pueden insertar tareas
CREATE POLICY "Todos pueden crear tareas"
  ON tareas FOR INSERT
  TO public
  WITH CHECK (true);

-- Política: Todos pueden actualizar tareas
CREATE POLICY "Todos pueden actualizar tareas"
  ON tareas FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Política: Todos pueden eliminar tareas
CREATE POLICY "Todos pueden eliminar tareas"
  ON tareas FOR DELETE
  TO public
  USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_tareas_updated_at ON tareas;
CREATE TRIGGER update_tareas_updated_at
  BEFORE UPDATE ON tareas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Realtime para esta tabla
ALTER PUBLICATION supabase_realtime ADD TABLE tareas;

-- Comentarios
COMMENT ON TABLE tareas IS 'Tareas del proyecto con sincronización en tiempo real';
COMMENT ON COLUMN tareas.participantes IS 'Array de emails de los participantes asignados';
COMMENT ON COLUMN tareas.updated_by IS 'Email del último usuario que modificó la tarea';
