-- Initialize OilField Database
-- This script runs automatically when the container is first created

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Try to enable PostGIS extension for geospatial data (optional)
-- Note: PostGIS is not available in pgvector/pgvector:pg16 base image
-- If needed, use postgis/postgis:16-3.4 image or install PostGIS manually
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS postgis;
    RAISE NOTICE 'PostGIS extension: enabled';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'PostGIS extension: not available (optional)';
END $$;

-- Verify extensions are installed
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';

-- Log success
DO $$
BEGIN
    RAISE NOTICE 'OilField database initialized successfully!';
    RAISE NOTICE 'pgvector extension: enabled';
END $$;
