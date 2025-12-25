
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

// SQL templates atualizados para refletir IDs BigInt e Identity do usuário
export const TABLE_SQL_TEMPLATES: Record<string, string> = {
  products: `CREATE TABLE IF NOT EXISTS public.products (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  name_en text, name_es text,
  description text,
  description_en text, description_es text,
  price numeric NOT NULL DEFAULT 0,
  type text CHECK (type = ANY (ARRAY['product'::text, 'service'::text])),
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin full" ON public.products FOR ALL TO authenticated USING (true);
NOTIFY pgrst, 'reload schema';`,

  carousel_images: `CREATE TABLE IF NOT EXISTS public.carousel_images (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  url text NOT NULL,
  title text, title_en text, title_es text,
  subtitle text, subtitle_en text, subtitle_es text,
  cta_text text DEFAULT 'Saiba Mais'::text,
  cta_text_en text, cta_text_es text,
  cta_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.carousel_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.carousel_images FOR SELECT USING (true);
CREATE POLICY "Admin full" ON public.carousel_images FOR ALL TO authenticated USING (true);
NOTIFY pgrst, 'reload schema';`,

  insights: `CREATE TABLE IF NOT EXISTS public.insights (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title text NOT NULL, title_en text, title_es text,
  subtitle text,
  excerpt text, excerpt_en text, excerpt_es text,
  image_url text,
  content text, content_en text, content_es text,
  category text DEFAULT 'ADVISORY',
  published_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  display_order integer NOT NULL DEFAULT 0
);
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.insights FOR SELECT USING (true);
CREATE POLICY "Admin full" ON public.insights FOR ALL TO authenticated USING (true);
NOTIFY pgrst, 'reload schema';`,

  metrics: `CREATE TABLE IF NOT EXISTS public.metrics (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  label text NOT NULL, label_en text, label_es text,
  value text NOT NULL,
  icon text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.metrics FOR SELECT USING (true);
CREATE POLICY "Admin full" ON public.metrics FOR ALL TO authenticated USING (true);
NOTIFY pgrst, 'reload schema';`,

  site_content: `CREATE TABLE IF NOT EXISTS public.site_content (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  value_en text, value_es text,
  page text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admin full" ON public.site_content FOR ALL TO authenticated USING (true);
NOTIFY pgrst, 'reload schema';`,

  contacts: `CREATE TABLE IF NOT EXISTS public.contacts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin select" ON public.contacts FOR SELECT TO authenticated USING (true);
NOTIFY pgrst, 'reload schema';`,

  testimonials: `CREATE TABLE IF NOT EXISTS public.testimonials (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  company text,
  quote text NOT NULL,
  quote_en text, quote_es text,
  approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Admin full" ON public.testimonials FOR ALL TO authenticated USING (true);
NOTIFY pgrst, 'reload schema';`
};

const getTableNameFromContext = (context: string): string | null => {
  if (context.includes(' - ')) return context.split(' - ')[1].trim();
  const lower = context.toLowerCase();
  if (lower.includes('carousel')) return 'carousel_images';
  if (lower.includes('insight')) return 'insights';
  if (lower.includes('product')) return 'products';
  if (lower.includes('testimonial')) return 'testimonials';
  if (lower.includes('metric')) return 'metrics';
  if (lower.includes('content')) return 'site_content';
  if (lower.includes('contact')) return 'contacts';
  if (lower.includes('profile')) return 'profiles';
  return null;
};

export const logSupabaseError = (context: string, error: any) => {
  if (error) {
    const message = typeof error === 'string' ? error : (error.message || 'Erro desconhecido');
    const code = error.code || 'N/A';
    const isMissingTable = code === '42P01' || code === 'PGRST205';
    const tableName = getTableNameFromContext(context);
    
    console.error(`[Supabase Error - ${context}] ${message} | Code: ${code}`);

    return {
      isError: true,
      message,
      code,
      isMissingTable,
      tableName,
      suggestedSql: isMissingTable && tableName ? TABLE_SQL_TEMPLATES[tableName] : `NOTIFY pgrst, 'reload schema';`
    };
  }
  return { isError: false };
};

export const subscribeToChanges = (table: string, callback: () => void) => {
  return supabase
    .channel(`realtime:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
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

export const getProfile = async (id: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (logSupabaseError('getProfile', error).isError) return null;
    return data;
  } catch { return null; }
};

export const fetchCarouselImages = async (): Promise<CarouselImage[]> => {
  try {
    const { data, error } = await supabase.from('carousel_images').select('*').eq('is_active', true).order('display_order');
    if (logSupabaseError('fetchCarouselImages', error).isError) return [];
    return data || [];
  } catch { return []; }
};

export const fetchMetrics = async (): Promise<Metric[]> => {
  try {
    const { data, error } = await supabase.from('metrics').select('*').eq('is_active', true).order('display_order');
    if (logSupabaseError('fetchMetrics', error).isError) return [];
    return data || [];
  } catch { return []; }
};

export const fetchInsights = async (): Promise<Insight[]> => {
  try {
    const { data, error } = await supabase.from('insights').select('*').eq('is_active', true).order('display_order');
    if (logSupabaseError('fetchInsights', error).isError) return [];
    return data || [];
  } catch { return []; }
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (logSupabaseError('fetchProducts', error).isError) return [];
    return data || [];
  } catch { return []; }
};

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const { data, error } = await supabase.from('testimonials').select('*').eq('approved', true).order('created_at', { ascending: false });
    if (logSupabaseError('fetchTestimonials', error).isError) return [];
    return data || [];
  } catch { return []; }
};

export const fetchSiteContent = async (page: string): Promise<Record<string, any>> => {
  try {
    const { data, error } = await supabase.from('site_content').select('*').eq('page', page);
    if (logSupabaseError('fetchSiteContent', error).isError) return {};
    return (data || []).reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr }), {});
  } catch { return {}; }
};

export const submitContact = async (contact: Contact): Promise<boolean> => {
  try {
    const { error } = await supabase.from('contacts').insert([contact]);
    return !logSupabaseError('submitContact', error).isError;
  } catch { return false; }
};

export const fetchInsightById = async (id: string | number): Promise<Insight | null> => {
  try {
    const { data, error } = await supabase.from('insights').select('*').eq('id', id).single();
    if (logSupabaseError('fetchInsightById', error).isError) return null;
    return data;
  } catch { return null; }
};
