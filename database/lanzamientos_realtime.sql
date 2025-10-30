-- Tabla de lanzamientos con sincronización en tiempo real
CREATE TABLE IF NOT EXISTS lanzamientos (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  artista TEXT,
  fecha_lanzamiento DATE NOT NULL,
  descripcion TEXT,
  acciones JSONB DEFAULT '[]',
  fecha_creacion TIMESTAMP DEFAULT NOW(),
  created_by TEXT,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by TEXT
);

-- Habilitar Row Level Security
ALTER TABLE lanzamientos ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a todos
CREATE POLICY "Permitir lectura a todos" ON lanzamientos
  FOR SELECT
  USING (true);

-- Política para permitir inserción a todos
CREATE POLICY "Permitir inserción a todos" ON lanzamientos
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir actualización a todos
CREATE POLICY "Permitir actualización a todos" ON lanzamientos
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política para permitir eliminación a todos
CREATE POLICY "Permitir eliminación a todos" ON lanzamientos
  FOR DELETE
  USING (true);

-- Habilitar Realtime para la tabla
ALTER PUBLICATION supabase_realtime ADD TABLE lanzamientos;

-- Índices para mejorar rendimiento
CREATE INDEX idx_lanzamientos_fecha ON lanzamientos(fecha_lanzamiento);
CREATE INDEX idx_lanzamientos_artista ON lanzamientos(artista);
CREATE INDEX idx_lanzamientos_created_at ON lanzamientos(fecha_creacion);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lanzamientos_updated_at
    BEFORE UPDATE ON lanzamientos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
