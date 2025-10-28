-- Esquema de Base de Datos para Proyecto Dayan
-- Ejecutar este script en Supabase SQL Editor

-- Tabla de Tareas
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  perspectiva TEXT NOT NULL,
  actividad TEXT NOT NULL,
  descripcion TEXT,
  responsable TEXT,
  participantes JSONB DEFAULT '[]'::jsonb,
  fecha_inicio DATE,
  fecha_fin DATE,
  estatus TEXT DEFAULT 'pendiente' CHECK (estatus IN ('pendiente', 'en-progreso', 'completado')),
  prioridad TEXT DEFAULT 'media' CHECK (prioridad IN ('alta', 'media', 'baja')),
  subtareas JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Participantes Globales
CREATE TABLE IF NOT EXISTS global_participants (
  id SERIAL PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Perspectivas Personalizadas
CREATE TABLE IF NOT EXISTS custom_perspectives (
  id SERIAL PRIMARY KEY,
  nombre TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_tasks_perspectiva ON tasks(perspectiva);
CREATE INDEX IF NOT EXISTS idx_tasks_estatus ON tasks(estatus);
CREATE INDEX IF NOT EXISTS idx_tasks_prioridad ON tasks(prioridad);
CREATE INDEX IF NOT EXISTS idx_tasks_responsable ON tasks(responsable);
CREATE INDEX IF NOT EXISTS idx_tasks_fecha_inicio ON tasks(fecha_inicio);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at en tasks
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_perspectives ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (permitir lectura y escritura a todos por ahora)
-- IMPORTANTE: En producción, deberías configurar autenticación y políticas más restrictivas

-- Políticas para tasks
DROP POLICY IF EXISTS "Enable read access for all users" ON tasks;
CREATE POLICY "Enable read access for all users" ON tasks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON tasks;
CREATE POLICY "Enable insert for all users" ON tasks
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON tasks;
CREATE POLICY "Enable update for all users" ON tasks
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON tasks;
CREATE POLICY "Enable delete for all users" ON tasks
  FOR DELETE USING (true);

-- Políticas para global_participants
DROP POLICY IF EXISTS "Enable read access for all users" ON global_participants;
CREATE POLICY "Enable read access for all users" ON global_participants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON global_participants;
CREATE POLICY "Enable insert for all users" ON global_participants
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON global_participants;
CREATE POLICY "Enable update for all users" ON global_participants
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON global_participants;
CREATE POLICY "Enable delete for all users" ON global_participants
  FOR DELETE USING (true);

-- Políticas para custom_perspectives
DROP POLICY IF EXISTS "Enable read access for all users" ON custom_perspectives;
CREATE POLICY "Enable read access for all users" ON custom_perspectives
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON custom_perspectives;
CREATE POLICY "Enable insert for all users" ON custom_perspectives
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON custom_perspectives;
CREATE POLICY "Enable update for all users" ON custom_perspectives
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete for all users" ON custom_perspectives;
CREATE POLICY "Enable delete for all users" ON custom_perspectives
  FOR DELETE USING (true);

-- Comentarios para documentación
COMMENT ON TABLE tasks IS 'Tabla principal de tareas del proyecto';
COMMENT ON TABLE global_participants IS 'Participantes globales del proyecto';
COMMENT ON TABLE custom_perspectives IS 'Perspectivas personalizadas creadas por los usuarios';

COMMENT ON COLUMN tasks.participantes IS 'Array JSON de nombres de participantes';
COMMENT ON COLUMN tasks.subtareas IS 'Array JSON de subtareas con estructura {id, nombre, completada}';
