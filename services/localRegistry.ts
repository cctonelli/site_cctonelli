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
    title: 'V8 MATRIX EDITION v6.0',
    subtitle: 'O Protocolo Definitivo de Escala e Domínio Digital.',
    description: 'Engenharia de disparos em massa humanizada com inteligência de cadência por período, micro-interações de interface e algoritmos anti-banimento v6.0.',
    image_url: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop',
    featured: true,
    pricing_type: 'subscription',
    is_active: true
  }
];

export const LOCAL_VARIANTS: Record<string, ProductVariant[]> = {
  'v8-matrix-id': [
    {
      id: 'v8-free',
      product_id: 'v8-matrix-id',
      name: 'Versão Free (Demo)',
      price: 0.00,
      currency: 'BRL',
      interval: null,
      quantity_limit: 50,
      features: [
        "50 disparos totais",
        "Máximo 10 disparos/dia",
        "Validade de 7 dias",
        "Suporte via Community",
        "Humanização padrão"
      ],
      is_most_popular: false,
      is_free: true,
      order_index: 0
    },
    {
      id: 'v8-mensal',
      product_id: 'v8-matrix-id',
      name: 'Plano Mensal',
      price: 299.00,
      currency: 'BRL',
      interval: 'month',
      quantity_limit: 2400,
      features: [
        "2.400 disparos/mês",
        "Humanização avançada",
        "Suporte em até 12h",
        "Envio de todas as mídias",
        "1 thread de disparo"
      ],
      is_most_popular: false,
      is_free: false,
      order_index: 1
    },
    {
      id: 'v8-semestral',
      product_id: 'v8-matrix-id',
      name: 'Plano Semestral',
      price: 599.00,
      currency: 'BRL',
      interval: 'semester',
      quantity_limit: 12800,
      features: [
        "12.800 disparos/6 meses",
        "Era R$999, agora R$599",
        "2 threads simultâneas",
        "Suporte VIP 24h",
        "Badge Mais Vendido",
        "Humanização Premium"
      ],
      is_most_popular: true,
      is_free: false,
      order_index: 2
    },
    {
      id: 'v8-anual',
      product_id: 'v8-matrix-id',
      name: 'Plano Anual',
      price: 1199.00,
      currency: 'BRL',
      interval: 'year',
      quantity_limit: 32000,
      features: [
        "32.000 disparos/12 meses",
        "Melhor custo-benefício",
        "Desconto de 66% vs mensal",
        "3 threads simultâneas",
        "Suporte VIP Exclusivo",
        "Licença Vitalícia Atualizações"
      ],
      is_most_popular: false,
      is_free: false,
      order_index: 3
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
        title: "V8 MATRIX EDITION",
        subtitle: "A ferramenta mais poderosa e indetectável do Brasil. Humanização extrema para resultados corporativos.",
        glitch_title: "SYSTEM_SOVEREIGN_V6",
        overlay_text: "PROTOCOL_ACTIVE",
        cta_text: "Ver Planos",
        cta_link: "#precos"
      }
    },
    {
      id: 'b2-v8',
      product_id: 'v8-matrix-id',
      block_type: 'text',
      order: 2,
      content: {
        title: "Tecnologia de Elite para Resultados Reais",
        subtitle: "Engenharia de disparos indetectável com alma humana. 100% indetectável pelo WhatsApp desde 2023. Envio de texto, imagem, vídeo, áudio, documentos, figurinhas e enquetes. Validação oficial NTP e proteção anti-fraude completa."
      }
    },
    {
      id: 'b3-v8',
      product_id: 'v8-matrix-id',
      block_type: 'features',
      order: 3,
      content: {
        title: "Arquitetura de Ativos",
        items: [
          { icon: "brain", text: "Humanização Premium com perfis de digitação variados" },
          { icon: "zap", text: "Velocidade Adaptativa por horário do dia (Dayparting)" },
          { icon: "shield", text: "Proteção de Algoritmo Anti-Ban v6.0" },
          { icon: "robot", text: "Multi-threading para escala exponencial" }
        ]
      }
    },
    {
      id: 'b4-v8',
      product_id: 'v8-matrix-id',
      block_type: 'comparison',
      order: 4,
      content: {
        title: "Compare os Níveis de Poder",
        subtitle: "Escolha o plano ideal para sua operação estratégica."
      }
    },
    {
      id: 'b5-v8',
      product_id: 'v8-matrix-id',
      block_type: 'faq',
      order: 5,
      content: {
        title: "Perguntas Frequentes",
        items: [
          { question: "É seguro usar o V8 MATRIX?", answer: "Sim. Utilizamos técnicas comprovadas de humanização desde 2023, com zero relatos de bloqueio quando usado corretamente." },
          { question: "Posso comprar pacotes extras depois?", answer: "Sim! No seu portal do cliente, você pode adquirir mais disparos a qualquer momento." },
          { question: "Como recebo o aplicativo?", answer: "Após aprovação do pagamento, o link de download aparece imediatamente no seu Executive Hub." }
        ]
      }
    },
    {
      id: 'b6-v8',
      product_id: 'v8-matrix-id',
      block_type: 'cta',
      order: 6,
      content: {
        title: "Pronto para dominar o mercado?",
        subtitle: "Escolha seu plano e comece a escalar suas vendas hoje no padrão Claudio Tonelli.",
        button_text: "ATIVAR AGORA",
        button_link: "#precos"
      }
    }
  ]
};

export const LOCAL_INSIGHTS: Insight[] = [];