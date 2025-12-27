import { Product, ProductVariant, ProductContentBlock, Insight } from '../types';

export type Language = 'pt' | 'en' | 'es';

// --- KERNEL TOTAL (DNA SOBERANO v13.0) ---
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
    glitch_intensity: 1,
    border_radius_global: '2.5rem',
    glow_intensity: '0.4',
    animation_speed: 'normal' // fast, normal, slow
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
  menus: {
    nav_strategy: { pt: 'Estratégia', en: 'Strategy', es: 'Estrategia' },
    nav_insights: { pt: 'Insights', en: 'Insights', es: 'Insights' },
    nav_performance: { pt: 'Performance', en: 'Performance', es: 'Rendimento' },
    nav_connection: { pt: 'Conexão', en: 'Connection', es: 'Conexión' },
    nav_client_area: { pt: 'Área do Cliente', en: 'Client Area', es: 'Área del Cliente' }
  },
  seo: {
    title: { pt: 'Claudio Tonelli | Advisory de Elite', en: 'Claudio Tonelli | Elite Advisory', es: 'Claudio Tonelli | Advisory de Elite' },
    description: { pt: 'Consultoria estratégica de alta performance.', en: 'High-performance strategic consulting.', es: 'Consultoría estratégica de alto rendimiento' },
    og_image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2071&auto=format&fit=crop'
  }
};

// --- REPOSITÓRIO DE INSIGHTS PERMANENTES ---
export const LOCAL_INSIGHTS: Insight[] = [
  {
    id: 'insight-v8-launch',
    title: 'A Era do V8 MATRIX: Automação e Domínio',
    subtitle: 'O salto tecnológico no Advisory Digital.',
    excerpt: 'Como a nova versão 12.5 está redefinindo o ROI de nossos parceiros.',
    image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop',
    published_at: '2025-12-26T10:00:00Z',
    is_active: true,
    display_order: 0,
    category: 'TECNOLOGIA',
    link: null,
    content: `<h2>O Protocolo V8 Matrix</h2><p>O rigor da consultoria tradicional encontrou seu sucessor digital. O V8 não é apenas um disparador; é uma rede neural de engajamento que opera no limite da escala digital.</p>`
  }
];

// --- REPOSITÓRIO DE ATIVOS DE ELITE (PRODUTOS) ---
export const LOCAL_PRODUCTS: Product[] = [
  {
    id: 'v8-matrix-id',
    slug: 'v8-matrix-edition',
    title: 'V8 MATRIX EDITION v12.5',
    subtitle: 'O Protocolo Definitivo de Escala e Domínio Digital.',
    description: 'Engenharia de disparos em massa com inteligência anti-banimento V5 e processamento multithread de elite.',
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
      features: ['5.000 Disparos Iniciais', 'Inteligência Anti-Ban V5', 'Suporte Executive 24/7', 'Acesso ao Advisory Group'],
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
        glitch_title: 'SYSTEM_SOVEREIGN',
        subtitle: 'A ferramenta de soberania que as grandes consultorias usam para dominar o tráfego orgânico e direto.',
        overlay_text: 'PROTOCOL_V12.5_ACTIVE',
        style: 'matrix'
      }
    },
    {
      id: 'b2',
      product_id: 'v8-matrix-id',
      block_type: 'features',
      order: 1,
      content: {
        title: 'Arquitetura de Ativos',
        items: [
          { icon: 'brain', text: 'Rede Neural de Engajamento' },
          { icon: 'shield', text: 'Escudo Anti-Ban de Elite' },
          { icon: 'zap', text: 'Processamento Multithread' },
          { icon: 'robot', text: 'Automação Resiliente' }
        ],
        style: 'glitch_grid'
      }
    },
    {
      id: 'b3',
      product_id: 'v8-matrix-id',
      block_type: 'comparison',
      order: 2,
      content: {
        title: 'ESCOLHA SEU NÍVEL DE PODER',
        style: 'terminal_matrix'
      }
    }
  ]
};