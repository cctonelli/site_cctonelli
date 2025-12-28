
import { createClient } from '@supabase/supabase-js';
import { 
  Metric, Insight, Product, ProductVariant, ProductContentBlock, Order, UserProduct,
  Profile, Contact, CarouselImage, Tool, AppVersion, V8MatrixUsage, Testimonial
} from '../types';
import { LOCAL_PRODUCTS, LOCAL_VARIANTS, LOCAL_BLOCKS, LOCAL_INSIGHTS, SITE_CONFIG } from './localRegistry';

const SUPABASE_URL = 'https://wvvnbkzodrolbndepkgj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dm5ia3pvZHJvbGJuZGVwa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTkyMTAsImV4cCI6MjA4MTczNTIxMH0.t7aZdiGGeWRZfmHC6_g0dAvxTvi7K1aW6Or03QWuOYI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase.from('products').select('*').order('title');
    if (error) throw error;
    if (data && data.length > 0) return data;
  } catch (e) {
    console.warn("DB Products load fail, using local registry.");
  }
  return LOCAL_PRODUCTS;
};

export const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
  try {
    const { data } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
    if (data) return data;
  } catch (e) {}
  const products = await fetchProducts();
  return products.find(p => p.slug === slug) || null;
};

export const fetchProductVariants = async (productId: string): Promise<ProductVariant[]> => {
  try {
    const { data } = await supabase.from('product_variants').select('*').eq('product_id', productId).order('order_index');
    if (data && data.length > 0) return data;
  } catch (e) {}
  return LOCAL_VARIANTS[productId] || [];
};

export const fetchProductContentBlocks = async (productId: string): Promise<ProductContentBlock[]> => {
  try {
    const { data } = await supabase.from('product_content_blocks').select('*').eq('product_id', productId).order('order');
    if (data && data.length > 0) return data;
  } catch (e) {}
  return LOCAL_BLOCKS[productId] || [];
};

export const fetchInsights = async (): Promise<Insight[]> => {
  try {
    const { data } = await supabase.from('insights').select('*').eq('is_active', true).order('display_order');
    if (data && data.length > 0) return data;
  } catch (e) {}
  return LOCAL_INSIGHTS;
};

export const fetchInsightById = async (id: string): Promise<Insight | null> => {
  try {
    const { data } = await supabase.from('insights').select('*').eq('id', id).maybeSingle();
    if (data) return data;
  } catch (e) {}
  return null;
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
  // JOIN explícito com profiles para garantir que o Admin veja QUEM comprou
  const { data, error } = await supabase
    .from('orders')
    .select('*, profiles:user_id(id, email, full_name, whatsapp)')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Fetch Orders Error:", error);
    return [];
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
  try {
    const { data } = await supabase.from('testimonials').select('*').eq('approved', true).order('created_at', { ascending: false });
    return data || [];
  } catch (e) {
    return [];
  }
};

export const fetchSiteContent = async (page: string): Promise<Record<string, any>> => {
  try {
    const { data } = await supabase.from('site_content').select('*').eq('page', page);
    const contentMap: Record<string, any> = {};
    data?.forEach(item => {
      contentMap[item.key] = item;
    });
    return contentMap;
  } catch (e) {
    return {};
  }
};

export const fetchGlobalTranslations = async (lang: string): Promise<Record<string, string>> => {
  try {
    const { data } = await supabase.from('translations').select('*').eq('lang', lang);
    const transMap: Record<string, string> = {};
    data?.forEach(item => {
      transMap[item.key] = item.value;
    });
    return transMap;
  } catch (e) {
    return {};
  }
};

export const submitContact = async (contact: Contact): Promise<boolean> => {
  try {
    const { error } = await supabase.from('contacts').insert([contact]);
    return !error;
  } catch (e) {
    return false;
  }
};

export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  const { data } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  return data || [];
};

export const fetchUserProducts = async (userId: string): Promise<UserProduct[]> => {
  const { data } = await supabase.from('user_products').select('*').eq('user_id', userId).eq('approved_by_admin', true);
  return data || [];
};

export const fetchUsageByProduct = async (userProductId: string): Promise<V8MatrixUsage | null> => {
  const { data } = await supabase.from('v8_matrix_usage').select('*').eq('user_product_id', userProductId).maybeSingle();
  return data;
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
  try {
    const { data, error } = await supabase.from('orders').insert([order]).select().single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error("Order creation fail:", e);
    return null;
  }
};

export const fetchTools = async (): Promise<Tool[]> => {
  try {
    const { data } = await supabase.from('tools').select('*').eq('is_active', true).order('name');
    return data || [];
  } catch (e) {
    return [];
  }
};

// --- NOVAS FUNÇÕES DE PERSISTÊNCIA GLOBAL PARA ADMIN ---

export const upsertItem = async (table: string, payload: any) => {
  return await supabase.from(table).upsert(payload).select();
};

export const deleteItem = async (table: string, id: string | number) => {
  return await supabase.from(table).delete().eq('id', id);
};
