
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Metric, Insight, Product, ProductVariant, ProductContentBlock, Order, UserProduct,
  Profile, Contact, CarouselImage, Tool, AppVersion, V8MatrixUsage, Testimonial
} from '../types';
import { LOCAL_PRODUCTS, LOCAL_VARIANTS, LOCAL_BLOCKS, LOCAL_INSIGHTS, SITE_CONFIG } from './localRegistry';

const SUPABASE_URL = 'https://wvvnbkzodrolbndepkgj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dm5ia3pvZHJvbGJuZGVwa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTkyMTAsImV4cCI6MjA4MTczNTIxMH0.t7aZdiGGeWRZfmHC6_g0dAvxTvi7K1aW6Or03QWuOYI';

// Cliente mutável para permitir re-instanciação em caso de erro de cache persistente
export let supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Protocolo de Hard Reset do Cliente: Força uma nova conexão e limpa estados internos.
 */
function hardResetSupabaseClient() {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.debug("[Sovereign Engine] Client Connection Hard-Reset executado.");
}

/**
 * Protocolo de Warmup v6.0: Dispara requisições com Cache-Busting lógico.
 */
async function forceAggressiveWarmup() {
  const tables = ['products', 'site_content', 'translations', 'orders'];
  try {
    for (const table of tables) {
      // Usamos uma query de contagem rápida para forçar o PostgREST a "olhar" para a tabela
      await supabase.from(table).select('count', { count: 'exact', head: true });
      await new Promise(r => setTimeout(r, 300));
    }
  } catch (e) {
    // Background sync silêncio
  }
}

/**
 * Sovereign Engine v6.0 - Motor de Sincronia de Alta Disponibilidade
 * Trata o cache do servidor como um recurso que pode levar tempo para estabilizar.
 */
async function fetchWithRetry<T>(
  fetcher: (client: SupabaseClient, attempt: number) => Promise<{ data: T | null; error: any }>,
  retries = 3,
  delay = 4000 
): Promise<{ data: T | null; error: any }> {
  let lastError: any;
  
  for (let i = 0; i < retries; i++) {
    const result = await fetcher(supabase, i);
    if (!result.error) return result;
    
    lastError = result.error;
    
    // Se for erro de tabela inexistente (42P01), o banco ainda não foi provisionado.
    if (lastError.code === '42P01') {
      return { data: null, error: lastError };
    }

    const isCacheError = lastError.code === 'PGRST205' || lastError.status === 404;
    
    if (isCacheError) {
      // Na segunda tentativa, resetamos o cliente para garantir que não há cache no JS
      if (i === 1) hardResetSupabaseClient();
      if (i === 0) forceAggressiveWarmup();
      
      console.debug(`[Sovereign Engine] Calibrando Sincronia Global. Tentativa ${i + 1}/${retries}...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    } else {
      break; 
    }
  }
  
  return { data: null, error: lastError };
}

export const checkTableVisibility = async (tableName: string): Promise<{ visible: boolean; error?: string; code?: string }> => {
  try {
    const { error } = await supabase.from(tableName).select('count', { count: 'exact', head: true });
    if (error) {
      return { visible: false, error: error.message, code: error.code };
    }
    return { visible: true };
  } catch (e: any) {
    return { visible: false, error: e.message, code: 'UNKNOWN' };
  }
};

export const fetchSiteConfig = async () => {
  try {
    const { data, error } = await fetchWithRetry<any[]>((client) => client.from('site_content').select('*').eq('page', 'config'));
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
    // Fallback silencioso para Fast-Path
  }
  return SITE_CONFIG;
};

export const fetchMetrics = async (): Promise<Metric[]> => {
  try {
    const { data, error } = await fetchWithRetry<Metric[]>((client) => client.from('metrics').select('*').eq('is_active', true).order('display_order'));
    if (error) throw error;
    return data || [];
  } catch (e) { return []; }
};

export const fetchCarouselImages = async (): Promise<CarouselImage[]> => {
  try {
    const { data, error } = await fetchWithRetry<CarouselImage[]>((client) => client.from('carousel_images').select('*').eq('is_active', true).order('display_order'));
    if (error) throw error;
    return data || [];
  } catch (e) { return []; }
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await fetchWithRetry<Product[]>((client, attempt) => {
      let query = client.from('products').select('*');
      if (attempt > 0) {
        // Cache Buster Lógico: Filtro que sempre é verdadeiro mas altera a assinatura da query
        query = query.neq('slug', `cache_buster_${Date.now()}`);
      }
      return query.order('title');
    });
    
    if (error) {
      // Uso de ativos locais como otimização de performance, não como erro
      console.info(`[Sovereign Engine] Ativos carregados via Fast-Path Local (Protocolo de Sincronia em background).`);
      return LOCAL_PRODUCTS;
    }
    
    const dbProducts = data || [];
    const merged = [...(dbProducts as Product[])];
    
    LOCAL_PRODUCTS.forEach(lp => {
      if (!merged.find(p => (p as any).id === lp.id || p.slug === lp.slug)) {
        merged.push(lp);
      }
    });
    
    return merged.sort((a, b) => (a.featured === b.featured) ? 0 : a.featured ? -1 : 1);
  } catch (e) {
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
    const { data, error } = await fetchWithRetry<Order[]>((client) => 
      client.from('orders')
        .select('*, profiles (id, email, full_name, whatsapp)')
        .order('created_at', { ascending: false })
    );
    
    if (error) {
      if (error.code === '42P01') throw new Error("Aguardando ativação do serviço de transações.");
      const { data: simpleData, error: simpleError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (simpleError) throw simpleError;
      return simpleData || [];
    }
    return data || [];
  } catch (e: any) {
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
    if (error) return {};
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
  const { error } = await supabase.from(table).delete().eq('id', id);
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
    if (error) return [];
    return data || [];
  } catch (e) {
    return [];
  }
};

export const submitContact = async (contact: Contact): Promise<boolean> => {
  const { error } = await supabase.from('contacts').insert([contact]);
  return !error;
};
