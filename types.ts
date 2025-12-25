
export interface CarouselImage {
  id: string;
  url: string;
  title: string | null;
  title_en?: string | null;
  title_es?: string | null;
  subtitle: string | null;
  subtitle_en?: string | null;
  subtitle_es?: string | null;
  cta_url: string | null; // Corrigido de 'link' para 'cta_url'
  cta_text?: string | null;
  cta_text_en?: string | null;
  cta_text_es?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface Metric {
  id: string;
  label: string;
  label_en?: string;
  label_es?: string;
  value: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Insight {
  id: string;
  title: string;
  title_en?: string;
  title_es?: string;
  subtitle?: string | null;
  excerpt: string | null;
  excerpt_en?: string | null;
  excerpt_es?: string | null;
  content: string | null;
  content_en?: string | null;
  content_es?: string | null;
  category?: string;
  image_url: string | null;
  link: string | null;
  published_at: string;
  is_active: boolean;
  display_order: number;
}

export interface Product {
  id: string;
  name: string;
  name_en?: string;
  name_es?: string;
  description: string | null;
  description_en?: string | null;
  description_es?: string | null;
  price: number;
  type: 'product' | 'service';
  config: {
    url?: string;
    image_url?: string;
    action_label?: string;
    action_label_en?: string;
    action_label_es?: string;
  };
  created_at?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  company: string | null;
  quote: string;
  quote_en?: string;
  quote_es?: string;
  approved: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  cpf_cnpj: string | null;
  gender: 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não informar' | null;
  whatsapp: string | null;
  user_type: 'client' | 'admin';
  created_at?: string;
}

export interface SiteContent {
  key: string;
  value: string;
  page: string;
  description?: string;
}

export interface Contact {
  id?: string;
  name: string;
  email: string;
  message: string;
  created_at?: string;
}
