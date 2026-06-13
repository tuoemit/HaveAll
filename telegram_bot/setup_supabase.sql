-- ====================================================================
-- SUPABASE SCHEMA SETUP FOR PROXYHUB
-- Run this script in your Supabase SQL Editor (https://supabase.com)
-- ====================================================================

-- 1. Create Monitored Channels Table
CREATE TABLE IF NOT EXISTS public.monitored_channels (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.monitored_channels ENABLE ROW LEVEL SECURITY;

-- Create Public Access Policies to allow reading (drop first if exists to prevent errors)
DROP POLICY IF EXISTS "Allow Public Access to Monitored Channels" ON public.monitored_channels;
CREATE POLICY "Allow Public Access to Monitored Channels" 
ON public.monitored_channels FOR SELECT USING (true);

-- Create Policy to allow editing (for the bot with Service Role or Anon key override)
DROP POLICY IF EXISTS "Allow Anonymous Insert/Update/Delete" ON public.monitored_channels;
CREATE POLICY "Allow Anonymous Insert/Update/Delete" 
ON public.monitored_channels FOR ALL USING (true) WITH CHECK (true);


-- 2. Create Proxies Table
CREATE TABLE IF NOT EXISTS public.proxies (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    server TEXT NOT NULL,
    port INTEGER NOT NULL,
    secret TEXT NOT NULL,
    tg_link TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.proxies ENABLE ROW LEVEL SECURITY;

-- Create Public Access Policies to allow reading
DROP POLICY IF EXISTS "Allow Public Access to Proxies" ON public.proxies;
CREATE POLICY "Allow Public Access to Proxies" 
ON public.proxies FOR SELECT USING (true);

-- Create Policy to allow editing
DROP POLICY IF EXISTS "Allow All Actions on Proxies" ON public.proxies;
CREATE POLICY "Allow All Actions on Proxies" 
ON public.proxies FOR ALL USING (true) WITH CHECK (true);


-- 3. Create Configs Table (V2Ray, VLESS, VMess, Hysteria, Shadowsocks, etc.)
CREATE TABLE IF NOT EXISTS public.configs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type TEXT NOT NULL, -- 'vless', 'vmess', 'ss', 'trojan', 'hysteria', etc.
    raw_content TEXT UNIQUE NOT NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.configs ENABLE ROW LEVEL SECURITY;

-- Create Public Access Policies to allow reading
DROP POLICY IF EXISTS "Allow Public Access to Configs" ON public.configs;
CREATE POLICY "Allow Public Access to Configs" 
ON public.configs FOR SELECT USING (true);

-- Create Policy to allow editing
DROP POLICY IF EXISTS "Allow All Actions on Configs" ON public.configs;
CREATE POLICY "Allow All Actions on Configs" 
ON public.configs FOR ALL USING (true) WITH CHECK (true);


-- 4. Insert Default Channels to Monitor (Seeds)
INSERT INTO public.monitored_channels (username)
VALUES 
    ('ProxyMTProto'),
    ('Masir_Sefid'),
    ('v2ray_outlinefree'),
    ('ProxyDaemi')
ON CONFLICT (username) DO NOTHING;
