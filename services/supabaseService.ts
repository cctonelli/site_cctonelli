
import { createClient } from '@supabase/supabase-js';
import { 
  Metric, Insight, Product, ProductVariant, ProductContentBlock, Order, UserProduct,
  Profile, Contact, CarouselImage, Tool, AppVersion, V8MatrixUsage, Testimonial
} from '../types';
import { LOCAL_PRODUCTS, LOCAL_VARIANTS, LOCAL_BLOCKS, LOCAL_INSIGHTS, SITE_CONFIG } from './localRegistry';

const SUPABASE_URL = 'https://wvvnbkzodrolbndepkgj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dm5ia3pvZHJvbGJuZGVwa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTkyMTAsImV4cCI6MjA4MTczNTIxMH0.t7aZdiGGeWRZfmHC6_g0dAvxTvi7K1aW6Or03QWuOYI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Diagnóstico de Schema: Verifica se uma tabela é visível para o PostgREST.
 * Útil para identificar o erro PGRST205 em tempo real.
 */
export const checkTableVisibility = async (tableName: string): Promise<{ visible: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from(tableName).select('count', { count: 'exact', head: true });
    if (error) {
      return { visible: false, error: `${error.code}: ${error.message}` };
    }
    return { visible: true };
  } catch (e: any) {
    return { visible: false, error: e.message };
  }
};

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

export const fetchMetrics = async (): Promise<Metric[]> => {
  try {
    const { data } = await supabase.from('metrics').select('*').eq('is_active', true).order('display_order');
    return data || [];
  } catch (e) {
    return [];
  }
};

export const fetchCarouselImages = async (): Promise<CarouselImage[]> => {
  try {
    const { data } = await supabase.from('carousel_images').select('*').eq('is_active', true).order('display_order');
    return data || [];
  } catch (e) {
    return [];
  }
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase.from('products').select('*').order('title');
    if (error) {
      console.warn("[Kernel] Falha ao carregar produtos (Provável PGRST205):", error.message);
      return LOCAL_PRODUCTS;
    }
    const dbProducts = data || [];
    const merged = [...dbProducts];
    LOCAL_PRODUCTS.forEach(lp => {
      if (!merged.find(p => p.id === lp.id || p.slug === lp.slug)) {
        merged.push(lp);
      }
    });
    return merged.sort((a, b) => (a.featured === b.featured) ? 0 : a.featured ? -1 : 1);
  } catch (e) {
    return LOCAL_PRODUCTS;
  }
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
  try {
    const { data } = await supabase.from('insights').select('*').eq('id', id).maybeSingle();
    if (data) return data;
  } catch (e) {}
  return LOCAL_INSIGHTS.find(i => String(i.id) === String(id)) || null;
};

export const fetchAllOrders = async (): Promise<Order[]> => {
  console.log("[SalesVault] Iniciando fetch de ordens...");
  
  // TENTATIVA 1: Consulta Completa com Relacionamentos
  const { data, error } = await supabase
    .from('orders')
    .select('*, profiles (id, email, full_name, whatsapp)')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("[SalesVault] Erro na consulta de ordens:", error.code, error.message);
    
    // Fallback: Tentar sem Join para descartar erro de FK corrompida no cache
    const { data: simpleData, error: simpleError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (simpleError) {
      console.error("[SalesVault] Falha total em ordens:", simpleError.code, simpleError.message);
      throw simpleError;
    }
    
    console.log("[SalesVault] Fallback simples funcionou. O problema está no JOIN/Profiles.");
    return simpleData || [];
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
  try {
    const { data } = await supabase.from('translations').select('*').eq('lang', lang);
    const transMap: Record<string, string> = {};
    data?.forEach(item => { transMap[item.key] = item.value; });
    return transMap;
  } catch (e) {
    return {};
  }
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
  if (error) throw error;
  return data;
};

export const upsertItem = async (table: string, payload: any) => {
  const { data, error } = await supabase.from(table).upsert(payload).select();
  if (error) throw error;
  return data;
};

export const deleteItem = async (table: string, id: string | number) => {
  const { error } = await supabase.from(table).delete().match({ id });
  if (error) throw error;
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
  try {
    const { data } = await supabase.from('tools').select('*').eq('is_active', true).order('name');
    return data || [];
  } catch (e) {
    return [];
  }
};

export const submitContact = async (contact: Contact): Promise<boolean> => {
  const { error } = await supabase.from('contacts').insert([contact]);
  return !error;
};
