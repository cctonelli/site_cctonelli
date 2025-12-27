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
      id: 'v8-variant-free',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      name: 'Versão Free (Demo)',
      price: 0.00,
      currency: 'BRL',
      interval: null,
      quantity_limit: 50,
      features: [
        "50 disparos totais",
        "Máximo 10 disparos por dia",
        "Validade de 7 dias",
        "Suporte básico via WhatsApp",
        "Humanização padrão",
        "Envio de texto e imagem"
      ],
      is_most_popular: false,
      is_free: true,
      order_index: 0
    },
    {
      id: 'v8-variant-mensal',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      name: 'Plano Mensal',
      price: 299.00,
      currency: 'BRL',
      interval: 'month',
      quantity_limit: 2400,
      features: [
        "2.400 disparos por mês",
        "Humanização avançada com erros simulados",
        "Suporte prioritário (resposta em até 12h)",
        "Envio de todos os tipos (vídeo, áudio, documento, enquete)",
        "Atualizações mensais garantidas",
        "1 thread de disparo"
      ],
      is_most_popular: false,
      is_free: false,
      order_index: 1
    },
    {
      id: 'v8-variant-semestral',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      name: 'Plano Semestral',
      price: 599.00,
      currency: 'BRL',
      interval: 'semester',
      quantity_limit: 12800,
      features: [
        "12.800 disparos em 6 meses",
        "Desconto especial: era R$999, agora R$599",
        "Duas threads de disparo simultâneas",
        "Suporte VIP 24h (prioridade máxima)",
        "Acesso antecipado a novas funcionalidades",
        "Humanização premium com perfis de digitação variados",
        "Badge Mais Vendido",
        "Envio ilimitado de todos os tipos de mídia"
      ],
      is_most_popular: true,
      is_free: false,
      order_index: 2
    },
    {
      id: 'v8-variant-anual',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      name: 'Plano Anual',
      price: 1199.00,
      currency: 'BRL',
      interval: 'year',
      quantity_limit: 32000,
      features: [
        "32.000 disparos em 12 meses",
        "Melhor custo-benefício do mercado",
        "Desconto de 66% vs mensal",
        "Três threads de disparo simultâneas",
        "Suporte VIP exclusivo (canal dedicado)",
        "Licença vitalícia de atualizações",
        "Acesso beta a versões futuras",
        "Humanização extrema com cadência por horário do dia",
        "Prioridade máxima em suporte técnico"
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
      id: 'block-hero',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      block_type: 'hero',
      order: 1,
      content: {
        title: "Disparador de WhatsApp V8 MATRIX EDITION",
        subtitle: "A ferramenta mais poderosa e indetectável do Brasil",
        video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Exemplo
        cta_text: "Ver Planos",
        cta_link: "#precos",
        overlay_text: "SYSTEM_SOVEREIGN_V6",
        glitch_title: "PROTOCOL_ACTIVE"
      }
    },
    {
      id: 'block-text',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      block_type: 'text',
      order: 2,
      content: {
        title: "Tecnologia de elite para resultados reais",
        subtitle: "Humanização extrema com digitação simulada, erros intencionais e pausas naturais por horário do dia. 100% indetectável pelo WhatsApp desde 2023. Envio de texto, imagem, vídeo, áudio, documentos, figurinhas, enquetes e eventos."
      }
    },
    {
      id: 'block-gallery',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      block_type: 'image_gallery',
      order: 3,
      content: {
        title: "Interface intuitiva e poderosa",
        images: [
          "https://images.unsplash.com/photo-1551288049-bbbda536639a?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
          "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?auto=format&fit=crop&q=80&w=800"
        ]
      }
    },
    {
      id: 'block-comparison',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      block_type: 'comparison',
      order: 4,
      content: {
        title: "Compare os planos e escolha o ideal",
        subtitle: "Todos os planos incluem atualizações gratuitas e suporte técnico"
      }
    },
    {
      id: 'block-cta-upsell',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      block_type: 'cta',
      order: 5,
      content: {
        title: "Precisa de mais disparos?",
        subtitle: "Adquira pacotes extras a qualquer momento no seu Executive Hub",
        button_text: "Ver Pacotes Extras",
        button_link: "/wip"
      }
    },
    {
      id: 'block-faq',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      block_type: 'faq',
      order: 6,
      content: {
        title: "Perguntas Frequentes",
        items: [
          {"question": "É seguro usar o V8 MATRIX?", "answer": "Sim. Utilizamos técnicas comprovadas de humanização desde 2023, com zero relatos de bloqueio quando usado corretamente."},
          {"question": "Posso comprar pacotes extras depois?", "answer": "Sim! No seu portal do cliente, você pode adquirir mais disparos a qualquer momento."},
          {"question": "Como recebo o aplicativo?", "answer": "Após aprovação do pagamento, o link de download aparece imediatamente no seu Executive Hub."},
          {"question": "Existe garantia?", "answer": "Sim, 7 dias de garantia total ou seu dinheiro de volta."}
        ]
      }
    },
    {
      id: 'block-cta-final',
      product_id: '1549b854-3c86-4961-bc05-866609fe8d8e',
      block_type: 'cta',
      order: 7,
      content: {
        title: "Pronto para dominar o WhatsApp Marketing?",
        subtitle: "Escolha seu plano e comece a escalar suas vendas hoje",
        button_text: "Comprar Agora",
        button_link: "#precos"
      }
    }
  ]
};

export const LOCAL_INSIGHTS: Insight[] = [];