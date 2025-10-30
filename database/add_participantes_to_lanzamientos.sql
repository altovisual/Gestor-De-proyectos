-- Migración para agregar participantes a lanzamientos existentes
-- Ejecutar este script si ya tienes la tabla lanzamientos creada

-- Agregar columna participantes si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lanzamientos' 
        AND column_name = 'participantes'
    ) THEN
        ALTER TABLE lanzamientos ADD COLUMN participantes JSONB DEFAULT '[]';
        RAISE NOTICE 'Columna participantes agregada a la tabla lanzamientos';
    ELSE
        RAISE NOTICE 'La columna participantes ya existe en la tabla lanzamientos';
    END IF;
END $$;

-- Crear índice para participantes si no existe
CREATE INDEX IF NOT EXISTS idx_lanzamientos_participantes ON lanzamientos USING GIN (participantes);

-- Comentario sobre la estructura de participantes
COMMENT ON COLUMN lanzamientos.participantes IS 'Array JSON de participantes del lanzamiento con estructura: [{"id": "string", "nombre": "string", "email": "string", "rol": "string"}]';
