--
-- PostgreSQL database dump
--

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg12+1)
-- Dumped by pg_dump version 16.0

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

--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: oilfield
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$;


ALTER FUNCTION public.update_timestamp() OWNER TO oilfield;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: oilfield
--

CREATE TABLE public.knex_migrations (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


ALTER TABLE public.knex_migrations OWNER TO oilfield;

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: oilfield
--

CREATE SEQUENCE public.knex_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knex_migrations_id_seq OWNER TO oilfield;

--
-- Name: knex_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oilfield
--

ALTER SEQUENCE public.knex_migrations_id_seq OWNED BY public.knex_migrations.id;


--
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: oilfield
--

CREATE TABLE public.knex_migrations_lock (
    index integer NOT NULL,
    is_locked integer
);


ALTER TABLE public.knex_migrations_lock OWNER TO oilfield;

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE; Schema: public; Owner: oilfield
--

CREATE SEQUENCE public.knex_migrations_lock_index_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNER TO oilfield;

--
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: oilfield
--

ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNED BY public.knex_migrations_lock.index;


--
-- Name: operators; Type: TABLE; Schema: public; Owner: oilfield
--

CREATE TABLE public.operators (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    operator_number text,
    address text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.operators OWNER TO oilfield;

--
-- Name: production_history; Type: TABLE; Schema: public; Owner: oilfield
--

CREATE TABLE public.production_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    well_id uuid NOT NULL,
    date date NOT NULL,
    oil_bbl numeric(12,2),
    gas_mcf numeric(12,2),
    water_bbl numeric(12,2),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.production_history OWNER TO oilfield;

--
-- Name: valuations; Type: TABLE; Schema: public; Owner: oilfield
--

CREATE TABLE public.valuations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    well_id uuid NOT NULL,
    npv_usd numeric(15,2),
    market_value_usd numeric(15,2),
    discount_pct numeric(5,2),
    confidence numeric(3,2),
    remaining_reserves_bbl numeric(15,2),
    calculated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    oil_price_usd numeric(8,2) DEFAULT '75'::numeric,
    operating_cost_per_bbl numeric(8,2) DEFAULT '15'::numeric,
    discount_rate numeric(5,4) DEFAULT 0.1,
    royalty_rate numeric(5,4) DEFAULT 0.2,
    valuation_date date DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.valuations OWNER TO oilfield;

--
-- Name: well_narratives; Type: TABLE; Schema: public; Owner: oilfield
--

CREATE TABLE public.well_narratives (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    well_id uuid NOT NULL,
    narrative text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.well_narratives OWNER TO oilfield;

--
-- Name: wells; Type: TABLE; Schema: public; Owner: oilfield
--

CREATE TABLE public.wells (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    well_id text NOT NULL,
    well_name text NOT NULL,
    api_number text,
    operator_id uuid,
    latitude numeric(10,8),
    longitude numeric(11,8),
    county text,
    field text,
    state text DEFAULT 'TX'::text,
    status text DEFAULT 'active'::text,
    depth_ft integer,
    completion_date date,
    embedding public.vector(384),
    embedding_model text DEFAULT 'all-MiniLM-L6-v2'::text,
    description text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.wells OWNER TO oilfield;

--
-- Name: knex_migrations id; Type: DEFAULT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.knex_migrations ALTER COLUMN id SET DEFAULT nextval('public.knex_migrations_id_seq'::regclass);


--
-- Name: knex_migrations_lock index; Type: DEFAULT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.knex_migrations_lock ALTER COLUMN index SET DEFAULT nextval('public.knex_migrations_lock_index_seq'::regclass);


--
-- Name: knex_migrations_lock knex_migrations_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.knex_migrations_lock
    ADD CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index);


--
-- Name: knex_migrations knex_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);


--
-- Name: operators operators_name_unique; Type: CONSTRAINT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.operators
    ADD CONSTRAINT operators_name_unique UNIQUE (name);


--
-- Name: operators operators_pkey; Type: CONSTRAINT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.operators
    ADD CONSTRAINT operators_pkey PRIMARY KEY (id);


--
-- Name: production_history production_history_pkey; Type: CONSTRAINT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.production_history
    ADD CONSTRAINT production_history_pkey PRIMARY KEY (id);


--
-- Name: production_history production_history_well_id_date_unique; Type: CONSTRAINT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.production_history
    ADD CONSTRAINT production_history_well_id_date_unique UNIQUE (well_id, date);


--
-- Name: valuations valuations_pkey; Type: CONSTRAINT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.valuations
    ADD CONSTRAINT valuations_pkey PRIMARY KEY (id);


--
-- Name: valuations valuations_well_id_unique; Type: CONSTRAINT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.valuations
    ADD CONSTRAINT valuations_well_id_unique UNIQUE (well_id);


--
-- Name: well_narratives well_narratives_pkey; Type: CONSTRAINT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.well_narratives
    ADD CONSTRAINT well_narratives_pkey PRIMARY KEY (id);


--
-- Name: wells wells_api_number_unique; Type: CONSTRAINT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.wells
    ADD CONSTRAINT wells_api_number_unique UNIQUE (api_number);


--
-- Name: wells wells_pkey; Type: CONSTRAINT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.wells
    ADD CONSTRAINT wells_pkey PRIMARY KEY (id);


--
-- Name: wells wells_well_id_unique; Type: CONSTRAINT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.wells
    ADD CONSTRAINT wells_well_id_unique UNIQUE (well_id);


--
-- Name: idx_production_well_date; Type: INDEX; Schema: public; Owner: oilfield
--

CREATE INDEX idx_production_well_date ON public.production_history USING btree (well_id, date DESC);


--
-- Name: idx_wells_county; Type: INDEX; Schema: public; Owner: oilfield
--

CREATE INDEX idx_wells_county ON public.wells USING btree (county);


--
-- Name: idx_wells_embedding; Type: INDEX; Schema: public; Owner: oilfield
--

CREATE INDEX idx_wells_embedding ON public.wells USING hnsw (embedding public.vector_cosine_ops);


--
-- Name: idx_wells_operator; Type: INDEX; Schema: public; Owner: oilfield
--

CREATE INDEX idx_wells_operator ON public.wells USING btree (operator_id);


--
-- Name: idx_wells_status; Type: INDEX; Schema: public; Owner: oilfield
--

CREATE INDEX idx_wells_status ON public.wells USING btree (status);


--
-- Name: well_narratives_created_at_index; Type: INDEX; Schema: public; Owner: oilfield
--

CREATE INDEX well_narratives_created_at_index ON public.well_narratives USING btree (created_at);


--
-- Name: well_narratives_well_id_index; Type: INDEX; Schema: public; Owner: oilfield
--

CREATE INDEX well_narratives_well_id_index ON public.well_narratives USING btree (well_id);


--
-- Name: operators operators_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: oilfield
--

CREATE TRIGGER operators_updated_at_trigger BEFORE UPDATE ON public.operators FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: production_history production_history_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: oilfield
--

CREATE TRIGGER production_history_updated_at_trigger BEFORE UPDATE ON public.production_history FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: valuations valuations_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: oilfield
--

CREATE TRIGGER valuations_updated_at_trigger BEFORE UPDATE ON public.valuations FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: well_narratives well_narratives_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: oilfield
--

CREATE TRIGGER well_narratives_updated_at_trigger BEFORE UPDATE ON public.well_narratives FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: wells wells_updated_at_trigger; Type: TRIGGER; Schema: public; Owner: oilfield
--

CREATE TRIGGER wells_updated_at_trigger BEFORE UPDATE ON public.wells FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: production_history production_history_well_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.production_history
    ADD CONSTRAINT production_history_well_id_foreign FOREIGN KEY (well_id) REFERENCES public.wells(id) ON DELETE CASCADE;


--
-- Name: valuations valuations_well_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.valuations
    ADD CONSTRAINT valuations_well_id_foreign FOREIGN KEY (well_id) REFERENCES public.wells(id) ON DELETE CASCADE;


--
-- Name: well_narratives well_narratives_well_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.well_narratives
    ADD CONSTRAINT well_narratives_well_id_foreign FOREIGN KEY (well_id) REFERENCES public.wells(id) ON DELETE CASCADE;


--
-- Name: wells wells_operator_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: oilfield
--

ALTER TABLE ONLY public.wells
    ADD CONSTRAINT wells_operator_id_foreign FOREIGN KEY (operator_id) REFERENCES public.operators(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

