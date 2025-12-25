
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
  carousel_images: `-- SQL para carousel_images
ALTER TABLE public.carousel_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.carousel_images FOR SELECT USING (true);
NOTIFY pgrst, 'reload schema';`,
  insights: `-- SQL para insights
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.insights FOR SELECT USING (true);
NOTIFY pgrst, 'reload schema';`,
  metrics: `-- SQL para metrics
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.metrics FOR SELECT USING (true);
NOTIFY pgrst, 'reload schema';`,
  testimonials: `-- SQL para testimonials
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.testimonials FOR SELECT USING (true);
NOTIFY pgrst, 'reload schema';`,
  site_content: `-- SQL para site_content
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.site_content FOR SELECT USING (true);
NOTIFY pgrst, 'reload schema';`,
  contacts: `-- SQL para contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin insert" ON public.contacts FOR INSERT WITH CHECK (true);
NOTIFY pgrst, 'reload schema';`
};

/**
 * Extracts the table name from a context string to find the matching SQL template.
 */
const getTableNameFromContext = (context: string): string | null => {
  // If context is "Admin - products", return "products"
  if (context.includes(' - ')) {
    return context.split(' - ')[1].trim();
  }
  // If context is "fetchProducts", return "products"
  const fetchMatch = context.match(/fetch([A-Z][a-z]+)/);
  if (fetchMatch) {
    const table = fetchMatch[1].toLowerCase();
    // Special cases for pluralization/mapping
    if (table === 'carousel') return 'carousel_images';
    if (table === 'insight') return 'insights';
    if (table === 'product') return 'products';
    if (table === 'testimonial') return 'testimonials';
    if (table === 'metric') return 'metrics';
    return table;
  }
  // Try direct match
  const directMatch = ['products', 'carousel_images', 'insights', 'metrics', 'testimonials', 'site_content', 'contacts'].find(t => context.toLowerCase().includes(t));
  return directMatch || null;
};

export const logSupabaseError = (context: string, error: any) => {
  if (error) {
    const message = typeof error === 'string' ? error : (error.message || 'Erro de conexão desconhecido');
    const code = error.code || 'NO_CODE';
    const details = error.details || 'Sem detalhes';
    const hint = error.hint ? ` | Dica: ${error.hint}` : '';
    
    const logString = `[Supabase Error - ${context}] ${message} | Código: ${code} | Detalhes: ${details}${hint}`;
    console.error(logString);
    
    // PGRST205 indicates schema cache/table resolution error
    const isMissingTable = message.includes('schema cache') || code === '42P01' || message.includes('Could not find') || code === 'PGRST205';
    
    const tableName = getTableNameFromContext(context);
    
    return {
      isError: true,
      message: logString,
      code,
      isMissingTable,
      suggestedSql: isMissingTable && tableName ? (TABLE_SQL_TEMPLATES[tableName] || `NOTIFY pgrst, 'reload schema';`) : null
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
  try {
    const { data, error } = await supabase.from('insights').select('*').eq('id', id).single();
    if (logSupabaseError('fetchInsightById', error).isError) return null;
    return data;
  } catch (err) {
    return null;
  }
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
