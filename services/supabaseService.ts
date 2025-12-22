
import { createClient } from '@supabase/supabase-js';
import { 
  Metric, Insight, Product, 
  Testimonial, Profile, Contact, CarouselImage
} from '../types';

const SUPABASE_URL = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 'https://wvvnbkzodrolbndepkgj.supabase.co';
const SUPABASE_ANON_KEY = (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dm5ia3pvZHJvbGJuZGVwa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTkyMTAsImV4cCI6MjA4MTczNTIxMH0.t7aZdiGGeWRZfmHC6_g0dAvxTvi7K1aW6Or03QWuOYI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// --- REALTIME HELPERS ---
export const subscribeToChanges = (table: string, callback: () => void) => {
  return supabase
    .channel(`public:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
};

// --- GENERIC TRANSLATIONS ENGINE ---
export const upsertTranslation = async (entityType: string, entityId: any, field: string, locale: string, value: string) => {
  const idStr = String(entityId);
  const { error } = await supabase.from('content_translations').upsert({
    entity_type: entityType,
    entity_id: idStr,
    field: field,
    locale: locale,
    value: value
  }, { onConflict: 'entity_type,entity_id,field,locale' });
  return !error;
};

export const fetchTranslationsForEntity = async (entityType: string, entityId: any) => {
  const idStr = String(entityId);
  const { data, error } = await supabase
    .from('content_translations')
    .select('field, locale, value')
    .eq('entity_type', entityType)
    .eq('entity_id', idStr);
  
  if (error) return {};
  
  return (data || []).reduce((acc: any, item) => {
    if (!acc[item.field]) acc[item.field] = {};
    acc[item.field][item.locale] = item.value;
    return acc;
  }, {});
};

// --- AUTH ---
export const signIn = async (email: string, password?: string) => {
  return password 
    ? await supabase.auth.signInWithPassword({ email, password })
    : await supabase.auth.signInWithOtp({ email });
};

export const signUp = async (email: string, password?: string, metadata?: Partial<Profile>) => {
  return await supabase.auth.signUp({
    email,
    password: password || 'temp-pass-123',
    options: { data: { ...metadata, user_type: 'client' } }
  });
};

export const signOut = async () => await supabase.auth.signOut();

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getProfile = async (id: string): Promise<Profile | null> => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  return error ? null : data;
};

// --- CONTENT FETCHING ---
export const fetchCarouselImages = async () => {
  const { data, error } = await supabase.from('carousel_images').select('*').eq('is_active', true).order('display_order', { ascending: true });
  return error ? [] : data || [];
};

export const fetchInsights = async () => {
  const { data, error } = await supabase.from('insights').select('*').eq('is_active', true).order('published_at', { ascending: false });
  return error ? [] : data || [];
};

export const fetchInsightById = async (id: string) => {
  const { data, error } = await supabase.from('insights').select('*').eq('id', id).single();
  return error ? null : data;
};

export const fetchMetrics = async () => {
  const { data, error } = await supabase.from('metrics').select('*').eq('is_active', true).order('display_order', { ascending: true });
  return error ? [] : data || [];
};

export const fetchProducts = async () => {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  return error ? [] : data || [];
};

export const fetchTestimonials = async () => {
  const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
  return error ? [] : data || [];
};

export const fetchSiteContent = async (page: string) => {
  const { data, error } = await supabase.from('site_content').select('key, value').eq('page', page);
  return (data || []).reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
};

export const fetchAllSiteContent = async () => {
  const { data, error } = await supabase.from('site_content').select('*').order('key', { ascending: true });
  return error ? [] : data || [];
};

export const fetchContacts = async () => {
  const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
  return error ? [] : data || [];
};

export const deleteContact = async (id: string) => {
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  return !error;
};

export const submitContact = async (contact: Contact) => {
  const { error } = await supabase.from('contacts').insert([contact]);
  return !error;
};

// --- ADMIN CMS ---
export const addInsight = async (insight: any) => {
  const { data, error } = await supabase.from('insights').insert([{ ...insight, published_at: new Date().toISOString() }]).select();
  return error ? null : data[0];
};

export const updateInsight = async (id: string, updates: Partial<Insight>) => {
  const { error } = await supabase.from('insights').update(updates).eq('id', id);
  return !error;
};

export const deleteInsight = async (id: string) => {
  const { error } = await supabase.from('insights').delete().eq('id', id);
  return !error;
};

export const updateTestimonial = async (id: string, updates: Partial<Testimonial>) => {
  const { error } = await supabase.from('testimonials').update(updates).eq('id', id);
  return !error;
};

export const deleteTestimonial = async (id: string) => {
  const { error } = await supabase.from('testimonials').delete().eq('id', id);
  return !error;
};

export const updateSiteContent = async (key: string, value: string, page: string = 'home') => {
  const { error } = await supabase.from('site_content').upsert({ key, value, page }, { onConflict: 'key' });
  return !error;
};

export const addProduct = async (product: any) => {
  const { error } = await supabase.from('products').insert([product]);
  return !error;
};

export const updateProduct = async (id: string, updates: Partial<Product>) => {
  const { error } = await supabase.from('products').update(updates).eq('id', id);
  return !error;
};

export const deleteProduct = async (id: string) => {
  const { error } = await supabase.from('products').delete().eq('id', id);
  return !error;
};

export const addMetric = async (metric: any) => {
  const { error } = await supabase.from('metrics').insert([metric]);
  return !error;
};

export const updateMetric = async (id: string, updates: Partial<Metric>) => {
  const { error } = await supabase.from('metrics').update(updates).eq('id', id);
  return !error;
};

export const deleteMetric = async (id: string) => {
  const { error } = await supabase.from('metrics').delete().eq('id', id);
  return !error;
};

export const addCarouselImage = async (image: any) => {
  const { data, error } = await supabase.from('carousel_images').insert([image]).select();
  return error ? null : data[0];
};

export const updateCarouselImage = async (id: string, updates: Partial<CarouselImage>) => {
  const { error } = await supabase.from('carousel_images').update(updates).eq('id', id);
  return !error;
};

export const deleteCarouselImage = async (id: string) => {
  const { error } = await supabase.from('carousel_images').delete().eq('id', id);
  return !error;
};
