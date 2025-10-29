-- Tabla de participantes con sincronización en tiempo real
CREATE TABLE IF NOT EXISTS participantes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  rol TEXT DEFAULT 'miembro',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT -- Email del usuario que agregó al participante
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_participantes_email ON participantes(email);
CREATE INDEX IF NOT EXISTS idx_participantes_nombre ON participantes(nombre);

-- Habilitar Row Level Security (RLS)
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (acceso público por ahora)
CREATE POLICY "Todos pueden ver participantes" ON participantes
  FOR SELECT USING (true);

CREATE POLICY "Todos pueden crear participantes" ON participantes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos pueden actualizar participantes" ON participantes
  FOR UPDATE USING (true);

CREATE POLICY "Todos pueden eliminar participantes" ON participantes
  FOR DELETE USING (true);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_participantes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS participantes_updated_at ON participantes;
CREATE TRIGGER participantes_updated_at
  BEFORE UPDATE ON participantes
  FOR EACH ROW
  EXECUTE FUNCTION update_participantes_updated_at();

-- Habilitar Realtime para la tabla
ALTER PUBLICATION supabase_realtime ADD TABLE participantes;

-- Comentarios para documentación
COMMENT ON TABLE participantes IS 'Participantes del proyecto con sincronización en tiempo real';
COMMENT ON COLUMN participantes.id IS 'ID único del participante';
COMMENT ON COLUMN participantes.nombre IS 'Nombre completo del participante';
COMMENT ON COLUMN participantes.email IS 'Email del participante (único)';
COMMENT ON COLUMN participantes.rol IS 'Rol del participante (miembro, admin, etc.)';
COMMENT ON COLUMN participantes.avatar_url IS 'URL del avatar del participante';
