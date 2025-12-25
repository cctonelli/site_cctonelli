
import { createClient } from '@supabase/supabase-js';
import { 
  Metric, Insight, Product, 
  Testimonial, Profile, Contact, CarouselImage
} from '../types';

const SUPABASE_URL = 'https://wvvnbkzodrolbndepkgj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dm5ia3pvZHJvbGJuZGVwa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTkyMTAsImV4cCI6MjA4MTczNTIxMH0.t7aZdiGGeWRZfmHC6_g0dAvxTvi7K1aW6Or03QWuOYI';

// Minimalist initialization to prevent schema conflicts.
// Do NOT add db: { schema: 'public' } as it can cause redundancy in some PostgREST versions.
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
    const isMissingTable = code === 'PGRST205' || code === '42P01' || message.includes('schema cache') || message.includes('not found');
    const isMissingColumn = code === '42703';
    
    console.error(`[Supabase Error - ${context}] ${message} (Code: ${code})`);
    
    return {
      isError: true,
      message,
      code,
      isMissingTable,
      isMissingColumn,
      suggestedSql: `NOTIFY pgrst, 'reload schema';`
    };
  }
  return { isError: false };
};

// CLEAN QUERIES: Strictly no 'public.' prefix and selecting only verified columns.
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
      // Removed 'subtitle' and 'content' as they were reported as non-existent (42703).
      .select('id, title, excerpt, image_url, link, published_at, is_active, display_order')
      .eq('is_active', true)
      .order('display_order');
    
    if (logSupabaseError('fetchInsights', error).isError) return [];
    return data || [];
  } catch { return []; }
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    // Ensuring 'products' is called without any prefix to avoid PGRST205 schema cache conflicts.
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (logSupabaseError('fetchProducts', error).isError) return [];
    return data || [];
  } catch { return []; }
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
  const cleanTable = table.replace('public.', '');
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
