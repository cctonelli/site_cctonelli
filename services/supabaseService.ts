
import { Metric, Insight, Product, Testimonial } from '../types';

/**
 * Note: In a production environment, you would use @supabase/supabase-js 
 * and initialize with process.env.SUPABASE_URL and process.env.SUPABASE_ANON_KEY.
 * This service provides the logic structure for Claudio Tonelli's specific tables.
 */

export const fetchMetrics = async (): Promise<Metric[]> => {
  // Simulate API call to 'metrics' table
  return [
    { id: '1', label: 'Projetos Entregues', value: 450, suffix: '+', description: 'Eficiência e resultados tangíveis.' },
    { id: '2', label: 'Retorno sobre Investimento', value: 32, suffix: '%', description: 'Média de ganho reportado por clientes.' },
    { id: '3', label: 'Satisfação do Cliente', value: 98, suffix: '%', description: 'Net Promoter Score (NPS) de excelência.' },
    { id: '4', label: 'Países Atendidos', value: 12, suffix: '', description: 'Presença global e adaptabilidade cultural.' },
  ];
};

export const fetchInsights = async (): Promise<Insight[]> => {
  // Simulate API call to 'insights' table
  return [
    {
      id: '1',
      title: 'A Nova Era da Gestão 5.0',
      category: 'Estratégia',
      excerpt: 'Como a inteligência artificial está moldando a tomada de decisão no C-Level.',
      date: 'Maio 2025',
      imageUrl: 'https://picsum.photos/seed/insight1/800/600'
    },
    {
      id: '2',
      title: 'Sustentabilidade como Driver de Lucro',
      category: 'ESG',
      excerpt: 'Por que empresas focadas em ESG estão superando o mercado em 20%.',
      date: 'Abril 2025',
      imageUrl: 'https://picsum.photos/seed/insight2/800/600'
    },
    {
      id: '3',
      title: 'Resiliência Digital nas Operações',
      category: 'Tecnologia',
      excerpt: 'Protegendo a cadeia de suprimentos contra rupturas globais.',
      date: 'Março 2025',
      imageUrl: 'https://picsum.photos/seed/insight3/800/600'
    }
  ];
};

export const fetchProducts = async (): Promise<Product[]> => {
  // Simulate API call to 'products' table (requested by Grok)
  return [
    {
      id: 'p1',
      name: 'Workshop de Liderança Exponencial',
      description: 'Treinamento intensivo para executivos focados no futuro.',
      price: 1500,
      type: 'service',
      config: { duration: '2 days' }
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
};
