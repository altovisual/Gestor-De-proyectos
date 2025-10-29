-- Tabla para almacenar tokens de actualización de progreso desde emails
CREATE TABLE IF NOT EXISTS progress_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  task_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  participant_email TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('increase_25', 'complete')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_progress_tokens_token ON progress_tokens(token);
CREATE INDEX IF NOT EXISTS idx_progress_tokens_task_id ON progress_tokens(task_id);
CREATE INDEX IF NOT EXISTS idx_progress_tokens_expires_at ON progress_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_progress_tokens_used ON progress_tokens(used);

-- Tabla para el historial de actualizaciones de progreso
CREATE TABLE IF NOT EXISTS progress_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  participant_email TEXT NOT NULL,
  old_progress INTEGER NOT NULL,
  new_progress INTEGER NOT NULL,
  action TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('email', 'web', 'api')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para el historial
CREATE INDEX IF NOT EXISTS idx_progress_history_task_id ON progress_history(task_id);
CREATE INDEX IF NOT EXISTS idx_progress_history_created_at ON progress_history(created_at DESC);

-- Tabla para almacenar IDs de eventos de Google Calendar asociados a tareas
CREATE TABLE IF NOT EXISTS task_calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  calendar_event_id TEXT NOT NULL,
  participant_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, participant_email)
);

-- Índices para eventos de calendario
CREATE INDEX IF NOT EXISTS idx_task_calendar_events_task_id ON task_calendar_events(task_id);
CREATE INDEX IF NOT EXISTS idx_task_calendar_events_calendar_event_id ON task_calendar_events(calendar_event_id);

-- Función para limpiar tokens expirados automáticamente
CREATE OR REPLACE FUNCTION clean_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM progress_tokens
  WHERE expires_at < NOW() AND used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE progress_tokens IS 'Tokens de un solo uso para actualizar el progreso de tareas desde emails';
COMMENT ON TABLE progress_history IS 'Historial de todas las actualizaciones de progreso realizadas';
COMMENT ON TABLE task_calendar_events IS 'Relación entre tareas y eventos de Google Calendar';

COMMENT ON COLUMN progress_tokens.token IS 'Token único UUID para identificar la acción';
COMMENT ON COLUMN progress_tokens.action IS 'Acción a realizar: increase_25 (aumentar 25%) o complete (marcar como completada)';
COMMENT ON COLUMN progress_tokens.used IS 'Indica si el token ya fue utilizado';
COMMENT ON COLUMN progress_tokens.expires_at IS 'Fecha de expiración del token (30 días desde creación)';

COMMENT ON COLUMN progress_history.source IS 'Origen de la actualización: email, web o api';
COMMENT ON COLUMN progress_history.action IS 'Acción que se realizó';

-- Habilitar Row Level Security (RLS)
ALTER TABLE progress_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_calendar_events ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para progress_tokens
-- Permitir lectura de tokens no usados y no expirados
CREATE POLICY "Tokens can be read by anyone with the token"
  ON progress_tokens FOR SELECT
  USING (used = FALSE AND expires_at > NOW());

-- Permitir inserción de nuevos tokens
CREATE POLICY "Tokens can be created by authenticated users"
  ON progress_tokens FOR INSERT
  WITH CHECK (true);

-- Permitir actualización solo para marcar como usado
CREATE POLICY "Tokens can be updated to mark as used"
  ON progress_tokens FOR UPDATE
  USING (true)
  WITH CHECK (used = TRUE);

-- Políticas de seguridad para progress_history
-- Permitir lectura del historial
CREATE POLICY "History can be read by authenticated users"
  ON progress_history FOR SELECT
  USING (true);

-- Permitir inserción en el historial
CREATE POLICY "History can be created"
  ON progress_history FOR INSERT
  WITH CHECK (true);

-- Políticas de seguridad para task_calendar_events
-- Permitir todas las operaciones
CREATE POLICY "Calendar events can be managed"
  ON task_calendar_events FOR ALL
  USING (true)
  WITH CHECK (true);
