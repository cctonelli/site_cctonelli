
import { createClient } from '@supabase/supabase-js';
import { 
  CarouselImage, Metric, Insight, Product, 
  Testimonial, Profile, SiteContent, Contact 
} from '../types';

// As chaves devem ser configuradas nas variáveis de ambiente do Vercel/GitHub
// NUNCA hardcode chaves secretas (service_role) no frontend.
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Inicialização segura do cliente
export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * Log de erro seguro: evita expor objetos de erro brutos que podem conter 
 * informações de infraestrutura no console do cliente.
 */
const logSecureError = (context: string, error: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Internal Debug] ${context}:`, error);
  } else {
    // Em produção, logamos apenas uma mensagem genérica para não dar pistas a atacantes
    console.warn(`Acesso ao recurso [${context}] indisponível no momento.`);
  }
};

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
  } catch (e) {
    logSecureError('Carousel', e);
    return [];
  }
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
  } catch (e) {
    logSecureError('Metrics', e);
    return [];
  }
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
  } catch (e) {
    logSecureError('Insights', e);
    return [];
  }
};

export const fetchProducts = async (): Promise<Product[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');
    if (error) throw error;
    return data || [];
  } catch (e) {
    logSecureError('Products', e);
    return [];
  }
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
  } catch (e) {
    logSecureError('Testimonials', e);
    return [];
  }
};

export const submitContact = async (contact: Contact): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('contacts').insert([contact]);
    if (error) throw error;
    return true;
  } catch (e) {
    logSecureError('Contact Submit', e);
    return false;
  }
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
  } catch (e) {
    logSecureError('SiteContent', e);
    return {};
  }
};
