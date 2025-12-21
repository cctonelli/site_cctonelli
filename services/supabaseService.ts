
import { createClient } from '@supabase/supabase-js';
import { 
  Metric, Insight, Product, 
  Testimonial, Profile, Contact, CarouselImage
} from '../types';

// Standard environment access using process.env
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// --- AUTH ---
export const signIn = async (email: string, password?: string) => {
  if (!supabase) return { data: null, error: new Error("Supabase não configurado") };
  return password 
    ? await supabase.auth.signInWithPassword({ email, password })
    : await supabase.auth.signInWithOtp({ email });
};

export const signUp = async (email: string, password?: string, metadata?: any) => {
  if (!supabase) return { data: null, error: new Error("Supabase não configurado") };
  return await supabase.auth.signUp({
    email,
    password: password || 'temp-pass-123',
    options: { data: metadata }
  });
};

export const signOut = async () => {
  if (supabase) await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// --- FETCHING ---
export const fetchCarouselImages = async (): Promise<CarouselImage[]> => {
  if (!supabase) return [];
  const { data } = await supabase.from('carousel_images').select('*').eq('is_active', true).order('display_order', { ascending: true });
  return data || [];
};

export const fetchInsights = async (): Promise<Insight[]> => {
  if (!supabase) return [];
  const { data } = await supabase.from('insights').select('*').eq('is_active', true).order('published_at', { ascending: false });
  return data || [];
};

export const fetchInsightById = async (id: string): Promise<Insight | null> => {
  if (!supabase) return null;
  const { data } = await supabase.from('insights').select('*').eq('id', id).single();
  return data;
};

export const fetchMetrics = async (): Promise<Metric[]> => {
  if (!supabase) return [];
  const { data } = await supabase.from('metrics').select('*').eq('is_active', true).order('display_order', { ascending: true });
  return data || [];
};

export const fetchProducts = async (): Promise<Product[]> => {
  if (!supabase) return [];
  const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  return data || [];
};

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  if (!supabase) return [];
  const { data } = await supabase.from('testimonials').select('*').eq('approved', true).order('created_at', { ascending: false });
  return data || [];
};

export const fetchSiteContent = async (page: string): Promise<Record<string, string>> => {
  if (!supabase) return {};
  const { data } = await supabase.from('site_content').select('key, value').eq('page', page);
  return (data || []).reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
};

export const submitContact = async (contact: Contact): Promise<boolean> => {
  if (!supabase) return false;
  const { error } = await supabase.from('contacts').insert([contact]);
  return !error;
};

// --- ADMIN ---
export const addInsight = async (insight: any) => {
  if (!supabase) return null;
  const { data } = await supabase.from('insights').insert([{ ...insight, published_at: new Date().toISOString() }]).select().single();
  return data;
};

export const deleteInsight = async (id: string) => {
  if (!supabase) return false;
  const { error } = await supabase.from('insights').delete().eq('id', id);
  return !error;
};

export const updateInsightLink = async (id: string, link: string) => {
  if (!supabase) return false;
  const { error } = await supabase.from('insights').update({ link }).eq('id', id);
  return !error;
};

export const fetchPendingTestimonials = async () => {
  if (!supabase) return [];
  const { data } = await supabase.from('testimonials').select('*').eq('approved', false);
  return data || [];
};

export const approveTestimonial = async (id: string) => {
  if (!supabase) return false;
  const { error } = await supabase.from('testimonials').update({ approved: true }).eq('id', id);
  return !error;
};

export const getProfile = async (id: string): Promise<Profile | null> => {
  if (!supabase) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
  return data;
};

export const updateProfile = async (id: string, profile: Partial<Profile>) => {
  if (!supabase) return false;
  const { error } = await supabase.from('profiles').update(profile).eq('id', id);
  return !error;
};

export const updateSiteContent = async (key: string, value: string) => {
  if (!supabase) return false;
  const { error } = await supabase.from('site_content').upsert({ key, value, page: 'home' }, { onConflict: 'key' });
  return !error;
};

export const addProduct = async (product: any) => {
  if (!supabase) return false;
  const { error } = await supabase.from('products').insert([product]);
  return !error;
};

export const deleteProduct = async (id: string) => {
  if (!supabase) return false;
  const { error } = await supabase.from('products').delete().eq('id', id);
  return !error;
};

export const uploadInsightImage = async (file: File): Promise<string | null> => {
  if (!supabase) return null;
  const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
  const { error: uploadError } = await supabase.storage.from('insight-images').upload(`insights/${fileName}`, file);
  if (uploadError) {
    console.error("Upload error:", uploadError);
    return null;
  }
  const { data } = supabase.storage.from('insight-images').getPublicUrl(`insights/${fileName}`);
  return data.publicUrl;
};

export const addCarouselImage = async (image: any) => {
  if (!supabase) return false;
  const { error } = await supabase.from('carousel_images').insert([image]);
  return !error;
};

export const deleteCarouselImage = async (id: string) => {
  if (!supabase) return false;
  const { error } = await supabase.from('carousel_images').delete().eq('id', id);
  return !error;
};
