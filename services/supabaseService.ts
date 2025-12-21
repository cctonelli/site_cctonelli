
import { createClient } from '@supabase/supabase-js';
import { Metric, Insight, Product, Testimonial } from '../types';

const SUPABASE_URL = 'https://wvvnbkzodrolbndepkgj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2dm5ia3pvZHJvbGJuZGVwa2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNTkyMTAsImV4cCI6MjA4MTczNTIxMH0.t7aZdiGGeWRZfmHC6_g0dAvxTvi7K1aW6Or03QWuOYI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const fetchMetrics = async (): Promise<Metric[]> => {
  try {
    const { data, error } = await supabase
      .from('metrics')
      .select('*')
      .order('id', { ascending: true });
      
    if (error) throw error;
    if (!data || data.length === 0) return getFallbackMetrics();
    
    return data.map(m => ({
      id: m.id?.toString(),
      label: m.label || m.name,
      value: parseFloat(m.value) || 0,
      suffix: m.suffix || '',
      description: m.description || ''
    }));
  } catch (err) {
    console.error('Error fetching metrics:', err instanceof Error ? err.message : JSON.stringify(err));
    return getFallbackMetrics();
  }
};

export const fetchInsights = async (): Promise<Insight[]> => {
  try {
    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    if (!data || data.length === 0) return getFallbackInsights();
    
    return data.map(i => ({
      id: i.id?.toString(),
      title: i.title,
      category: i.category,
      excerpt: i.excerpt || i.description || i.content?.substring(0, 100),
      date: i.date || new Date(i.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      imageUrl: i.image_url || i.imageUrl || `https://picsum.photos/seed/${i.id}/800/600`
    }));
  } catch (err) {
    console.error('Error fetching insights:', err instanceof Error ? err.message : JSON.stringify(err));
    return getFallbackInsights();
  }
};

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*');
      
    if (error) throw error;
    if (!data || data.length === 0) return getFallbackProducts();
    
    return data.map(p => ({
      id: p.id?.toString(),
      name: p.name,
      description: p.description,
      price: parseFloat(p.price),
      type: p.type,
      config: p.config || {}
    }));
  } catch (err) {
    console.error('Error fetching products:', err instanceof Error ? err.message : JSON.stringify(err));
    return getFallbackProducts();
  }
};

export const fetchTestimonials = async (): Promise<Testimonial[]> => {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*');
      
    if (error) throw error;
    if (!data || data.length === 0) return getFallbackTestimonials();
    
    return data.map(t => ({
      id: t.id?.toString(),
      name: t.name,
      role: t.role,
      company: t.company,
      content: t.content,
      avatarUrl: t.avatar_url || t.avatarUrl || `https://i.pravatar.cc/150?u=${t.id}`
    }));
  } catch (err) {
    console.error('Error fetching testimonials:', err instanceof Error ? err.message : JSON.stringify(err));
    return getFallbackTestimonials();
  }
};

// Fallback data functions
const getFallbackMetrics = (): Metric[] => [
  { id: '1', label: 'Projetos Entregues', value: 450, suffix: '+', description: 'Eficiência e resultados tangíveis.' },
  { id: '2', label: 'Retorno sobre Investimento', value: 32, suffix: '%', description: 'Média de ganho reportado por clientes.' },
  { id: '3', label: 'Satisfação do Cliente', value: 98, suffix: '%', description: 'Net Promoter Score (NPS) de excelência.' },
  { id: '4', label: 'Países Atendidos', value: 12, suffix: '', description: 'Presença global e adaptabilidade cultural.' },
];

const getFallbackInsights = (): Insight[] => [
  {
    id: '1',
    title: 'A Nova Era da Gestão 5.0',
    category: 'Estratégia',
    excerpt: 'Como a inteligência artificial está moldando a tomada de decisão no C-Level.',
    date: 'Maio 2025',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop'
  },
  {
    id: '2',
    title: 'Sustentabilidade como Driver de Lucro',
    category: 'ESG',
    excerpt: 'Por que empresas focadas em ESG estão superando o mercado em 20%.',
    date: 'Abril 2025',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=2070&auto=format&fit=crop'
  },
  {
    id: '3',
    title: 'Resiliência Digital nas Operações',
    category: 'Tecnologia',
    excerpt: 'Protegendo a cadeia de suprimentos contra rupturas globais.',
    date: 'Março 2025',
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop'
  }
];

const getFallbackProducts = (): Product[] => [
  {
    id: 'p1',
    name: 'Workshop de Liderança Exponencial',
    description: 'Treinamento intensivo para executivos focados no futuro.',
    price: 1500,
    type: 'service',
    config: { duration: '2 dias' }
  },
  {
    id: 'p2',
    name: 'Dashboard de Métricas em Tempo Real',
    description: 'Acesso vitalício à nossa ferramenta de BI personalizada.',
    price: 2900,
    type: 'product',
    config: { license: 'Enterprise' }
  }
];

const getFallbackTestimonials = (): Testimonial[] => [
  {
    id: 't1',
    name: 'Carlos Mendes',
    role: 'CEO',
    company: 'LogTech Global',
    content: 'A consultoria do Claudio Tonelli mudou nossa visão de escala. Em 6 meses, dobramos nossa eficiência operacional.',
    avatarUrl: 'https://i.pravatar.cc/150?u=carlos'
  },
  {
    id: 't2',
    name: 'Ana Silva',
    role: 'Diretora de Inovação',
    company: 'EnergyCo',
    content: 'Profissionalismo impecável e insights que realmente movem o ponteiro do negócio.',
    avatarUrl: 'https://i.pravatar.cc/150?u=ana'
  }
];
