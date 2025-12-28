
import { createClient } from '@supabase/supabase-js';
import { 
  Metric, Insight, Product, ProductVariant, ProductContentBlock, Order, UserProduct,
  Profile, Contact, CarouselImage, Tool, AppVersion, V8MatrixUsage, Testimonial
} from '../types';
import { LOCAL_PRODUCTS, LOCAL_VARIANTS, LOCAL_BLOCKS, LOCAL_INSIGHTS, SITE_CONFIG } from './localRegistry';

/**
 * DATABASE POLICIES REQUIREMENTS (RLS):
 * 1. profiles: users can CRUD own, admin ALL.
 * 2. orders: users can Select/Insert own, admin ALL.
 * 3. products/insights/content: public SELECT, admin ALL.
 * 4. contacts: public INSERT, admin ALL.
 * 5. user_products: users select own, admin ALL.
 * 
 * Helper SQL for admin check:
 * CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
 * BEGIN RETURN (SELECT user_type FROM profiles WHERE id = auth.uid()) = 'admin'; END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 */

const SUPABASE_URL = 'https://wvvnbkzodrolbndepkgj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dm5ia3pvZHJvbGJuZGVwa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTkyMTAsImV4cCI6MjA4MTczNTIxMH0.t7aZdiGGeWRZfmHC6_g0dAvxTvi7K1aW6Or03QWuOYI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const fetchSiteConfig = async () => {
  try {
    const { data } = await supabase.from('site_content').select('*').eq('page', 'config');
    if (data && data.length > 0) {
      const dbConfig = { ...SITE_CONFIG };
      data.forEach(item => {
        const [field, subfield] = item.key.replace('setting_', '').split('_');
        if (field && subfield && (dbConfig as any)[field]) {
          (dbConfig as any)[field][subfield] = item.value;
        }
      });
      return dbConfig;
    }
  } catch (e) {}
  return SITE_CONFIG;
};

export const fetchProducts = async (): Promise<Product[]> => {
  const { data } = await supabase.from('products').select('*').order('title');
  return (data && data.length > 0) ? data : LOCAL_PRODUCTS;
};

export const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
  const { data } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
  if (data) return data;
  return LOCAL_PRODUCTS.find(p => p.slug === slug) || null;
};

export const fetchProductVariants = async (productId: string): Promise<ProductVariant[]> => {
  const { data } = await supabase.from('product_variants').select('*').eq('product_id', productId).order('order_index');
  return (data && data.length > 0) ? data : (LOCAL_VARIANTS[productId] || []);
};

export const fetchProductContentBlocks = async (productId: string): Promise<ProductContentBlock[]> => {
  const { data } = await supabase.from('product_content_blocks').select('*').eq('product_id', productId).order('order');
  return (data && data.length > 0) ? data : (LOCAL_BLOCKS[productId] || []);
};

export const fetchInsights = async (): Promise<Insight[]> => {
  const { data } = await supabase.from('insights').select('*').eq('is_active', true).order('display_order');
  return (data && data.length > 0) ? data : LOCAL_INSIGHTS;
};

export const fetchInsightById = async (id: string): Promise<Insight | null> => {
  const { data } = await supabase.from('insights').select('*').eq('id', id).maybeSingle();
  return data;
};

export const fetchMetrics = async (): Promise<Metric[]> => {
  const { data } = await supabase.from('metrics').select('*').order('display_order');
  return data || [];
};

export const fetchCarouselImages = async (): Promise<CarouselImage[]> => {
  const { data } = await supabase.from('carousel_images').select('*').eq('is_active', true).order('display_order');
  return data || [];
};

export const fetchAllOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, profiles:user_id(id, email, full_name, whatsapp)')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("[Supabase] Error fetching Sales Vault:", error.message);
  }
  return data || [];
};

export const getProfile = async (id: string): Promise<Profile | null> => {
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
  return data;
};

export const signOut = async () => {
  await supabase.auth.signOut();
};

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  const { data } = await supabase.from('testimonials').select('*').eq('approved', true).order('created_at', { ascending: false });
  return data || [];
};

export const fetchSiteContent = async (page: string): Promise<Record<string, any>> => {
  const { data } = await supabase.from('site_content').select('*').eq('page', page);
  const contentMap: Record<string, any> = {};
  data?.forEach(item => { contentMap[item.key] = item; });
  return contentMap;
};

export const fetchGlobalTranslations = async (lang: string): Promise<Record<string, string>> => {
  const { data } = await supabase.from('translations').select('*').eq('lang', lang);
  const transMap: Record<string, string> = {};
  data?.forEach(item => { transMap[item.key] = item.value; });
  return transMap;
};

export const signIn = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signUp = async (email: string, password: string, metadata: any) => {
  return await supabase.auth.signUp({ 
    email, 
    password, 
    options: { data: metadata } 
  });
};

export const createProfile = async (profile: Profile) => {
  return await supabase.from('profiles').upsert(profile);
};

export const createOrder = async (order: Partial<Order>): Promise<Order | null> => {
  const { data, error } = await supabase.from('orders').insert([order]).select().single();
  return data;
};

export const upsertItem = async (table: string, payload: any) => {
  return await supabase.from(table).upsert(payload).select();
};

export const deleteItem = async (table: string, id: string | number) => {
  return await supabase.from(table).delete().eq('id', id);
};

export const fetchUserProducts = async (userId: string): Promise<UserProduct[]> => {
  const { data } = await supabase.from('user_products').select('*').eq('user_id', userId).eq('approved_by_admin', true);
  return data || [];
};

export const fetchUsageByProduct = async (userProductId: string): Promise<V8MatrixUsage | null> => {
  const { data } = await supabase.from('v8_matrix_usage').select('*').eq('user_product_id', userProductId).maybeSingle();
  return data;
};

export const fetchTools = async (): Promise<Tool[]> => {
  const { data } = await supabase.from('tools').select('*').eq('is_active', true).order('name');
  return data || [];
};

export const submitContact = async (contact: Contact): Promise<boolean> => {
  const { error } = await supabase.from('contacts').insert([contact]);
  return !error;
};
