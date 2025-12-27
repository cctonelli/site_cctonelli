import { Product, ProductVariant, ProductContentBlock, Insight } from '../types';

export type Language = 'pt' | 'en' | 'es';

// --- KERNEL VISUAL & NARRATIVO TOTAL v16.0 ---
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
    cap_drop: true 
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
    id: '1549b854-3c86-4961-bc05-866609fe8d8e',
    slug: 'v8-matrix-edition',
    title: 'V8 MATRIX EDITION v6.0',
    subtitle: 'A ferramenta mais poderosa e indetectável do Brasil.',
    description: 'Engenharia de disparos em massa humanizada com inteligência de cadência por período e algoritmos anti-banimento v6.0.',
    image_url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop',
    featured: true,
    pricing_type: 'subscription',
    is_active: true
  }
];

export const LOCAL_VARIANTS: Record<string, ProductVariant[]> = {
  '1549b854-3c86-4961-bc05-866609fe8d8e': [
    {
      id: 'v8-free',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      name: 'Versão Free (Demo)',
      price: 0.00,
      currency: 'BRL',
      interval: null,
      quantity_limit: 50,
      features: [
        "50 disparos totais",
        "Máximo 10 disparos/dia",
        "Validade de 7 dias",
        "Suporte básico via WhatsApp",
        "Humanização padrão"
      ],
      is_most_popular: false,
      is_free: true,
      order_index: 0
    },
    {
      id: 'v8-mensal',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      name: 'Plano Mensal',
      price: 299.00,
      currency: 'BRL',
      interval: 'month',
      quantity_limit: 2400,
      features: [
        "2.400 disparos por mês",
        "Humanização avançada",
        "Suporte prioritário 12h",
        "Envio de todas as mídias",
        "1 thread de disparo"
      ],
      is_most_popular: false,
      is_free: false,
      order_index: 1
    },
    {
      id: 'v8-semestral',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      name: 'Plano Semestral',
      price: 599.00,
      currency: 'BRL',
      interval: 'semester',
      quantity_limit: 12800,
      features: [
        "12.800 disparos em 6 meses",
        "Desconto promocional ativo",
        "2 threads simultâneas",
        "Suporte VIP 24h",
        "Humanização Premium"
      ],
      is_most_popular: true,
      is_free: false,
      order_index: 2
    },
    {
      id: 'v8-anual',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      name: 'Plano Anual',
      price: 1199.00,
      currency: 'BRL',
      interval: 'year',
      quantity_limit: 32000,
      features: [
        "32.000 disparos em 12 meses",
        "Melhor custo-benefício",
        "3 threads simultâneas",
        "Licença Vitalícia Atualizações",
        "Prioridade Máxima"
      ],
      is_most_popular: false,
      is_free: false,
      order_index: 3
    }
  ]
};

export const LOCAL_BLOCKS: Record<string, ProductContentBlock[]> = {
  '1549b854-3c86-4961-bc05-866609fe8d8e': [
    {
      id: 'b1',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      block_type: 'hero',
      order: 1,
      content: {
        title: "V8 MATRIX EDITION",
        subtitle: "A ferramenta indetectável que escala sua operação estratégica no WhatsApp.",
        overlay_text: "SYSTEM_SOVEREIGN_V6",
        glitch_title: "PROTOCOL_ACTIVE",
        cta_text: "Ver Planos",
        cta_link: "#precos"
      }
    },
    {
      id: 'b2',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      block_type: 'text',
      order: 2,
      content: {
        title: "Tecnologia de Elite",
        subtitle: "Humanização extrema com digitação simulada e algoritmos anti-banimento testados desde 2023."
      }
    },
    {
      id: 'b3',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      block_type: 'features',
      order: 3,
      content: {
        title: "Arquitetura de Ativos",
        items: [
          { icon: "brain", text: "Humanização Premium" },
          { icon: "zap", text: "Velocidade Adaptativa" },
          { icon: "shield", text: "Algoritmo Anti-Ban v6.0" },
          { icon: "robot", text: "Multi-threading Escalonável" }
        ]
      }
    },
    {
      id: 'b4',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      block_type: 'comparison',
      order: 4,
      content: {
        title: "Níveis de Poder",
        subtitle: "Escolha o protocolo ideal para sua escala corporativa."
      }
    },
    {
      id: 'b5',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      block_type: 'faq',
      order: 5,
      content: {
        title: "FAQ",
        items: [
          { question: "É seguro?", answer: "Sim. 100% focado em humanização e segurança." },
          { question: "Como recebo?", answer: "Acesso imediato no Hub após aprovação do PIX." }
        ]
      }
    }
  ]
};

export const LOCAL_INSIGHTS: Insight[] = [];