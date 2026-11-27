-- PostgREST roles, as in form-backend-demo/postgres/init_data/99_init_postgrest.sql.
-- The password is a fixed value for the throwaway test database only.
CREATE ROLE web_anon NOINHERIT NOLOGIN;
CREATE ROLE formbackend NOINHERIT NOLOGIN;
CREATE ROLE authenticator LOGIN NOINHERIT NOCREATEDB NOCREATEROLE NOSUPERUSER PASSWORD 'authenticator';

GRANT USAGE ON SCHEMA sampledata TO formbackend;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA sampledata TO formbackend;
GRANT ALL ON ALL SEQUENCES IN SCHEMA sampledata TO formbackend;

GRANT USAGE ON SCHEMA sampledata TO web_anon;
GRANT SELECT ON ALL TABLES IN SCHEMA sampledata TO web_anon;

GRANT web_anon TO authenticator;
GRANT formbackend TO authenticator;
