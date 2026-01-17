-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  allows_multiple_execution boolean DEFAULT false,
  max_execution integer DEFAULT 1,
  requires_materials boolean DEFAULT false,
  config jsonb,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT activity_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  action character varying NOT NULL,
  table_name character varying,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address character varying,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.block_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  block_id uuid,
  activity_type_id uuid,
  kategori character varying,
  varietas character varying,
  target_bulan character varying NOT NULL,
  target_luasan numeric NOT NULL,
  execution_number integer DEFAULT 1,
  luas_dikerjakan numeric DEFAULT 0,
  luas_sisa numeric DEFAULT (target_luasan - luas_dikerjakan),
  persen_selesai numeric DEFAULT 
CASE
    WHEN (target_luasan > (0)::numeric) THEN round(((luas_dikerjakan / target_luasan) * (100)::numeric), 2)
    ELSE (0)::numeric
END,
  status character varying DEFAULT 'planned'::character varying CHECK (status::text = ANY (ARRAY['planned'::character varying, 'in_progress'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT block_activities_pkey PRIMARY KEY (id),
  CONSTRAINT block_activities_block_id_fkey FOREIGN KEY (block_id) REFERENCES public.blocks(id),
  CONSTRAINT block_activities_activity_type_id_fkey FOREIGN KEY (activity_type_id) REFERENCES public.activity_types(id)
);
CREATE TABLE public.blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  zone character varying NOT NULL,
  luas_total numeric NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  kategori text,
  varietas text,
  CONSTRAINT blocks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notification_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipient_email character varying NOT NULL,
  subject character varying NOT NULL,
  body text NOT NULL,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'sent'::character varying, 'failed'::character varying]::text[])),
  sent_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT notification_queue_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transaction_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid,
  block_activity_id uuid,
  luas_dikerjakan numeric NOT NULL CHECK (luas_dikerjakan > 0::numeric),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT transaction_blocks_pkey PRIMARY KEY (id),
  CONSTRAINT transaction_blocks_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id),
  CONSTRAINT transaction_blocks_block_activity_id_fkey FOREIGN KEY (block_activity_id) REFERENCES public.block_activities(id)
);
CREATE TABLE public.transaction_materials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid,
  material_name character varying NOT NULL,
  dosis_per_ha numeric NOT NULL,
  luasan_aplikasi numeric NOT NULL,
  total_kebutuhan numeric DEFAULT (dosis_per_ha * luasan_aplikasi),
  unit character varying DEFAULT 'liter'::character varying,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT transaction_materials_pkey PRIMARY KEY (id),
  CONSTRAINT transaction_materials_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id)
);
CREATE TABLE public.transaction_panen (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid,
  estimasi_ton numeric,
  actual_ton numeric,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT transaction_panen_pkey PRIMARY KEY (id),
  CONSTRAINT transaction_panen_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id)
);
CREATE TABLE public.transaction_tanam (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid,
  varietas character varying NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT transaction_tanam_pkey PRIMARY KEY (id),
  CONSTRAINT transaction_tanam_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id)
);
CREATE TABLE public.transaction_workers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_id uuid,
  worker_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT transaction_workers_pkey PRIMARY KEY (id),
  CONSTRAINT transaction_workers_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id),
  CONSTRAINT transaction_workers_worker_id_fkey FOREIGN KEY (worker_id) REFERENCES public.workers(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  transaction_code character varying NOT NULL UNIQUE,
  tanggal date NOT NULL,
  vendor_id uuid,
  activity_type_id uuid,
  jumlah_pekerja integer NOT NULL DEFAULT 0,
  kondisi character varying CHECK (kondisi::text = ANY (ARRAY['ringan'::character varying, 'sedang'::character varying, 'berat'::character varying]::text[])),
  catatan text,
  created_by uuid,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id),
  CONSTRAINT transactions_activity_type_id_fkey FOREIGN KEY (activity_type_id) REFERENCES public.activity_types(id),
  CONSTRAINT transactions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.user_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  activity_type_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_activities_pkey PRIMARY KEY (id),
  CONSTRAINT user_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_activities_activity_type_id_fkey FOREIGN KEY (activity_type_id) REFERENCES public.activity_types(id)
);
CREATE TABLE public.user_vendors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  vendor_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_vendors_pkey PRIMARY KEY (id),
  CONSTRAINT user_vendors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_vendors_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  full_name character varying NOT NULL,
  email character varying,
  phone character varying,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['admin'::character varying, 'section_head'::character varying, 'supervisor'::character varying, 'vendor'::character varying]::text[])),
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vendor_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid,
  activity_type_id uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT vendor_activities_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_activities_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id),
  CONSTRAINT vendor_activities_activity_type_id_fkey FOREIGN KEY (activity_type_id) REFERENCES public.activity_types(id)
);
CREATE TABLE public.vendors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  contact_person character varying,
  phone character varying,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT vendors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.workers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_id uuid,
  worker_code character varying NOT NULL,
  name character varying NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT workers_pkey PRIMARY KEY (id),
  CONSTRAINT workers_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.vendors(id)
);
