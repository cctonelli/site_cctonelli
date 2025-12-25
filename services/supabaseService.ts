
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

// Full SQL templates to resolve missing table errors (PGRST205)
export const TABLE_SQL_TEMPLATES: Record<string, string> = {
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

  carousel_images: `CREATE TABLE IF NOT EXISTS public.carousel_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  title TEXT,
  title_en TEXT,
  title_es TEXT,
  subtitle TEXT,
  subtitle_en TEXT,
  subtitle_es TEXT,
  cta_text TEXT,
  cta_text_en TEXT,
  cta_text_es TEXT,
  cta_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.carousel_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.carousel_images FOR SELECT USING (true);
CREATE POLICY "Admin full access" ON public.carousel_images FOR ALL TO authenticated USING (true);
NOTIFY pgrst, 'reload schema';`,

  insights: `CREATE TABLE IF NOT EXISTS public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_en TEXT,
  title_es TEXT,
  subtitle TEXT,
  excerpt TEXT,
  excerpt_en TEXT,
  excerpt_es TEXT,
  image_url TEXT,
  content TEXT,
  content_en TEXT,
  content_es TEXT,
  category TEXT DEFAULT 'ADVISORY',
  published_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0
);
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.insights FOR SELECT USING (true);
CREATE POLICY "Admin full access" ON public.insights FOR ALL TO authenticated USING (true);
NOTIFY pgrst, 'reload schema';`,

  metrics: `CREATE TABLE IF NOT EXISTS public.metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  label_en TEXT,
  label_es TEXT,
  value TEXT NOT NULL,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.metrics FOR SELECT USING (true);
CREATE POLICY "Admin full access" ON public.metrics FOR ALL TO authenticated USING (true);
NOTIFY pgrst, 'reload schema';`,

  testimonials: `CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  quote TEXT NOT NULL,
  quote_en TEXT,
  quote_es TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Admin full access" ON public.testimonials FOR ALL TO authenticated USING (true);
NOTIFY pgrst, 'reload schema';`,

  site_content: `CREATE TABLE IF NOT EXISTS public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page TEXT DEFAULT 'home',
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  value_en TEXT,
  value_es TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admin full access" ON public.site_content FOR ALL TO authenticated USING (true);
NOTIFY pgrst, 'reload schema';`,

  contacts: `CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anon insert" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin select" ON public.contacts FOR SELECT TO authenticated USING (true);
NOTIFY pgrst, 'reload schema';`,

  profiles: `CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  cpf_cnpj TEXT,
  gender TEXT,
  whatsapp TEXT,
  user_type TEXT DEFAULT 'client' CHECK (user_type IN ('client', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
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
    const message = typeof error === 'string' ? error : (error.message || 'Unknown Supabase Error');
    const code = error.code || 'N/A';
    // Identifies PGRST205 schema cache errors
    const isMissingTable = message.includes('schema cache') || code === '42P01' || message.includes('Could not find') || code === 'PGRST205';
    const tableName = getTableNameFromContext(context);
    
    const logStr = `[Supabase Error - ${context}] ${message} | Code: ${code}`;
    console.error(logStr);

    return {
      isError: true,
      message: logStr,
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
    .on('postgres_changes', { event: '*', schema: 'public', table: table }, callback)
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
    // Ensuring no 'public.' prefix is used here to avoid schema cache issues (PGRST205)
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

export const fetchInsightById = async (id: string): Promise<Insight | null> => {
  try {
    const { data, error } = await supabase.from('insights').select('*').eq('id', id).single();
    if (logSupabaseError('fetchInsightById', error).isError) return null;
    return data;
  } catch { return null; }
};
