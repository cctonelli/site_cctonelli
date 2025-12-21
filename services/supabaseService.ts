
import { createClient } from '@supabase/supabase-js';
import { 
  CarouselImage, Metric, Insight, Product, 
  Testimonial, Profile, SiteContent, Contact 
} from '../types';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const logSecureError = (context: string, error: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Internal Debug] ${context}:`, error);
  } else {
    console.warn(`Recurso [${context}] temporariamente indisponível.`);
  }
};

// --- AUTHENTICATION ---
export const signIn = async (email: string) => {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signInWithOtp({ email });
  if (error) logSecureError('SignIn', error);
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

// --- DATA FETCHING ---
export const fetchCarouselImages = async (): Promise<CarouselImage[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('carousel_images')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (e) { logSecureError('Carousel', e); return []; }
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

export const fetchInsights = async (): Promise<Insight[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (e) { logSecureError('Insights', e); return []; }
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
      .eq('approved', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) { logSecureError('Testimonials', e); return []; }
};

export const submitContact = async (contact: Contact): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('contacts').insert([contact]);
    if (error) throw error;
    return true;
  } catch (e) { logSecureError('Contact Submit', e); return false; }
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

// --- ADMINISTRATIVE & PROFILES ---
export const getProfile = async (userId: string): Promise<Profile | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  } catch (e) { logSecureError('GetProfile', e); return null; }
};

export const updateSiteContent = async (key: string, value: string): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('site_content')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) throw error;
    return true;
  } catch (e) { logSecureError('UpdateContent', e); return false; }
};

// --- STORE MANAGEMENT ---
export const addProduct = async (product: Omit<Product, 'id' | 'created_at'>): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('products').insert([product]);
    if (error) throw error;
    return true;
  } catch (e) { logSecureError('AddProduct', e); return false; }
};

export const deleteProduct = async (id: string): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) { logSecureError('DeleteProduct', e); return false; }
};

export const fetchPendingTestimonials = async (): Promise<Testimonial[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('approved', false);
    if (error) throw error;
    return data || [];
  } catch (e) { logSecureError('PendingTestimonials', e); return []; }
};

export const approveTestimonial = async (id: string): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('testimonials')
      .update({ approved: true })
      .eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) { logSecureError('ApproveTestimonial', e); return false; }
};
