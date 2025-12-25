
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

/**
 * Utilitário para formatar e logar erros do Supabase de forma legível.
 */
const logSupabaseError = (context: string, error: any) => {
  if (error) {
    const message = error.message || 'Erro desconhecido';
    const details = error.details || 'Sem detalhes adicionais';
    const hint = error.hint ? `| Dica: ${error.hint}` : '';
    
    console.error(`[Supabase Error - ${context}] ${message} (${details}) ${hint}`);
    return true;
  }
  return false;
};

export const subscribeToChanges = (table: string, callback: () => void) => {
  return supabase
    .channel(`realtime:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      console.log(`[Realtime] Mudança detectada em ${table}. Sincronizando...`);
      callback();
    })
    .subscribe();
};

export const signIn = async (email: string, password?: string) => {
  return password 
    ? await supabase.auth.signInWithPassword({ email, password })
    : await supabase.auth.signInWithOtp({ email });
};

export const signUp = async (email: string, password: string, metadata: any) => {
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
  });
};

export const signOut = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('supabase.auth.token');
};

export const getProfile = async (id: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (logSupabaseError('getProfile', error)) return null;
    return data;
  } catch (e) {
    console.error("Critical Profile Error:", e);
    return null;
  }
};

export const fetchCarouselImages = async (): Promise<CarouselImage[]> => {
  try {
    const { data, error } = await supabase.from('carousel_images').select('*').eq('is_active', true).order('display_order', { ascending: true });
    if (logSupabaseError('fetchCarouselImages', error)) return [];
    return data || [];
  } catch (err) {
    console.error("Critical Carousel Error:", err);
    return [];
  }
};

export const fetchMetrics = async (): Promise<Metric[]> => {
  try {
    const { data, error } = await supabase.from('metrics').select('*').eq('is_active', true).order('display_order', { ascending: true });
    if (logSupabaseError('fetchMetrics', error)) return [];
    return data || [];
  } catch (err) {
    console.error("Critical Metrics Error:", err);
    return [];
  }
};

export const fetchInsights = async (): Promise<Insight[]> => {
  try {
    const { data, error } = await supabase.from('insights').select('*').eq('is_active', true).order('published_at', { ascending: false });
    if (logSupabaseError('fetchInsights', error)) return [];
    return data || [];
  } catch (err) {
    console.error("Critical Insights Error:", err);
    return [];
  }
};

export const fetchInsightById = async (id: string) => {
  const { data, error } = await supabase.from('insights').select('*').eq('id', id).single();
  logSupabaseError('fetchInsightById', error);
  return data;
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (logSupabaseError('fetchProducts', error)) return [];
    return data || [];
  } catch (err) {
    console.error("Critical Products Error:", err);
    return [];
  }
};

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const { data, error } = await supabase.from('testimonials').select('*').eq('approved', true).order('created_at', { ascending: false });
    if (logSupabaseError('fetchTestimonials', error)) return [];
    return data || [];
  } catch (err) {
    console.error("Critical Testimonials Error:", err);
    return [];
  }
};

export const fetchSiteContent = async (page: string) => {
  try {
    const { data, error } = await supabase.from('site_content').select('*').eq('page', page);
    if (logSupabaseError('fetchSiteContent', error)) return {};
    return (data || []).reduce((acc: any, item: any) => ({ ...acc, [item.key]: item }), {});
  } catch (err) {
    console.error("Critical SiteContent Error:", err);
    return {};
  }
};

export const submitContact = async (contact: Contact) => {
  const { error } = await supabase.from('contacts').insert([contact]);
  logSupabaseError('submitContact', error);
  return !error;
};
