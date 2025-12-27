import { createClient } from '@supabase/supabase-js';
import { 
  Metric, Insight, Product, ProductVariant, ProductContentBlock, Order, UserProduct,
  Profile, Contact, CarouselImage, Tool, AppVersion, V8MatrixUsage, Testimonial
} from '../types';
import { LOCAL_PRODUCTS, LOCAL_VARIANTS, LOCAL_BLOCKS, LOCAL_INSIGHTS, SITE_CONFIG } from './localRegistry';

const SUPABASE_URL = 'https://wvvnbkzodrolbndepkgj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dm5ia3pvZHJvbGJuZGVwa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTkyMTAsImV4cCI6MjA4MTczNTIxMH0.t7aZdiGGeWRZfmHC6_g0dAvxTvi7K1aW6Or03QWuOYI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- KERNEL DE CONFIGURAÇÃO (SOBERANIA FRONTEND) ---

export const fetchSiteConfig = () => {
  const localOverride = localStorage.getItem('CT_ADMIN_CONFIG_OVERRIDE');
  if (localOverride) {
    try {
      const parsed = JSON.parse(localOverride);
      return { ...SITE_CONFIG, ...parsed };
    } catch (e) {
      return SITE_CONFIG;
    }
  }
  return SITE_CONFIG;
};

// --- MODELO HÍBRIDO SOBERANO (LOCAL-FIRST) ---

export const fetchProducts = async (): Promise<Product[]> => {
  const config = fetchSiteConfig();
  if ((config as any)._products) return (config as any)._products;
  
  try {
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true);
    if (!error && data && data.length > 0) return data;
  } catch (e) {}
  return LOCAL_PRODUCTS;
};

export const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
  const config = fetchSiteConfig();
  if ((config as any)._products) {
    return (config as any)._products.find((p: any) => p.slug === slug) || null;
  }
  try {
    const { data } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
    if (data) return data;
  } catch (e) {}
  return LOCAL_PRODUCTS.find(p => p.slug === slug) || null;
};

export const fetchProductVariants = async (productId: string): Promise<ProductVariant[]> => {
  const config = fetchSiteConfig();
  if ((config as any)._variants?.[productId]) return (config as any)._variants[productId];

  try {
    const { data } = await supabase.from('product_variants').select('*').eq('product_id', productId).order('order_index');
    if (data && data.length > 0) return data;
  } catch (e) {}
  return LOCAL_VARIANTS[productId] || [];
};

export const fetchProductContentBlocks = async (productId: string): Promise<ProductContentBlock[]> => {
  const config = fetchSiteConfig();
  if ((config as any)._blocks?.[productId]) return (config as any)._blocks[productId];

  try {
    const { data } = await supabase.from('product_content_blocks').select('*').eq('product_id', productId).order('order');
    if (data && data.length > 0) return data;
  } catch (e) {}
  return LOCAL_BLOCKS[productId] || [];
};

// --- GESTÃO DE SEGURANÇA (SENSITIVE DATA - SUPABASE EXCLUSIVE) ---

export const fetchAppVersions = async (): Promise<AppVersion[]> => {
  const { data } = await supabase.from('app_versions').select('*').order('created_at', { ascending: false });
  return data || [];
};

export const fetchLatestVersion = async (appName: string): Promise<AppVersion | null> => {
  const { data } = await supabase.from('app_versions').select('*').eq('app_name', appName).order('created_at', { ascending: false }).limit(1).maybeSingle();
  return data;
};

export const createOrder = async (order: Partial<Order>): Promise<Order | null> => {
  const { data } = await supabase.from('orders').insert([order]).select().single();
  return data;
};

export const updateOrder = async (id: string, updates: Partial<Order>): Promise<Order | null> => {
  const { data } = await supabase.from('orders').update(updates).eq('id', id).select().single();
  return data;
};

export const fetchAllOrders = async (): Promise<Order[]> => {
  const { data } = await supabase.from('orders').select('*, profiles(*)').order('created_at', { ascending: false });
  return data || [];
};

// Fix: added fetchUserOrders to resolve import error in ClientPortal.tsx
export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  const { data } = await supabase.from('orders').select('*, profiles(*)').eq('user_id', userId).order('created_at', { ascending: false });
  return data || [];
};

export const getProfile = async (id: string): Promise<Profile | null> => {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  return data;
};

export const createProfile = async (profile: Profile) => {
  return await supabase.from('profiles').upsert([profile]);
};

// --- OUTROS MANTIDOS ---

export const fetchInsights = async (): Promise<Insight[]> => {
  try {
    const { data } = await supabase.from('insights').select('*').eq('is_active', true).order('display_order');
    if (data && data.length > 0) return data;
  } catch (e) {}
  return LOCAL_INSIGHTS;
};

// Fix: added fetchInsightById to resolve import error in ArticlePage.tsx
export const fetchInsightById = async (id: string): Promise<Insight | null> => {
  try {
    const { data } = await supabase.from('insights').select('*').eq('id', id).maybeSingle();
    if (data) return data;
  } catch (e) {}
  return LOCAL_INSIGHTS.find(i => String(i.id) === String(id)) || null;
};

export const fetchMetrics = async (): Promise<Metric[]> => {
  const { data } = await supabase.from('metrics').select('*').order('display_order');
  return data || [];
};

export const fetchCarouselImages = async (): Promise<CarouselImage[]> => {
  const { data } = await supabase.from('carousel_images').select('*').eq('is_active', true).order('display_order');
  return data || [];
};

export const signIn = async (email: string, password?: string) => {
  return password 
    ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
    : await supabase.auth.signInWithOtp({ email: email.trim() });
};

export const signUp = async (email: string, password?: string, metadata?: any) => {
  return await supabase.auth.signUp({ 
    email: email.trim(), 
    password,
    options: { data: metadata }
  });
};

export const signOut = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('supabase.auth.token');
};

export const logSupabaseError = (context: string, error: any) => {
  if (!error) return { isError: false, message: '', isMissingTable: false, isRlsError: false, code: '', suggestedSql: null };
  console.error(`[Supabase Error][${context}]`, error);
  return { 
    isError: true, 
    message: error.message, 
    code: error.code || '',
    isMissingTable: error.code === '42P01', 
    isRlsError: error.code === '42501',
    suggestedSql: null
  };
};

export const fetchTools = async (): Promise<Tool[]> => {
  const { data } = await supabase.from('tools').select('*').eq('is_active', true);
  return data || [];
};

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  const { data } = await supabase.from('testimonials').select('*').eq('approved', true);
  return data || [];
};

export const submitContact = async (contact: Contact): Promise<boolean> => {
  const { error } = await supabase.from('contacts').insert([contact]);
  return !error;
};

export const fetchUserProducts = async (userId: string): Promise<UserProduct[]> => {
  const { data } = await supabase.from('user_products').select('*').eq('user_id', userId);
  return data || [];
};

export const fetchUsageByProduct = async (userProductId: string): Promise<V8MatrixUsage | null> => {
  const { data } = await supabase.from('v8_matrix_usage').select('*').eq('user_product_id', userProductId).maybeSingle();
  return data;
};

export const fetchGlobalTranslations = async (lang: string): Promise<Record<string, string>> => {
  const { data } = await supabase.from('translations').select('key, value').eq('language', lang);
  const transMap: Record<string, string> = {};
  data?.forEach(item => { transMap[item.key] = item.value; });
  return transMap;
};

export const fetchSiteContent = async (page: string): Promise<Record<string, any>> => {
  const { data } = await supabase.from('site_content').select('*').eq('page', page);
  const contentMap: Record<string, any> = {};
  data?.forEach(item => { contentMap[item.key] = item; });
  return contentMap;
};
