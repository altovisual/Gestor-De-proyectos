-- Crear tabla de publicaciones para el calendario
CREATE TABLE IF NOT EXISTS publicaciones (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_publicacion DATE NOT NULL,
  hora_publicacion TIME,
  plataforma TEXT NOT NULL,
  tipo TEXT NOT NULL,
  estado TEXT DEFAULT 'pendiente',
  lanzamiento_id TEXT,
  participantes JSONB DEFAULT '[]'::jsonb,
  contenido TEXT DEFAULT '',
  hashtags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_publicaciones_fecha ON publicaciones(fecha_publicacion);
CREATE INDEX IF NOT EXISTS idx_publicaciones_plataforma ON publicaciones(plataforma);
CREATE INDEX IF NOT EXISTS idx_publicaciones_estado ON publicaciones(estado);
CREATE INDEX IF NOT EXISTS idx_publicaciones_lanzamiento ON publicaciones(lanzamiento_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE publicaciones ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir todas las operaciones (ajustar según necesidades de seguridad)
CREATE POLICY "Enable all operations for publicaciones" ON publicaciones
  FOR ALL USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_publicaciones_updated_at 
  BEFORE UPDATE ON publicaciones 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
