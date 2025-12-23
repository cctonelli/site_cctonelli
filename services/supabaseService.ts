
import { createClient } from '@supabase/supabase-js';
import { 
  Metric, Insight, Product, 
  Testimonial, Profile, Contact, CarouselImage
} from '../types';

const SUPABASE_URL = 'https://wvvnbkzodrolbndepkgj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dm5ia3pvZHJvbGJuZGVwa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTkyMTAsImV4cCI6MjA4MTczNTIxMH0.t7aZdiGGeWRZfmHC6_g0dAvxTvi7K1aW6Or03QWuOYI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

export const subscribeToChanges = (table: string, callback: () => void) => {
  return supabase
    .channel(`public:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
};

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

export const signOut = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('supabase.auth.token');
};

export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
};

export const getProfile = async (id: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  } catch (err) {
    return null;
  }
};

export const fetchCarouselImages = async () => {
  const { data } = await supabase.from('carousel_images').select('*').order('display_order', { ascending: true });
  return data || [];
};

export const fetchInsights = async () => {
  const { data } = await supabase.from('insights').select('*').order('published_at', { ascending: false });
  return data || [];
};

export const fetchInsightById = async (id: string) => {
  const { data } = await supabase.from('insights').select('*').eq('id', id).single();
  return data;
};

export const fetchMetrics = async () => {
  const { data } = await supabase.from('metrics').select('*').order('display_order', { ascending: true });
  return data || [];
};

export const fetchProducts = async () => {
  const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  return data || [];
};

export const fetchTestimonials = async () => {
  const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
  return data || [];
};

export const fetchSiteContent = async (page: string) => {
  const { data } = await supabase.from('site_content').select('key, value').eq('page', page);
  return (data || []).reduce((acc: any, item: any) => ({ ...acc, [item.key]: item.value }), {});
};

export const submitContact = async (contact: Contact) => {
  const { error } = await supabase.from('contacts').insert([contact]);
  return !error;
};
