
import { createClient } from '@supabase/supabase-js';
import { 
  Metric, Insight, Product, 
  Testimonial, Profile, Contact, CarouselImage
} from '../types';

// Fix: Use process.env instead of import.meta.env to resolve TypeScript errors on ImportMeta
// and ensure consistency with the environment variable access pattern used throughout the project.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wvvnbkzodrolbndepkgj.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dm5ia3pvZHJvbGJuZGVwa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTkyMTAsImV4cCI6MjA4MTczNTIxMH0.t7aZdiGGeWRZfmHC6_g0dAvxTvi7K1aW6Or03QWuOYI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- AUTH & PROFILE ---
export const signIn = async (email: string, password?: string) => {
  return password 
    ? await supabase.auth.signInWithPassword({ email, password })
    : await supabase.auth.signInWithOtp({ email });
};

export const signUp = async (email: string, password?: string, metadata?: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: password || 'temp-pass-123',
    options: { data: metadata }
  });
  
  if (!error && data.user) {
    // Criação automática de perfil na tabela profiles
    await supabase.from('profiles').insert([{
      id: data.user.id,
      full_name: metadata?.full_name || '',
      cpf_cnpj: metadata?.cpf_cnpj || '',
      user_type: 'client'
    }]);
  }
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
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) return null;
  return data;
};

export const updateProfile = async (id: string, profile: Partial<Profile>) => {
  const { error } = await supabase.from('profiles').update(profile).eq('id', id);
  return !error;
};

// --- DATA FETCHING ---
export const fetchCarouselImages = async (): Promise<CarouselImage[]> => {
  const { data, error } = await supabase
    .from('carousel_images')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  if (error) {
    console.error("Error fetching carousel:", error);
    return [];
  }
  return data || [];
};

export const fetchInsights = async (): Promise<Insight[]> => {
  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .eq('is_active', true)
    .order('published_at', { ascending: false });
  if (error) return [];
  return data || [];
};

export const fetchInsightById = async (id: string): Promise<Insight | null> => {
  const { data, error } = await supabase.from('insights').select('*').eq('id', id).single();
  if (error) return null;
  return data;
};

export const fetchMetrics = async (): Promise<Metric[]> => {
  const { data, error } = await supabase
    .from('metrics')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  if (error) return [];
  return data || [];
};

export const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
};

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data || [];
};

export const fetchSiteContent = async (page: string): Promise<Record<string, string>> => {
  const { data, error } = await supabase.from('site_content').select('key, value').eq('page', page);
  if (error) return {};
  return (data || []).reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
};

export const submitContact = async (contact: Contact): Promise<boolean> => {
  const { error } = await supabase.from('contacts').insert([contact]);
  return !error;
};

// --- ADMIN CMS ---
export const addInsight = async (insight: any) => {
  const { data, error } = await supabase
    .from('insights')
    .insert([{ ...insight, published_at: new Date().toISOString() }])
    .select()
    .single();
  if (error) {
    console.error("Add insight error:", error);
    return null;
  }
  return data;
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
  if (error) return [];
  return data || [];
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
  if (uploadError) {
    console.error("Upload error:", uploadError);
    return null;
  }
  const { data } = supabase.storage.from('insight-images').getPublicUrl(`insights/${fileName}`);
  return data.publicUrl;
};
