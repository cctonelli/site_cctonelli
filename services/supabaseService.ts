
import { createClient } from '@supabase/supabase-js';
import { 
  Metric, Insight, Product, 
  Testimonial, Profile, Contact, CarouselImage
} from '../types';

const SUPABASE_URL = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 'https://wvvnbkzodrolbndepkgj.supabase.co';
const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dm5ia3pvZHJvbGJuZGVwa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTkyMTAsImV4cCI6MjA4MTczNTIxMH0.t7aZdiGGeWRZfmHC6_g0dAvxTvi7K1aW6Or03QWuOYI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// --- AUTH & PROFILE ---
export const signIn = async (email: string, password?: string) => {
  return password 
    ? await supabase.auth.signInWithPassword({ email, password })
    : await supabase.auth.signInWithOtp({ email });
};

export const signUp = async (email: string, password?: string, metadata?: Partial<Profile>) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: password || 'temp-pass-123',
    options: { 
      data: {
        full_name: metadata?.full_name || '',
        cpf_cnpj: metadata?.cpf_cnpj || '',
        gender: metadata?.gender || '',
        whatsapp: metadata?.whatsapp || '',
        user_type: 'client'
      } 
    }
  });
  return { data, error };
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getProfile = async (id: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) return null;
  return data;
};

// --- DATA FETCHING ---
export const fetchCarouselImages = async () => {
  const { data, error } = await supabase.from('carousel_images').select('*').order('display_order', { ascending: true });
  return error ? [] : data || [];
};

export const fetchInsights = async () => {
  const { data, error } = await supabase.from('insights').select('*').order('published_at', { ascending: false });
  return error ? [] : data || [];
};

export const fetchInsightById = async (id: string) => {
  const { data, error } = await supabase.from('insights').select('*').eq('id', id).single();
  return error ? null : data;
};

export const fetchMetrics = async () => {
  const { data, error } = await supabase.from('metrics').select('*').order('display_order', { ascending: true });
  return error ? [] : data || [];
};

export const fetchProducts = async () => {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  return error ? [] : data || [];
};

export const fetchTestimonials = async () => {
  const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
  return error ? [] : data || [];
};

export const fetchSiteContent = async (page: string) => {
  const { data, error } = await supabase.from('site_content').select('key, value').eq('page', page);
  return (data || []).reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
};

export const fetchAllSiteContent = async () => {
  const { data, error } = await supabase.from('site_content').select('*').order('key', { ascending: true });
  return error ? [] : data || [];
};

export const submitContact = async (contact: Contact) => {
  const { error } = await supabase.from('contacts').insert([contact]);
  return !error;
};

// --- ADMIN CMS ---
export const addInsight = async (insight: any) => {
  // Removido .single() para evitar falhas silenciosas caso o RLS atrase o retorno
  const { data, error } = await supabase.from('insights').insert([{ ...insight, published_at: new Date().toISOString() }]).select();
  if (error) throw error;
  return data ? data[0] : null;
};

export const deleteInsight = async (id: string) => {
  const { error } = await supabase.from('insights').delete().eq('id', id);
  return !error;
};

export const updateInsightLink = async (id: string, link: string) => {
  const { error } = await supabase.from('insights').update({ link }).eq('id', id);
  return !error;
};

export const fetchPendingTestimonials = async () => {
  const { data, error } = await supabase.from('testimonials').select('*').eq('approved', false);
  return error ? [] : data || [];
};

export const approveTestimonial = async (id: string) => {
  const { error } = await supabase.from('testimonials').update({ approved: true }).eq('id', id);
  return !error;
};

export const updateSiteContent = async (key: string, value: string, page: string = 'home') => {
  const { error } = await supabase.from('site_content').upsert({ key, value, page }, { onConflict: 'key' });
  return !error;
};

export const addProduct = async (product: any) => {
  const { error } = await supabase.from('products').insert([product]);
  return !error;
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  return !error;
};

export const addMetric = async (metric: any) => {
  const { error } = await supabase.from('metrics').insert([metric]);
  return !error;
};

export const deleteMetric = async (id: string) => {
  const { error } = await supabase.from('metrics').delete().eq('id', id);
  return !error;
};

export const addCarouselImage = async (image: any) => {
  const { error } = await supabase.from('carousel_images').insert([image]);
  return !error;
};

export const deleteCarouselImage = async (id: string) => {
  const { error } = await supabase.from('carousel_images').delete().eq('id', id);
  return !error;
};

export const uploadInsightImage = async (file: File): Promise<string | null> => {
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  const { error: uploadError } = await supabase.storage.from('insight-images').upload(`insights/${fileName}`, file);
  if (uploadError) return null;
  const { data } = supabase.storage.from('insight-images').getPublicUrl(`insights/${fileName}`);
  return data.publicUrl;
};
