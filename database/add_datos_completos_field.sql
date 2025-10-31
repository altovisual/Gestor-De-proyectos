-- Agregar campo datos_completos para conservar todos los datos de las publicaciones
ALTER TABLE publicaciones 
ADD COLUMN IF NOT EXISTS datos_completos JSONB DEFAULT '{}'::jsonb;

-- Crear índice para el campo JSONB
CREATE INDEX IF NOT EXISTS idx_publicaciones_datos_completos 
ON publicaciones USING GIN (datos_completos);

-- Verificar que se agregó correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'publicaciones' 
AND column_name = 'datos_completos';
