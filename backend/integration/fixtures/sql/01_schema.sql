-- Test data for the integration tests, trimmed from form-backend-demo/postgres/init_data/01_init_sampledata.sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE SCHEMA sampledata;

CREATE TABLE sampledata.fountain_types (
    id serial PRIMARY KEY,
    type character varying
);

CREATE TABLE sampledata.fountains (
    id serial PRIMARY KEY,
    name character varying,
    type integer REFERENCES sampledata.fountain_types(id) ON DELETE SET NULL,
    geom geometry(Point, 4326)
);

CREATE TABLE sampledata.contacts (
    id serial PRIMARY KEY,
    name character varying,
    phone character varying
);

CREATE TABLE sampledata.fountains_contacts (
    fountain_id integer NOT NULL REFERENCES sampledata.fountains(id) ON DELETE CASCADE,
    contact_id integer NOT NULL REFERENCES sampledata.contacts(id) ON DELETE CASCADE,
    PRIMARY KEY (fountain_id, contact_id)
);

CREATE TABLE sampledata.fountains_pictures (
    id serial PRIMARY KEY,
    img_path character varying,
    fountain_id integer REFERENCES sampledata.fountains(id) ON DELETE CASCADE
);

-- the form-backend updates this table on startup to check its connection
CREATE TABLE sampledata.__form_backend_healthcheck (
    id serial PRIMARY KEY,
    last_start timestamp without time zone
);
INSERT INTO sampledata.__form_backend_healthcheck (id, last_start) VALUES (1, '1970-01-01');

INSERT INTO sampledata.fountain_types (type) VALUES
    ('Tiefbrunnen'),
    ('Springbrunnen'),
    ('Trinkwasserbrunnen');

-- 12 fountains with alternating types; ids 1-12
INSERT INTO sampledata.fountains (name, type, geom)
SELECT
    'Brunnen ' || lpad(i::text, 2, '0'),
    (i % 2) + 1,
    ST_SetSRID(ST_MakePoint(7.0 + i / 100.0, 50.7), 4326)
FROM generate_series(1, 12) AS i;

INSERT INTO sampledata.contacts (name, phone) VALUES
    ('Schmidt', '123456789'),
    ('Müller', '987654321'),
    ('Meyer', '123123123');

INSERT INTO sampledata.fountains_contacts (fountain_id, contact_id) VALUES
    (1, 1),
    (1, 2),
    (2, 3);
