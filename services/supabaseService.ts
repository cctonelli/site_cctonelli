import { createClient } from '@supabase/supabase-js';
import { 
  Metric, Insight, Product, ProductVariant, ProductContentBlock, Order, UserProduct,
  Testimonial, Profile, Contact, CarouselImage, Tool
} from '../types';

/**
 * CONFIGURAÇÃO OFICIAL - CLAUDIO TONELLI ADVISORY CORE v9.0-ELITE
 * Integrado com as políticas RLS auditadas em 26/12/2025.
 */
const SUPABASE_URL = 'https://wvvnbkzodrolbndepkgj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dm5ia3pvZHJvbGJuZGVwa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTkyMTAsImV4cCI6MjA4MTczNTIxMH0.t7aZdiGGeWRZfmHC6_g0dAvxTvi7K1aW6Or03QWuOYI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  },
  global: {
    headers: { 'x-application-name': 'ct-advisory-elite' }
  }
});

const cleanTableName = (name: string) => name.replace('public.', '').trim();

/**
 * Diagnóstico de Erros Críticos v9.0-ELITE
 */
export const logSupabaseError = (context: string, error: any) => {
  if (error) {
    const message = error.message || 'Unknown Error';
    const code = error.code || 'N/A';
    
    // PGRST205: Cache de schema do PostgREST desatualizado
    const isMissingTable = code === '42P01' || message.includes('PGRST205');
    const isRlsError = code === '42501' || message.includes('row-level security');
    
    console.warn(`[DB DIAGNOSTIC - ${context}] ${message} (Code: ${code})`);
    
    const recoverySql = `-- REPARAÇÃO DE ELITE\nNOTIFY pgrst, 'reload schema';\nGRANT USAGE ON SCHEMA public TO anon, authenticated;`.trim();
    
    return { isError: true, message, code, suggestedSql: recoverySql, isMissingTable, isRlsError };
  }
  return { isError: false, isMissingTable: false, isRlsError: false };
};

export const fetchTools = async (): Promise<Tool[]> => {
  const { data, error } = await supabase.from(cleanTableName('tools')).select('*').eq('is_active', true);
  if (logSupabaseError('fetchTools', error).isError) return [];
  return data || [];
};

export const fetchProducts = async (onlyActive = true): Promise<Product[]> => {
  let query = supabase.from(cleanTableName('products')).select('*').order('featured', { ascending: false });
  if (onlyActive) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (logSupabaseError('fetchProducts', error).isError) return [];
  return data || [];
};

export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from(cleanTableName('orders'))
    .select('*, profiles(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (logSupabaseError('fetchUserOrders', error).isError) return [];
  return data || [];
};

export const fetchAllOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from(cleanTableName('orders'))
    .select('*, profiles(*)')
    .order('created_at', { ascending: false });
  if (logSupabaseError('fetchAllOrders', error).isError) return [];
  return data || [];
};

export const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
  const { data, error } = await supabase.from(cleanTableName('products')).select('*').eq('slug', slug).single();
  if (logSupabaseError('fetchProductBySlug', error).isError) return null;
  return data;
};

export const fetchProductVariants = async (productId: string): Promise<ProductVariant[]> => {
  const { data, error } = await supabase.from(cleanTableName('product_variants')).select('*').eq('product_id', productId).order('order_index');
  if (logSupabaseError('fetchProductVariants', error).isError) return [];
  return data || [];
};

export const fetchProductContentBlocks = async (productId: string): Promise<ProductContentBlock[]> => {
  const { data, error } = await supabase.from(cleanTableName('product_content_blocks')).select('*').eq('product_id', productId).order('order');
  if (logSupabaseError('fetchProductContentBlocks', error).isError) return [];
  return data || [];
};

export const createOrder = async (order: Partial<Order>): Promise<Order | null> => {
  const { data, error } = await supabase.from(cleanTableName('orders')).insert([order]).select().single();
  if (logSupabaseError('createOrder', error).isError) return null;
  return data;
};

export const updateOrder = async (id: string, updates: Partial<Order>) => {
  const { error } = await supabase.from(cleanTableName('orders')).update(updates).eq('id', id);
  return logSupabaseError('updateOrder', error);
};

export const createUserProduct = async (userProduct: Partial<UserProduct>) => {
  const { error } = await supabase.from(cleanTableName('user_products')).insert([userProduct]);
  return logSupabaseError('createUserProduct', error);
};

export const fetchCarouselImages = async (): Promise<CarouselImage[]> => {
  const { data, error } = await supabase.from(cleanTableName('carousel_images')).select('*').eq('is_active', true).order('display_order');
  if (logSupabaseError('fetchCarouselImages', error).isError) return [];
  return data || [];
};

export const fetchMetrics = async (): Promise<Metric[]> => {
  const { data, error } = await supabase.from(cleanTableName('metrics')).select('*').eq('is_active', true).order('display_order');
  if (logSupabaseError('fetchMetrics', error).isError) return [];
  return data || [];
};

export const fetchInsights = async (): Promise<Insight[]> => {
  const { data, error } = await supabase.from(cleanTableName('insights')).select('*').eq('is_active', true).order('display_order');
  if (logSupabaseError('fetchInsights', error).isError) return [];
  return data || [];
};

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  const { data, error } = await supabase.from(cleanTableName('testimonials')).select('*').eq('approved', true).order('created_at', { ascending: false });
  if (logSupabaseError('fetchTestimonials', error).isError) return [];
  return data || [];
};

export const fetchSiteContent = async (page: string): Promise<Record<string, any>> => {
  const { data, error } = await supabase.from(cleanTableName('site_content')).select('*').eq('page', page);
  if (logSupabaseError('fetchSiteContent', error).isError) return {};
  return (data || []).reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr }), {});
};

export const fetchGlobalTranslations = async (locale: string): Promise<Record<string, string>> => {
  const { data, error } = await supabase.from(cleanTableName('content_translations')).select('field, value').eq('locale', locale);
  if (error) return {};
  return (data || []).reduce((acc: any, curr: any) => ({ ...acc, [curr.field]: curr.value }), {});
};

export const getProfile = async (id: string): Promise<Profile | null> => {
  const { data, error } = await supabase.from(cleanTableName('profiles')).select('*').eq('id', id).single();
  if (error) return null;
  return data;
};

export const fetchUserProducts = async (userId: string): Promise<UserProduct[]> => {
  const { data, error } = await supabase.from(cleanTableName('user_products')).select('*').eq('user_id', userId);
  if (logSupabaseError('fetchUserProducts', error).isError) return [];
  return data || [];
};

export const signIn = async (email: string, password?: string) => {
  const cleanEmail = email.trim();
  return password 
    ? await supabase.auth.signInWithPassword({ email: cleanEmail, password })
    : await supabase.auth.signInWithOtp({ email: cleanEmail });
};

export const signUp = async (email: string, password: string, metadata: any) => {
  const cleanEmail = email.trim();
  return await supabase.auth.signUp({
    email: cleanEmail, 
    password, 
    options: { data: metadata, emailRedirectTo: window.location.origin }
  });
};

export const createProfile = async (profile: Profile) => {
  const { error } = await supabase.from(cleanTableName('profiles')).upsert(profile, { onConflict: 'id' });
  return logSupabaseError('createProfile', error);
};

export const signOut = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('supabase.auth.token');
};

export const submitContact = async (contact: Contact): Promise<boolean> => {
  const { error } = await supabase.from(cleanTableName('contacts')).insert([contact]);
  return !logSupabaseError('submitContact', error).isError;
};

export const fetchInsightById = async (id: string | number): Promise<Insight | null> => {
  const { data, error } = await supabase.from(cleanTableName('insights')).select('*').eq('id', id).single();
  if (logSupabaseError('fetchInsightById', error).isError) return null;
  return data;
};
