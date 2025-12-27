import { Product, ProductVariant, ProductContentBlock, Insight } from '../types';

export type Language = 'pt' | 'en' | 'es';

// --- KERNEL VISUAL TOTAL ---
export const SITE_CONFIG = {
  theme: {
    primary: '#2563eb', 
    secondary: '#b4975a', 
    bg_dark: '#010309',
    bg_light: '#ffffff',
    font_family_serif: "'Playfair Display', serif",
    font_family_sans: "'Inter', sans-serif"
  },
  ux: {
    matrix_mode: true,
    scanline_opacity: 0.05,
    glow_intensity: '0.4',
    border_radius_global: '2.5rem',
    font_size_base: '16px',
    h1_size: '9.5rem'
  },
  visibility: {
    hero: true,
    metrics: true,
    insights: true,
    products: true,
    strategy_map: true,
    tools: true,
    testimonials: true,
    contact_form: true,
    footer: true
  },
  contact: {
    email: 'contato@claudiotonelli.com.br',
    whatsapp: '+55 11 99999-9999',
    address: 'Av. Brigadeiro Faria Lima, São Paulo - SP',
    linkedin: 'https://linkedin.com/company/claudiotonelli',
    instagram: 'https://instagram.com/claudiotonelli'
  },
  seo: {
    title: { pt: 'Claudio Tonelli | Advisory de Elite', en: 'Claudio Tonelli | Elite Advisory', es: 'Claudio Tonelli | Advisory de Elite' },
    description: { pt: 'Consultoria estratégica de alta performance.', en: 'High-performance strategic consulting.', es: 'Consultoría estratégica de alto rendimiento' }
  },
  menus: {
    nav_strategy: { pt: 'Estratégia', en: 'Strategy', es: 'Estrategia' },
    nav_insights: { pt: 'Insights', en: 'Insights', es: 'Insights' },
    nav_performance: { pt: 'Performance', en: 'Performance', es: 'Rendimento' },
    nav_connection: { pt: 'Conexão', en: 'Connection', es: 'Conexión' },
    nav_client_area: { pt: 'Área do Cliente', en: 'Client Area', es: 'Área del Cliente' }
  }
};

// --- REPOSITÓRIO DE PRODUTOS ---
export const LOCAL_PRODUCTS: Product[] = [
  {
    id: '1549b854-3c86-4961-bc05-866609fe8d8e',
    slug: 'v8-matrix-edition',
    title: 'V8 MATRIX EDITION v12.5',
    subtitle: 'O Protocolo Definitivo de Escala e Domínio Digital.',
    description: 'Engenharia de disparos em massa com inteligência anti-banimento V5 e processamento multithread de elite.',
    image_url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop',
    featured: true,
    pricing_type: 'subscription',
    is_active: true
  }
];

export const LOCAL_VARIANTS: Record<string, ProductVariant[]> = {
  '1549b854-3c86-4961-bc05-866609fe8d8e': [
    {
      id: 'v8-elite',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      name: 'Elite Strategy',
      price: 1497.00,
      currency: 'BRL',
      interval: 'semester',
      quantity_limit: 1,
      features: ['5.000 Disparos Iniciais', 'Inteligência Anti-Ban V5', 'Suporte Executive 24/7'],
      is_most_popular: true,
      is_free: false,
      order_index: 0
    }
  ]
};

export const LOCAL_BLOCKS: Record<string, ProductContentBlock[]> = {
  '1549b854-3c86-4961-bc05-866609fe8d8e': [
    {
      id: '8d0cb912-e79f-4d65-85bf-051817ecf3ed',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      block_type: 'hero',
      order: 1,
      content: {
        style: "matrix",
        title: "SUPER DISPARADOR V8",
        subtitle: "A ferramenta mais indetectável e poderosa do Brasil",
        glitch_title: "MATRIX EDITION v12.5",
        overlay_text: "100% HUMANIZADO | 0% DETECTADO"
      }
    },
    {
      id: 'fa959930-2dce-459d-92bf-12be2af91c73',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      block_type: 'features',
      order: 2,
      content: {
        title: "TECNOLOGIA MATRIX ATIVADA",
        style: "glitch_grid",
        items: [
          { icon: "brain", text: "Humanização extrema com erros simulados" },
          { icon: "shield", text: "100% indetectável desde 2023" },
          { icon: "zap", text: "Duas threads simultâneas" }
        ]
      }
    },
    {
      id: 'c28d9c3e-7dcf-461d-9679-c9313cea00f6',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      block_type: 'comparison',
      order: 4,
      content: {
        style: "terminal_matrix",
        title: "ESCOLHA SEU NÍVEL DE PODER"
      }
    }
  ]
};

export const LOCAL_INSIGHTS: Insight[] = [];