import { Product, ProductVariant, ProductContentBlock, Insight } from '../types';

export type Language = 'pt' | 'en' | 'es';

// --- KERNEL VISUAL & NARRATIVO TOTAL ---
export const SITE_CONFIG = {
  theme: {
    primary: '#00ff41', // Verde Matrix Neon Original
    secondary: '#b4975a', 
    bg_dark: '#010309',
    bg_light: '#ffffff',
    font_family_serif: "'Playfair Display', serif",
    font_family_sans: "'Inter', sans-serif"
  },
  ux: {
    matrix_mode: true,
    matrix_speed: 1.8,
    matrix_opacity: 0.2,
    scanline_opacity: 0.08,
    glow_intensity: '0.6',
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

// --- REPOSITÓRIO DE ATIVOS (PRODUTOS) ---
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
  },
  {
    id: 'quantum-red-pill-id',
    slug: 'quantum-red-pill',
    title: 'QUANTUM RED PILL',
    subtitle: 'Descriptografia de Mercado e Visão Executiva Nível 13.',
    description: 'Sistema de monitoramento em tempo real de fluxos de capital e tendências disruptivas. Fuja da simulação corporativa com advisory de elite.',
    image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop',
    featured: false,
    pricing_type: 'one_time',
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
      features: [
        'Dayparting Inteligente', 
        'Mouse Curves (Antiban)', 
        'Multi-Thread v6 Core', 
        'Suporte Executive +55 44 99732-8888',
        'Licença Vitalícia para 2 Instâncias'
      ],
      is_most_popular: true,
      is_free: false,
      order_index: 0
    }
  ],
  'quantum-red-pill-id': [
    {
      id: 'quantum-one',
      product_id: 'quantum-red-pill-id',
      name: 'Visionary Access',
      price: 4997.00,
      currency: 'BRL',
      interval: null,
      quantity_limit: 1,
      features: ['Deep Market Decryption', 'Anti-Fragility Framework', 'Monthly Executive Briefing'],
      is_most_popular: false,
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
    },
    {
      id: 'b2-v8',
      product_id: 'v8-matrix-id',
      block_type: 'features',
      order: 2,
      content: {
        title: "Arquitetura de Ativos v6.0",
        matrix_color: "#00ff41",
        style: "glitch_grid",
        items: [
          { icon: "brain", text: "Cadência por Período (Dayparting)" },
          { icon: "shield", text: "Algoritmo Anti-Ban v6.0" },
          { icon: "zap", text: "Multi-Thread de Alta Performance" },
          { icon: "robot", text: "Simulação de Micro-interações" }
        ]
      }
    },
    {
      id: 'b3-v8',
      product_id: 'v8-matrix-id',
      block_type: 'comparison',
      order: 3,
      content: {
        title: "ESCOLHA SEU NÍVEL DE PODER",
        style: "terminal_matrix",
        matrix_color: "#00ff41"
      }
    }
  ],
  'quantum-red-pill-id': [
    {
      id: 'b1-red',
      product_id: 'quantum-red-pill-id',
      block_type: 'hero',
      order: 1,
      content: {
        style: "matrix",
        matrix_color: "#ef4444",
        title: "RED PILL VISION",
        subtitle: "A verdade crua do mercado corporativo revelada.",
        glitch_title: "DECRYPT_REALITY",
        overlay_text: "CORE_ACCESS_AUTHORIZED"
      }
    },
    {
      id: 'b2-red',
      product_id: 'quantum-red-pill-id',
      block_type: 'comparison',
      order: 2,
      content: {
        title: "SAIA DA SIMULAÇÃO CORPORATIVA",
        style: "terminal_matrix",
        matrix_color: "#ef4444"
      }
    }
  ]
};

export const LOCAL_INSIGHTS: Insight[] = [];