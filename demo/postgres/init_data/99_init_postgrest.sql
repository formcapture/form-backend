-- anonymous user for postgrest. This user will not have
-- any permission whatsoever, but will be able to connect.
create role web_anon nologin;

-- user for the formbackend. This user must have full access
-- to the tables and schemas the formbackend needs to interact with.
create role formbackend nologin;

grant all on schema "sampledata" to formbackend;
grant all privileges on all tables in schema "sampledata" to formbackend;
grant all on all sequences in schema "sampledata" to formbackend;

create role authenticator noinherit login password 'my_password';
grant web_anon to authenticator;
grant formbackend to authenticator;
