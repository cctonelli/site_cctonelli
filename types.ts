
export interface CarouselImage {
  id: string;
  url: string;
  title: string | null;
  subtitle: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface Metric {
  id: string;
  label: string;
  value: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Insight {
  id: string;
  title: string;
  subtitle?: string | null;
  excerpt: string | null;
  content: string | null;
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
  description: string | null;
  price: number;
  type: 'product' | 'service';
  config: {
    url?: string;
    image_url?: string;
    action_label?: string;
  };
  created_at?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  company: string | null;
  quote: string;
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
}

export interface Contact {
  name: string;
  email: string;
  message: string;
}
