
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
 */
export const checkTableVisibility = async (tableName: string): Promise<{ visible: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from(tableName).select('count', { count: 'exact', head: true });
    if (error) {
      // PGRST205 ou 404 indicam que o cache do schema está quebrado ou a tabela não existe para a API
      return { visible: false, error: `${error.code}: ${error.message}` };
    }
    return { visible: true };
  } catch (e: any) {
    return { visible: false, error: e.message };
  }
};

export const fetchSiteConfig = async () => {
  try {
    const { data, error } = await supabase.from('site_content').select('*').eq('page', 'config');
    if (error) throw error;
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
  } catch (e) {
    console.warn("[Kernel] Usando SITE_CONFIG local devido a falha na sincronia.");
  }
  return SITE_CONFIG;
};

export const fetchMetrics = async (): Promise<Metric[]> => {
  try {
    const { data, error } = await supabase.from('metrics').select('*').eq('is_active', true).order('display_order');
    if (error) throw error;
    return data || [];
  } catch (e) { return []; }
};

export const fetchCarouselImages = async (): Promise<CarouselImage[]> => {
  try {
    const { data, error } = await supabase.from('carousel_images').select('*').eq('is_active', true).order('display_order');
    if (error) throw error;
    return data || [];
  } catch (e) { return []; }
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase.from('products').select('*').order('title');
    if (error) {
      console.error(`[Kernel] Erro na tabela 'products' (${error.code}). Ativando Local Fallback.`);
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
    console.error("[Kernel] Exceção crítica em fetchProducts. Ativando Local Fallback.");
    return LOCAL_PRODUCTS;
  }
};

export const fetchProductBySlug = async (slug: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    if (data) return data;
  } catch (e) {}
  return LOCAL_PRODUCTS.find(p => p.slug === slug) || null;
};

export const fetchProductVariants = async (productId: string): Promise<ProductVariant[]> => {
  try {
    const { data, error } = await supabase.from('product_variants').select('*').eq('product_id', productId).order('order_index');
    if (error) throw error;
    return (data && data.length > 0) ? data : (LOCAL_VARIANTS[productId] || []);
  } catch (e) {
    return LOCAL_VARIANTS[productId] || [];
  }
};

export const fetchProductContentBlocks = async (productId: string): Promise<ProductContentBlock[]> => {
  try {
    const { data, error } = await supabase.from('product_content_blocks').select('*').eq('product_id', productId).order('order');
    if (error) throw error;
    return (data && data.length > 0) ? data : (LOCAL_BLOCKS[productId] || []);
  } catch (e) {
    return LOCAL_BLOCKS[productId] || [];
  }
};

export const fetchInsights = async (): Promise<Insight[]> => {
  try {
    const { data, error } = await supabase.from('insights').select('*').eq('is_active', true).order('display_order');
    if (error) throw error;
    return (data && data.length > 0) ? data : LOCAL_INSIGHTS;
  } catch (e) {
    return LOCAL_INSIGHTS;
  }
};

export const fetchInsightById = async (id: string): Promise<Insight | null> => {
  try {
    const { data } = await supabase.from('insights').select('*').eq('id', id).maybeSingle();
    if (data) return data;
  } catch (e) {}
  return LOCAL_INSIGHTS.find(i => String(i.id) === String(id)) || null;
};

export const fetchAllOrders = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, profiles (id, email, full_name, whatsapp)')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.warn(`[SalesVault] Erro no fetch de ordens (${error.code}). Tentando fallback sem join.`);
      const { data: simpleData, error: simpleError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (simpleError) throw simpleError;
      return simpleData || [];
    }
    return data || [];
  } catch (e: any) {
    console.error("[SalesVault] Falha total no fetch de ordens:", e.message || e);
    throw e;
  }
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
    const { data, error } = await supabase.from('testimonials').select('*').eq('approved', true).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) { return []; }
};

export const fetchSiteContent = async (page: string): Promise<Record<string, any>> => {
  try {
    const { data, error } = await supabase.from('site_content').select('*').eq('page', page);
    if (error) throw error;
    const contentMap: Record<string, any> = {};
    data?.forEach(item => { contentMap[item.key] = item; });
    return contentMap;
  } catch (e) { return {}; }
};

export const fetchGlobalTranslations = async (lang: string): Promise<Record<string, string>> => {
  try {
    const { data, error } = await supabase.from('translations').select('*').eq('lang', lang);
    if (error) {
      console.warn(`[I18n] Falha ao carregar traduções para '${lang}' (${error.code}).`);
      return {};
    }
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
    const { data, error } = await supabase.from('tools').select('*').eq('is_active', true).order('name');
    if (error) {
      console.warn(`[Tools] Erro no fetch de ferramentas (${error.code}). Retornando lista vazia.`);
      return [];
    }
    return data || [];
  } catch (e) {
    return [];
  }
};

export const submitContact = async (contact: Contact): Promise<boolean> => {
  const { error } = await supabase.from('contacts').insert([contact]);
  return !error;
};
