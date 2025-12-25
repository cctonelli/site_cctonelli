
import { createClient } from '@supabase/supabase-js';
import { 
  Metric, Insight, Product, 
  Testimonial, Profile, Contact, CarouselImage
} from '../types';

const SUPABASE_URL = 'https://wvvnbkzodrolbndepkgj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dm5ia3pvZHJvbGJuZGVwa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTkyMTAsImV4cCI6MjA4MTczNTIxMH0.t7aZdiGGeWRZfmHC6_g0dAvxTvi7K1aW6Or03QWuOYI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

export const logSupabaseError = (context: string, error: any) => {
  if (error) {
    const message = error.message || 'Unknown Error';
    const code = error.code || 'N/A';
    
    const isCacheError = code === 'PGRST205' || message.includes('schema cache');
    const isMissingTable = isCacheError || code === '42P01' || message.includes('not found') || message.includes('404');
    
    console.error(`[DB DIAGNOSTIC - ${context}] ${message} (Code: ${code})`);
    
    // SCRIPT DE RESET ULTRA (v6.7.4)
    // Se o NOTIFY básico falhou, precisamos resetar permissões de esquema fundamentais.
    const recoverySql = isMissingTable ? `
-- RESET ULTRA DE PERMISSÕES (v6.7.4)
-- 1. Forçar reload do cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- 2. Garantir permissões de USAGE no esquema public (CORREÇÃO PARA ERRO 404 PERSISTENTE)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO service_role;

-- 3. Garantir permissão de leitura em todas as tabelas para visitantes
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- 4. Reconstrução física da tabela 'products'
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC DEFAULT 0,
  type TEXT DEFAULT 'service',
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Habilitar RLS e garantir política de acesso pública
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow Public Access" ON public.products;
CREATE POLICY "Allow Public Access" ON public.products FOR SELECT USING (true);
` : `NOTIFY pgrst, 'reload schema';`;
    
    return {
      isError: true,
      message,
      code,
      isMissingTable,
      isCacheError,
      suggestedSql: recoverySql.trim()
    };
  }
  return { isError: false };
};

export const fetchCarouselImages = async (): Promise<CarouselImage[]> => {
  try {
    const { data, error } = await supabase
      .from('carousel_images') 
      .select('id, url, title, subtitle, display_order, is_active')
      .eq('is_active', true)
      .order('display_order');
    
    if (logSupabaseError('fetchCarouselImages', error).isError) return [];
    return data || [];
  } catch (err) {
    console.error("Critical carousel fetch error:", err);
    return [];
  }
};

export const fetchMetrics = async (): Promise<Metric[]> => {
  try {
    const { data, error } = await supabase
      .from('metrics')
      .select('id, label, value, icon, display_order, is_active')
      .eq('is_active', true)
      .order('display_order');
    
    if (logSupabaseError('fetchMetrics', error).isError) return [];
    return data || [];
  } catch { return []; }
};

export const fetchInsights = async (): Promise<Insight[]> => {
  try {
    const { data, error } = await supabase
      .from('insights')
      .select('id, title, excerpt, image_url, link, published_at, is_active, display_order')
      .eq('is_active', true)
      .order('display_order');
    
    if (logSupabaseError('fetchInsights', error).isError) return [];
    return data || [];
  } catch { return []; }
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (logSupabaseError('fetchProducts', error).isError) return [];
    return data || [];
  } catch (err) {
    console.error("Critical products fetch error:", err);
    return [];
  }
};

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, name, company, quote, approved, created_at')
      .eq('approved', true)
      .order('created_at', { ascending: false });
    
    if (logSupabaseError('fetchTestimonials', error).isError) return [];
    return data || [];
  } catch { return []; }
};

export const fetchSiteContent = async (page: string): Promise<Record<string, any>> => {
  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('id, key, value, page')
      .eq('page', page);
    
    if (logSupabaseError('fetchSiteContent', error).isError) return {};
    return (data || []).reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr }), {});
  } catch { return {}; }
};

export const subscribeToChanges = (table: string, callback: () => void) => {
  const cleanTable = table.replace('public.', '').trim();
  return supabase
    .channel(`realtime:${cleanTable}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: cleanTable }, callback)
    .subscribe();
};

export const getProfile = async (id: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, cpf_cnpj, gender, whatsapp, user_type')
      .eq('id', id)
      .single();
    if (logSupabaseError('getProfile', error).isError) return null;
    return data;
  } catch { return null; }
};

export const signIn = async (email: string, password?: string) => {
  return password 
    ? await supabase.auth.signInWithPassword({ email, password })
    : await supabase.auth.signInWithOtp({ email });
};

export const signUp = async (email: string, password: string, metadata: any) => {
  return await supabase.auth.signUp({
    email, password, options: { data: metadata }
  });
};

export const signOut = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('supabase.auth.token');
};

export const submitContact = async (contact: Contact): Promise<boolean> => {
  try {
    const { error } = await supabase.from('contacts').insert([contact]);
    return !logSupabaseError('submitContact', error).isError;
  } catch { return false; }
};

export const fetchInsightById = async (id: string | number): Promise<Insight | null> => {
  try {
    const { data, error } = await supabase
      .from('insights')
      .select('id, title, excerpt, image_url, link, published_at, is_active, display_order')
      .eq('id', id)
      .single();
    
    if (logSupabaseError('fetchInsightById', error).isError) return null;
    return data;
  } catch { return null; }
};
