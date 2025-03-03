SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA sampledata;


ALTER SCHEMA sampledata OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

CREATE TABLE sampledata.contacts (
    id integer NOT NULL,
    name character varying,
    phone character varying,
    picture character varying
);


ALTER TABLE sampledata.contacts OWNER TO postgres;

CREATE TABLE sampledata.fountain_types (
    id integer NOT NULL,
    type character varying
);


ALTER TABLE sampledata.fountain_types OWNER TO postgres;
CREATE SEQUENCE sampledata.fountain_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE sampledata.fountain_types_id_seq OWNER TO postgres;
ALTER TABLE ONLY sampledata.fountain_types ALTER COLUMN id SET DEFAULT nextval('sampledata.fountain_types_id_seq'::regclass);

CREATE TABLE sampledata.fountains (
    id integer NOT NULL,
    name character varying,
    type integer
);


ALTER TABLE sampledata.fountains OWNER TO postgres;

CREATE SEQUENCE sampledata.fountains_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE sampledata.fountains_id_seq OWNER TO postgres;

ALTER SEQUENCE sampledata.fountains_id_seq OWNED BY sampledata.fountains.id;

ALTER TABLE ONLY sampledata.fountains ALTER COLUMN id SET DEFAULT nextval('sampledata.fountains_id_seq'::regclass);


CREATE TABLE sampledata.fountains_pictures (
  id integer not null,
  img_path varchar,
  fountain_id integer
);

ALTER TABLE sampledata.fountains_pictures OWNER TO postgres;

CREATE SEQUENCE sampledata.fountains_pictures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE sampledata.fountains_pictures_id_seq OWNER TO postgres;
ALTER TABLE ONLY sampledata.fountains_pictures ALTER COLUMN id SET DEFAULT nextval('sampledata.fountains_pictures_id_seq'::regclass);

ALTER TABLE ONLY sampledata.fountains_pictures
    ADD CONSTRAINT fountains_pictures_pk PRIMARY KEY (id);

CREATE TABLE sampledata.fountains_contacts (
    fountain_id integer not null,
    contact_id integer not null
);


ALTER TABLE sampledata.fountains_contacts OWNER TO postgres;

COPY sampledata.contacts (id, name, phone) FROM stdin;
1	Schmidt	123456789
2	Müller	987654321
3	Meyer	123123123
\.

CREATE SEQUENCE sampledata.contacts_id_seq
    AS integer
    START WITH 4
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE sampledata.contacts_id_seq OWNER TO postgres;
ALTER SEQUENCE sampledata.contacts_id_seq OWNED BY sampledata.contacts.id;
ALTER TABLE ONLY sampledata.contacts ALTER COLUMN id SET DEFAULT nextval('sampledata.contacts_id_seq'::regclass);

COPY sampledata.fountain_types (id, type) FROM stdin;
1	Tiefbrunnen
2	Springbrunnen
3	Trinkwasserbrunnen
\.

SELECT setval('sampledata.fountain_types_id_seq', 4, true);

COPY sampledata.fountains (id, name, type) FROM stdin;
1	Rathausbrunnen	1
2	Marktbrunnen	1
3	Obstbrunnen	2
\.

SELECT setval('sampledata.fountains_id_seq', 3, true);

COPY sampledata.fountains_contacts (fountain_id, contact_id) FROM stdin;
1	1
2	1
1	2
3	3
3	1
\.


ALTER TABLE ONLY sampledata.fountain_types
    ADD CONSTRAINT fountain_types_pk PRIMARY KEY (id);


ALTER TABLE ONLY sampledata.fountains_contacts
    ADD CONSTRAINT fountains_contacts_pk PRIMARY KEY (fountain_id, contact_id);


ALTER TABLE ONLY sampledata.fountains_contacts
    ADD CONSTRAINT fountains_contacts_un UNIQUE (fountain_id, contact_id);


ALTER TABLE ONLY sampledata.contacts
    ADD CONSTRAINT species_pk PRIMARY KEY (id);


ALTER TABLE ONLY sampledata.fountains
    ADD CONSTRAINT tree_pk PRIMARY KEY (id);


ALTER TABLE ONLY sampledata.fountains_contacts
    ADD CONSTRAINT fountains_contacts_fk FOREIGN KEY (fountain_id) REFERENCES sampledata.fountains(id);


ALTER TABLE ONLY sampledata.fountains_contacts
    ADD CONSTRAINT fountains_contacts_fk_1 FOREIGN KEY (contact_id) REFERENCES sampledata.contacts(id);


ALTER TABLE ONLY sampledata.fountains
    ADD CONSTRAINT fountains_fk FOREIGN KEY (type) REFERENCES sampledata.fountain_types(id);

ALTER TABLE ONLY sampledata.fountains_pictures
    ADD CONSTRAINT fountains_pictures_fk FOREIGN KEY (fountain_id) REFERENCES sampledata.fountains(id);


CREATE TABLE sampledata.inspections (
    id integer NOT NULL,
    title character varying,
    description character varying,
    fountain_id integer
);

ALTER TABLE sampledata.inspections OWNER TO postgres;

COPY sampledata.inspections (id, title, description, fountain_id) FROM stdin;
1	Erstbegehung	Erstbegehung des Brunnens	1
2	Nachprüfung	Alle Mängel behoben	1
\.

ALTER TABLE ONLY sampledata.inspections
    ADD CONSTRAINT inspections_pk PRIMARY KEY (id);

ALTER TABLE ONLY sampledata.inspections
    ADD CONSTRAINT fountains_fk_1 FOREIGN KEY (fountain_id) REFERENCES sampledata.fountains(id);

CREATE SEQUENCE sampledata.inspections_id_seq
    AS integer
    START WITH 3
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE sampledata.inspections_id_seq OWNER TO postgres;
ALTER SEQUENCE sampledata.inspections_id_seq OWNED BY sampledata.inspections.id;
ALTER TABLE ONLY sampledata.inspections ALTER COLUMN id SET DEFAULT nextval('sampledata.inspections_id_seq'::regclass);


CREATE TABLE sampledata.inspections_contacts (
    inspection_id integer not null,
    contact_id integer not null
);

ALTER TABLE sampledata.inspections_contacts OWNER TO postgres;

ALTER TABLE ONLY sampledata.inspections_contacts
    ADD CONSTRAINT inspections_contacts_pk PRIMARY KEY (inspection_id, contact_id);

ALTER TABLE ONLY sampledata.inspections_contacts
    ADD CONSTRAINT inspections_contacts_un UNIQUE (inspection_id, contact_id);

ALTER TABLE ONLY sampledata.inspections_contacts
    ADD CONSTRAINT inspections_contacts_fk FOREIGN KEY (inspection_id) REFERENCES sampledata.inspections(id);

ALTER TABLE ONLY sampledata.inspections_contacts
    ADD CONSTRAINT inspections_contacts_fk_1 FOREIGN KEY (contact_id) REFERENCES sampledata.contacts(id);
