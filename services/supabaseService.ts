
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

// Mapas de criação de tabelas para auxílio no Admin
const TABLE_SQL_TEMPLATES: Record<string, string> = {
  products: `CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_en TEXT,
  name_es TEXT,
  description TEXT,
  description_en TEXT,
  description_es TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  type TEXT CHECK (type IN ('product', 'service')) DEFAULT 'service',
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin full access" ON public.products FOR ALL TO authenticated USING (true);
NOTIFY pgrst, 'reload schema';`,
  carousel_images: `-- SQL para carousel_images\nALTER TABLE public.carousel_images ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Public read" ON public.carousel_images FOR SELECT USING (true);\nNOTIFY pgrst, 'reload schema';`,
  insights: `-- SQL para insights\nALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Public read" ON public.insights FOR SELECT USING (true);\nNOTIFY pgrst, 'reload schema';`,
  metrics: `-- SQL para metrics\nALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Public read" ON public.metrics FOR SELECT USING (true);\nNOTIFY pgrst, 'reload schema';`,
  testimonials: `-- SQL para testimonials\nALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Public read" ON public.testimonials FOR SELECT USING (true);\nNOTIFY pgrst, 'reload schema';`,
  site_content: `-- SQL para site_content\nALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Public read" ON public.site_content FOR SELECT USING (true);\nNOTIFY pgrst, 'reload schema';`,
  contacts: `-- SQL para contacts\nALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Admin insert" ON public.contacts FOR INSERT WITH CHECK (true);\nNOTIFY pgrst, 'reload schema';`
};

export const logSupabaseError = (context: string, error: any) => {
  if (error) {
    const message = typeof error === 'string' ? error : (error.message || 'Erro de conexão desconhecido');
    const code = error.code || 'NO_CODE';
    const details = error.details || 'Sem detalhes';
    const hint = error.hint ? ` | Dica: ${error.hint}` : '';
    
    // Log formatado como string para evitar [object Object]
    const logString = `[Supabase Error - ${context}] ${message} | Código: ${code} | Detalhes: ${details}${hint}`;
    console.error(logString);
    
    // PGRST205 indica erro de resolução de schema/tabela no cache
    const isMissingTable = message.includes('schema cache') || code === '42P01' || message.includes('Could not find') || code === 'PGRST205';
    
    return {
      isError: true,
      message: logString,
      code,
      isMissingTable,
      suggestedSql: isMissingTable ? (TABLE_SQL_TEMPLATES[context.split(' - ')[1]] || TABLE_SQL_TEMPLATES[context.split('-')[1]?.trim()]) : null
    };
  }
  return { isError: false };
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
    if (logSupabaseError('getProfile', error).isError) return null;
    return data;
  } catch (e) {
    return null;
  }
};

export const fetchCarouselImages = async (): Promise<CarouselImage[]> => {
  try {
    const { data, error } = await supabase.from('carousel_images').select('*').eq('is_active', true).order('display_order', { ascending: true });
    if (logSupabaseError('fetchCarouselImages', error).isError) return [];
    return data || [];
  } catch (err) {
    return [];
  }
};

export const fetchMetrics = async (): Promise<Metric[]> => {
  try {
    const { data, error } = await supabase.from('metrics').select('*').eq('is_active', true).order('display_order', { ascending: true });
    if (logSupabaseError('fetchMetrics', error).isError) return [];
    return data || [];
  } catch (err) {
    return [];
  }
};

export const fetchInsights = async (): Promise<Insight[]> => {
  try {
    const { data, error } = await supabase.from('insights').select('*').eq('is_active', true).order('published_at', { ascending: false });
    if (logSupabaseError('fetchInsights', error).isError) return [];
    return data || [];
  } catch (err) {
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
    // Uso de nome simples da tabela para evitar duplicação public.public.
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (logSupabaseError('fetchProducts', error).isError) return [];
    return data || [];
  } catch (err) {
    return [];
  }
};

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const { data, error } = await supabase.from('testimonials').select('*').eq('approved', true).order('created_at', { ascending: false });
    if (logSupabaseError('fetchTestimonials', error).isError) return [];
    return data || [];
  } catch (err) {
    return [];
  }
};

export const fetchSiteContent = async (page: string) => {
  try {
    const { data, error } = await supabase.from('site_content').select('*').eq('page', page);
    if (logSupabaseError('fetchSiteContent', error).isError) return {};
    return (data || []).reduce((acc: any, item: any) => ({ ...acc, [item.key]: item }), {});
  } catch (err) {
    return {};
  }
};

export const submitContact = async (contact: Contact) => {
  const { error } = await supabase.from('contacts').insert([contact]);
  logSupabaseError('submitContact', error);
  return !error;
};
