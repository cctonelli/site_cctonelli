import { Product, ProductVariant, ProductContentBlock, Insight } from '../types';

export type Language = 'pt' | 'en' | 'es';

// --- KERNEL VISUAL & NARRATIVO TOTAL v15.5 ---
export const SITE_CONFIG = {
  theme: {
    primary: '#00ff41', // Verde Matrix Neon
    secondary: '#b4975a', // Dourado Advisory
    bg_dark: '#010309',
    bg_light: '#ffffff',
    text_main: '#f8fafc',
    text_secondary: '#94a3b8',
    font_family_serif: "'Playfair Display', serif",
    font_family_sans: "'Inter', sans-serif"
  },
  typography: {
    h1_size: '9.5rem',
    h2_size: '4.5rem',
    body_size: '1.125rem',
    line_height: '1.6',
    letter_spacing: '-0.02em',
    cap_drop: true // Estilo Jornal: Primeira letra grande
  },
  ux: {
    matrix_mode: true,
    matrix_speed: 1.8,
    matrix_opacity: 0.2,
    scanline_opacity: 0.08,
    glow_intensity: '0.6',
    border_radius_global: '2.5rem'
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
    whatsapp: '+55 44 99732-8888',
    address: 'Executive Strategy Hub - Global Presence',
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

export const LOCAL_PRODUCTS: Product[] = [
  {
    id: 'v8-matrix-id',
    slug: 'v8-matrix-edition',
    title: 'V8 MATRIX EDITION v6.0.0',
    subtitle: 'O Protocolo Definitivo de Escala e Domínio Digital.',
    description: 'Engenharia de disparos em massa humanizada com inteligência de cadência por período (Dayparting), micro-interações de interface e algoritmos anti-banimento v6.0.',
    image_url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop',
    featured: true,
    pricing_type: 'subscription',
    is_active: true
  }
];

export const LOCAL_VARIANTS: Record<string, ProductVariant[]> = {
  'v8-matrix-id': [
    {
      id: 'v8-elite',
      product_id: 'v8-matrix-id',
      name: 'Elite Matrix',
      price: 1497.00,
      currency: 'BRL',
      interval: 'semester',
      quantity_limit: 1,
      features: ['Dayparting Inteligente', 'Mouse Curves (Antiban)', 'Multi-Thread v6 Core'],
      is_most_popular: true,
      is_free: false,
      order_index: 0
    }
  ]
};

export const LOCAL_BLOCKS: Record<string, ProductContentBlock[]> = {
  'v8-matrix-id': [
    {
      id: 'b1-v8',
      product_id: 'v8-matrix-id',
      block_type: 'hero',
      order: 1,
      content: {
        style: "matrix",
        matrix_color: "#00ff41",
        title: "V8 MATRIX v6.0",
        subtitle: "Engenharia de disparos indetectável com alma humana.",
        glitch_title: "SYSTEM_SOVEREIGN_V6",
        overlay_text: "ACTIVE_PROTOCOL_NEON_GREEN"
      }
    }
  ]
};

export const LOCAL_INSIGHTS: Insight[] = [];