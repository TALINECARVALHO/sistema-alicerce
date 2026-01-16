-- Add suggested_brands column to catalog_items table
ALTER TABLE catalog_items 
ADD COLUMN IF NOT EXISTS suggested_brands text;

-- Comment on column
COMMENT ON COLUMN catalog_items.suggested_brands IS 'Lista de marcas sugeridas para o item (separadas por vírgula)';
