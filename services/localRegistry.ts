
import { Product, ProductVariant, ProductContentBlock, Insight } from '../types';

export type Language = 'pt' | 'en' | 'es';

// --- CONFIGURAÇÃO VISUAL E DE DESIGN (O CORAÇÃO ESTÉTICO) ---
export const SITE_CONFIG = {
  theme: {
    primary: '#2563eb', // Azul Tonelli
    secondary: '#b4975a', // Gold
    bg_dark: '#010309',
    bg_light: '#ffffff',
    font_family_serif: "'Playfair Display', serif",
    font_family_sans: "'Inter', sans-serif",
    font_size_base: '16px',
    border_radius: '2.5rem',
    container_width: '1280px'
  },
  menus: {
    nav_strategy: { pt: 'Estratégia', en: 'Strategy', es: 'Estrategia' },
    nav_insights: { pt: 'Insights', en: 'Insights', es: 'Insights' },
    nav_performance: { pt: 'Performance', en: 'Performance', es: 'Rendimiento' },
    nav_connection: { pt: 'Conexão', en: 'Connection', es: 'Conexión' },
    nav_client_area: { pt: 'Área do Cliente', en: 'Client Area', es: 'Área del Cliente' }
  },
  seo: {
    title: { pt: 'Claudio Tonelli | Advisory de Elite', en: 'Claudio Tonelli | Elite Advisory', es: 'Claudio Tonelli | Advisory de Elite' },
    description: { pt: 'Consultoria estratégica de alta performance.', en: 'High-performance strategic consulting.', es: 'Consultoría estratégica de alto rendimiento' }
  }
};

// --- REPOSITÓRIO DE INSIGHTS (CONTEÚDO ESTRATÉGICO PERMANENTE) ---
export const LOCAL_INSIGHTS: Insight[] = [
  {
    id: 'insight-v8-launch',
    title: 'A Era do V8 MATRIX: Automação e Domínio',
    subtitle: 'O salto tecnológico no Advisory Digital.',
    excerpt: 'Como a nova versão 11.0 está redefinindo o ROI de nossos parceiros.',
    image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop',
    published_at: '2025-05-20T10:00:00Z',
    is_active: true,
    display_order: 0,
    category: 'TECNOLOGIA',
    link: null,
    content: `<h2>O Protocolo V8 Matrix</h2><p>O rigor da consultoria tradicional encontrou seu sucessor digital. O V8 não é apenas um disparador; é uma rede neural de engajamento.</p>`
  }
];

// --- REPOSITÓRIO DE PRODUTOS ---
export const LOCAL_PRODUCTS: Product[] = [
  {
    id: 'v8-matrix-id',
    slug: 'disparador-whatsapp-v8-matrix',
    title: 'V8 MATRIX EDITION v11.0',
    subtitle: 'O Protocolo Definitivo de Escala e Domínio Digital.',
    description: 'Engenharia de disparos em massa com inteligência anti-banimento e processamento em multithread.',
    image_url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop',
    featured: true,
    pricing_type: 'subscription',
    is_active: true,
    download_ftp_link: 'https://ftp.claudiotonelli.com.br/v8-matrix-latest.zip'
  }
];

export const LOCAL_VARIANTS: Record<string, ProductVariant[]> = {
  'v8-matrix-id': [
    {
      id: 'v8-elite',
      product_id: 'v8-matrix-id',
      name: 'Elite Strategy',
      price: 1497.00,
      currency: 'BRL',
      interval: 'semester',
      quantity_limit: 1,
      features: ['5.000 Disparos Iniciais', 'Inteligência Anti-Ban V4', 'Suporte Executive 24/7', 'Acesso ao Advisory Group'],
      is_most_popular: true,
      is_free: false,
      order_index: 0
    }
  ]
};

export const LOCAL_BLOCKS: Record<string, ProductContentBlock[]> = {
  'v8-matrix-id': [
    {
      id: 'b1',
      product_id: 'v8-matrix-id',
      block_type: 'hero',
      order: 0,
      content: {
        title: 'V8 MATRIX',
        glitch_title: 'SYSTEM_OVERRIDE',
        subtitle: 'A ferramenta que as grandes consultorias usam para dominar o tráfego orgânico e direto.',
        overlay_text: 'PROTOCOL_V11_ACTIVE',
        video_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      }
    }
  ]
};
