
import { createClient } from '@supabase/supabase-js';
import { 
  Metric, Insight, Product, ProductVariant, ProductContentBlock, Order, UserProduct,
  Profile, Contact, CarouselImage, Tool, AppVersion, V8MatrixUsage, Testimonial
} from '../types';
import { LOCAL_PRODUCTS, LOCAL_VARIANTS, LOCAL_BLOCKS, LOCAL_INSIGHTS, SITE_CONFIG } from './localRegistry';

const SUPABASE_URL = 'https://wvvnbkzodrolbndepkgj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dm5ia3pvZHJvbGJuZGVwa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTkyMTAsImV4cCI6MjA4MTczNTIxMH0.t7aZdiGGeWRZfmHC6_g0dAvxTvi7K1aW6Or03QWuOYI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- CONTEÚDO ESTRATÉGICO (FONTE ÚNICA: LOCAL_REGISTRY) ---

export const fetchProducts = async (): Promise<Product[]> => {
  return LOCAL_PRODUCTS;
};

export const fetchInsights = async (): Promise<Insight[]> => {
  return LOCAL_INSIGHTS;
};

export const fetchInsightById = async (id: string): Promise<Insight | null> => {
  return LOCAL_INSIGHTS.find(i => i.id === id) || null;
};

export const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
  return LOCAL_PRODUCTS.find(p => p.slug === slug) || null;
};

export const fetchProductVariants = async (productId: string): Promise<ProductVariant[]> => {
  return LOCAL_VARIANTS[productId] || [];
};

export const fetchProductContentBlocks = async (productId: string): Promise<ProductContentBlock[]> => {
  return LOCAL_BLOCKS[productId] || [];
};

export const fetchSiteConfig = () => {
  const localOverride = localStorage.getItem('CT_ADMIN_CONFIG_OVERRIDE');
  if (localOverride) {
    try {
      return JSON.parse(localOverride);
    } catch (e) {
      return SITE_CONFIG;
    }
  }
  return SITE_CONFIG;
};

// --- GESTÃO DE NEGÓCIOS E USUÁRIOS (STILL SUPABASE) ---

// Fix: Added missing fetchCarouselImages export
export const fetchCarouselImages = async (): Promise<CarouselImage[]> => {
  const { data } = await supabase.from('carousel_images').select('*').eq('is_active', true).order('display_order');
  return data || [];
};

// Fix: Added missing fetchSiteContent export
export const fetchSiteContent = async (page: string): Promise<Record<string, any>> => {
  const { data } = await supabase.from('site_content').select('*').eq('page', page);
  const contentMap: Record<string, any> = {};
  data?.forEach(item => {
    contentMap[item.key] = item;
  });
  return contentMap;
};

// Fix: Added missing fetchGlobalTranslations export
export const fetchGlobalTranslations = async (lang: string): Promise<Record<string, string>> => {
  const { data } = await supabase.from('translations').select('key, value').eq('language', lang);
  const transMap: Record<string, string> = {};
  data?.forEach(item => {
    transMap[item.key] = item.value;
  });
  return transMap;
};

export const fetchMetrics = async (): Promise<Metric[]> => {
  const { data } = await supabase.from('metrics').select('*').order('display_order');
  return data || [];
};

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  const { data } = await supabase.from('testimonials').select('*').eq('approved', true);
  return data || [];
};

// Fix: Added missing fetchTools export
export const fetchTools = async (): Promise<Tool[]> => {
  const { data } = await supabase.from('tools').select('*').eq('is_active', true);
  return data || [];
};

// Fix: Added missing submitContact export
export const submitContact = async (contact: Contact): Promise<boolean> => {
  const { error } = await supabase.from('contacts').insert([contact]);
  return !error;
};

export const createOrder = async (order: Partial<Order>): Promise<Order | null> => {
  const { data } = await supabase.from('orders').insert([order]).select().single();
  return data;
};

// Fix: Added missing updateOrder export
export const updateOrder = async (id: string, updates: Partial<Order>): Promise<boolean> => {
  const { error } = await supabase.from('orders').update(updates).eq('id', id);
  return !error;
};

export const fetchAllOrders = async (): Promise<Order[]> => {
  const { data } = await supabase.from('orders').select('*, profiles(*)').order('created_at', { ascending: false });
  return data || [];
};

// Fix: Added missing fetchUserOrders export
export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  const { data } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return data || [];
};

// Fix: Added missing fetchUserProducts export
export const fetchUserProducts = async (userId: string): Promise<UserProduct[]> => {
  const { data } = await supabase.from('user_products').select('*').eq('user_id', userId);
  return data || [];
};

// Fix: Added missing fetchUsageByProduct export
export const fetchUsageByProduct = async (userProductId: string): Promise<V8MatrixUsage | null> => {
  const { data } = await supabase.from('v8_matrix_usage').select('*').eq('user_product_id', userProductId).maybeSingle();
  return data;
};

export const getProfile = async (id: string): Promise<Profile | null> => {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  return data;
};

// Fix: Added missing createProfile export
export const createProfile = async (profile: Profile) => {
  return await supabase.from('profiles').upsert([profile]);
};

export const signIn = async (email: string, password?: string) => {
  return password 
    ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
    : await supabase.auth.signInWithOtp({ email: email.trim() });
};

// Fix: Added missing signUp export
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

// Fix: Updated logSupabaseError to return detailed error info required by Admin panel
export const logSupabaseError = (context: string, error: any) => {
  const info = {
    isError: !!error,
    message: error?.message || '',
    isMissingTable: error?.code === '42P01',
    isRlsError: error?.code === '42501',
    code: error?.code || '',
    suggestedSql: error?.code === '42501' ? `ALTER TABLE ${context.split('-')[1]?.trim()} ENABLE ROW LEVEL SECURITY;` : null
  };
  if (error) {
    console.error(`[Supabase Error][${context}]`, error);
  }
  return info;
};
