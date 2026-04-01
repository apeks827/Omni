-- Add search_vector column for full-text search
ALTER TABLE tasks ADD COLUMN search_vector tsvector;

-- Create trigger function to automatically update search_vector
CREATE OR REPLACE FUNCTION tasks_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER tasks_search_vector_trigger
BEFORE INSERT OR UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION tasks_search_vector_update();

-- Create GIN index on search_vector for fast full-text search
CREATE INDEX idx_tasks_search_vector ON tasks USING GIN(search_vector);

-- Populate search_vector for existing rows
UPDATE tasks SET search_vector = 
  setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B');

COMMENT ON COLUMN tasks.search_vector IS 'Full-text search vector with weighted title (A) and description (B)';
