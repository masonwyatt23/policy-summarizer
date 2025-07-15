-- Drop existing session table and indexes if they exist
DROP INDEX IF EXISTS "IDX_session_expire";
DROP TABLE IF EXISTS user_sessions CASCADE;

-- Create session table with proper structure
CREATE TABLE user_sessions (
  sid varchar NOT NULL COLLATE "default",
  sess json NOT NULL,
  expire timestamp(6) NOT NULL,
  CONSTRAINT user_sessions_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
) WITH (OIDS=FALSE);

-- Create index on expire column
CREATE INDEX "IDX_session_expire" ON user_sessions (expire);
