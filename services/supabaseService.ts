
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

// Fixed: Added missing signUp function export for registration flow
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
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) return null;
  return data;
};

export const fetchCarouselImages = async () => {
  const { data, error } = await supabase.from('carousel_images').select('*').eq('is_active', true).order('display_order', { ascending: true });
  if (error) { console.error("Erro Carousel:", error.message); return []; }
  return data || [];
};

export const fetchMetrics = async () => {
  const { data, error } = await supabase.from('metrics').select('*').eq('is_active', true).order('display_order', { ascending: true });
  if (error) { console.error("Erro Metrics:", error.message); return []; }
  return data || [];
};

export const fetchInsights = async () => {
  const { data, error } = await supabase.from('insights').select('*').eq('is_active', true).order('published_at', { ascending: false });
  if (error) { console.error("Erro Insights:", error.message); return []; }
  return data || [];
};

export const fetchInsightById = async (id: string) => {
  const { data, error } = await supabase.from('insights').select('*').eq('id', id).single();
  return data;
};

export const fetchProducts = async () => {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  return data || [];
};

export const fetchTestimonials = async () => {
  const { data, error } = await supabase.from('testimonials').select('*').eq('approved', true).order('created_at', { ascending: false });
  return data || [];
};

export const fetchSiteContent = async (page: string) => {
  const { data, error } = await supabase.from('site_content').select('key, value').eq('page', page);
  if (error) return {};
  return (data || []).reduce((acc: any, item: any) => ({ ...acc, [item.key]: item.value }), {});
};

export const submitContact = async (contact: Contact) => {
  const { error } = await supabase.from('contacts').insert([contact]);
  return !error;
};
