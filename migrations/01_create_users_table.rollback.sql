DROP INDEX IF EXISTS idx_users_workspace_id;
DROP INDEX IF EXISTS idx_users_email;

DROP TABLE IF EXISTS users;

DROP EXTENSION IF EXISTS "uuid-ossp";
