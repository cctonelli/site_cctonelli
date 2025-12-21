
import { createClient } from '@supabase/supabase-js';
import { 
  CarouselImage, Metric, Insight, Product, 
  Testimonial, Profile, SiteContent, Contact 
} from '../types';

// Safe access to environment variables
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const SUPABASE_URL = getEnv('SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY');

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const logSecureError = (context: string, error: any) => {
  console.error(`[Supabase ${context}]`, error);
};

// --- AUTHENTICATION ---
export const signIn = async (email: string, password?: string) => {
  if (!supabase) return { data: null, error: new Error("Supabase não inicializado") };
  const { data, error } = password 
    ? await supabase.auth.signInWithPassword({ email, password })
    : await supabase.auth.signInWithOtp({ email });
  if (error) logSecureError('SignIn', error);
  return { data, error };
};

export const signUp = async (email: string, password?: string, metadata?: any) => {
  if (!supabase) return { data: null, error: new Error("Supabase não inicializado") };
  const { data, error } = await supabase.auth.signUp({
    email,
    password: password || 'default-secure-pass',
    options: { data: metadata }
  });
  return { data, error };
};

export const signOut = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};

export const getCurrentUser = async () => {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// --- STORAGE ---
export const uploadInsightImage = async (file: File): Promise<string | null> => {
  if (!supabase) return null;
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `insights/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('insight-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('insight-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (e) {
    logSecureError('UploadImage', e);
    return null;
  }
};

// --- DATA FETCHING ---
export const fetchInsights = async (): Promise<Insight[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .eq('is_active', true)
      .order('published_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) { logSecureError('Insights', e); return []; }
};

export const fetchInsightById = async (id: string): Promise<Insight | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  } catch (e) { logSecureError('InsightDetail', e); return null; }
};

export const fetchMetrics = async (): Promise<Metric[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('metrics')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (e) { logSecureError('Metrics', e); return []; }
};

export const fetchProducts = async (): Promise<Product[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) { logSecureError('Products', e); return []; }
};

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('approved', true);
    if (error) throw error;
    return data || [];
  } catch (e) { logSecureError('Testimonials', e); return []; }
};

export const fetchSiteContent = async (page: string): Promise<Record<string, string>> => {
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from('site_content')
      .select('key, value')
      .eq('page', page);
    if (error) throw error;
    return (data || []).reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
  } catch (e) { logSecureError('SiteContent', e); return {}; }
};

export const submitContact = async (contact: Contact): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('contacts').insert([contact]);
    return !error;
  } catch (e) { return false; }
};

// --- ADMIN CMS ---
export const addInsight = async (insight: Omit<Insight, 'id' | 'published_at'>): Promise<Insight | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('insights')
    .insert([{ ...insight, published_at: new Date().toISOString() }])
    .select()
    .single();
  if (error) logSecureError('AddInsight', error);
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
