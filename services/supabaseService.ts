
import { createClient } from '@supabase/supabase-js';
import { 
  Metric, Insight, Product, 
  Testimonial, Profile, Contact, CarouselImage
} from '../types';

// CONFIGURAÇÃO OFICIAL - CLAUDIO TONELLI ADVISORY CORE
// URL e Anon Key validadas conforme especificações do usuário
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
    headers: { 'x-application-name': 'ct-advisory-v6' }
  }
});

const cleanTableName = (name: string) => name.replace('public.', '').trim();

export const logSupabaseError = (context: string, error: any) => {
  if (error) {
    const message = error.message || 'Unknown Error';
    const code = error.code || 'N/A';
    
    // Detecta se a tabela/relação está ausente no cache ou no banco
    const isMissingTable = code === '42P01' || (message && message.toLowerCase().includes('relation') && message.toLowerCase().includes('does not exist'));
    
    console.warn(`[DB DIAGNOSTIC - ${context}] ${message} (Code: ${code})`);
    
    const recoverySql = `
-- REPARAÇÃO TOTAL DE INFRAESTRUTURA (v6.9.1)
NOTIFY pgrst, 'reload schema';
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
    `.trim();
    
    return {
      isError: true,
      message,
      code,
      suggestedSql: recoverySql,
      isMissingTable
    };
  }
  return { isError: false, isMissingTable: false };
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
    // Usamos upsert para evitar erro 409 caso o trigger de DB já tenha criado o perfil
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
