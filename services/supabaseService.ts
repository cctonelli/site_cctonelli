
import { createClient } from '@supabase/supabase-js';
import { 
  Metric, Insight, Product, 
  Testimonial, Profile, Contact, CarouselImage
} from '../types';

/**
 * CONFIGURAÇÃO OFICIAL - CLAUDIO TONELLI ADVISORY CORE
 * Conexão direta com a infraestrutura Supabase validada pelo usuário.
 */
const SUPABASE_URL = 'https://wvvnbkzodrolbndepkgj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dm5ia3pvZHJvbGJuZGVwa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTkyMTAsImV4cCI6MjA4MTczNTIxMH0.t7aZdiGGeWRZfmHC6_g0dAvxTvi7K1aW6Or03QWuOYI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  },
  global: {
    headers: { 'x-application-name': 'ct-advisory-v6-pro' }
  }
});

const cleanTableName = (name: string) => name.replace('public.', '').trim();

/**
 * Diagnóstico de erro aprimorado para detectar falhas de RLS (Row Level Security)
 * que são a causa principal de falhas de gravação em cadastros novos.
 */
export const logSupabaseError = (context: string, error: any) => {
  if (error) {
    const message = error.message || 'Unknown Error';
    const code = error.code || 'N/A';
    
    // Detecta se a tabela/relação está ausente ou se há bloqueio de RLS
    const isMissingTable = code === '42P01' || (message && message.toLowerCase().includes('relation') && message.toLowerCase().includes('does not exist'));
    const isRlsError = code === '42501' || message.includes('row-level security');
    
    console.warn(`[DB DIAGNOSTIC - ${context}] ${message} (Code: ${code})`);
    
    // Script de reparo completo, incluindo as políticas de PROFILES que muitas vezes são esquecidas
    const recoverySql = `
-- REPARAÇÃO TOTAL DE INFRAESTRUTURA (v6.9.2)
-- 1. Reset de Cache
NOTIFY pgrst, 'reload schema';

-- 2. Permissões de Profiles (Crítico para novos cadastros)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir inserção própria" ON public.profiles;
CREATE POLICY "Permitir inserção própria" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Permitir leitura própria" ON public.profiles;
CREATE POLICY "Permitir leitura própria" ON public.profiles FOR SELECT USING (auth.uid() = id OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')));
DROP POLICY IF EXISTS "Permitir atualização própria" ON public.profiles;
CREATE POLICY "Permitir atualização própria" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Permissões Globais
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
    `.trim();
    
    return {
      isError: true,
      message,
      code,
      suggestedSql: recoverySql,
      isMissingTable,
      isRlsError
    };
  }
  return { isError: false, isMissingTable: false, isRlsError: false };
};

export const fetchCarouselImages = async (): Promise<CarouselImage[]> => {
  try {
    const { data, error } = await supabase
      .from(cleanTableName('carousel_images')) 
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    if (logSupabaseError('fetchCarouselImages', error).isError) return [];
    return data || [];
  } catch { return []; }
};

export const fetchMetrics = async (): Promise<Metric[]> => {
  try {
    const { data, error } = await supabase
      .from(cleanTableName('metrics'))
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    if (logSupabaseError('fetchMetrics', error).isError) return [];
    return data || [];
  } catch { return []; }
};

export const fetchInsights = async (): Promise<Insight[]> => {
  try {
    const { data, error } = await supabase
      .from(cleanTableName('insights'))
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    if (logSupabaseError('fetchInsights', error).isError) return [];
    return data || [];
  } catch { return []; }
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from(cleanTableName('products'))
      .select('*')
      .order('created_at', { ascending: false });
    if (logSupabaseError('fetchProducts', error).isError) return [];
    return data || [];
  } catch { return []; }
};

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const { data, error } = await supabase
      .from(cleanTableName('testimonials'))
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false });
    if (logSupabaseError('fetchTestimonials', error).isError) return [];
    return data || [];
  } catch { return []; }
};

export const fetchSiteContent = async (page: string): Promise<Record<string, any>> => {
  try {
    const { data, error } = await supabase
      .from(cleanTableName('site_content'))
      .select('*')
      .eq('page', page);
    if (logSupabaseError('fetchSiteContent', error).isError) return {};
    return (data || []).reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr }), {});
  } catch { return {}; }
};

export const subscribeToChanges = (table: string, callback: () => void) => {
  const tableToWatch = cleanTableName(table);
  return supabase
    .channel(`realtime:${tableToWatch}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: tableToWatch }, callback)
    .subscribe();
};

export const getProfile = async (id: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from(cleanTableName('profiles'))
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      logSupabaseError('getProfile', error);
      return null;
    }
    return data;
  } catch { return null; }
};

export const signIn = async (email: string, password?: string) => {
  const cleanEmail = email.trim();
  return password 
    ? await supabase.auth.signInWithPassword({ email: cleanEmail, password })
    : await supabase.auth.signInWithOtp({ email: cleanEmail });
};

export const signUp = async (email: string, password: string, metadata: any) => {
  const cleanEmail = email.trim();
  return await supabase.auth.signUp({
    email: cleanEmail, 
    password, 
    options: { 
      data: metadata,
      emailRedirectTo: window.location.origin
    }
  });
};

export const createProfile = async (profile: Profile) => {
  try {
    const { error } = await supabase
      .from(cleanTableName('profiles'))
      .upsert(profile, { onConflict: 'id' });
    return logSupabaseError('createProfile', error);
  } catch (err) {
    return { isError: true, message: 'Falha crítica ao persistir perfil no banco.', isMissingTable: false };
  }
};

export const signOut = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('supabase.auth.token');
};

export const submitContact = async (contact: Contact): Promise<boolean> => {
  try {
    const { error } = await supabase.from(cleanTableName('contacts')).insert([contact]);
    return !logSupabaseError('submitContact', error).isError;
  } catch { return false; }
};

export const fetchInsightById = async (id: string | number): Promise<Insight | null> => {
  try {
    const { data, error } = await supabase
      .from(cleanTableName('insights'))
      .select('*')
      .eq('id', id)
      .single();
    if (logSupabaseError('fetchInsightById', error).isError) return null;
    return data;
  } catch { return null; }
};
