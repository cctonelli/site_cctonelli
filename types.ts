
export interface CarouselImage {
  id: string | number;
  url: string;
  title: string | null;
  subtitle: string | null;
  cta_text?: string | null;
  cta_url?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface Metric {
  id: string | number;
  label: string;
  value: string;
  icon: string | null;
  display_order: number;
  is_active: boolean;
}

export interface Insight {
  id: string | number;
  title: string;
  subtitle?: string | null;
  excerpt: string | null;
  image_url: string | null;
  link: string | null;
  content?: string | null;
  published_at: string;
  is_active: boolean;
  display_order: number;
  category?: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  access_level: 'public' | 'client' | 'admin';
  is_active: boolean;
  external_url?: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  featured: boolean;
  pricing_type: 'subscription' | 'one_time' | 'per_quantity' | 'free';
  is_active: boolean;
  download_ftp_link?: string | null;
  created_at?: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'semester' | 'year' | null;
  quantity_limit: number | null;
  features: string[];
  is_most_popular: boolean;
  is_free: boolean;
  order_index: number;
}

export interface ProductContentBlock {
  id: string;
  product_id: string;
  block_type: 'hero' | 'text' | 'video' | 'image_gallery' | 'comparison' | 'faq' | 'cta' | 'testimonials' | 'custom' | 'features';
  order: number;
  content: any;
}

export interface Order {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string;
  status: 'pending' | 'paid' | 'approved' | 'rejected' | 'delivered';
  payment_method: string;
  pix_qrcode_url: string | null;
  amount: number;
  approved_by_admin: boolean;
  download_link: string | null;
  created_at?: string;
  profiles?: Profile;
}

export interface UserProduct {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string | null;
  status: 'pending' | 'active' | 'expired' | 'trial' | 'canceled';
  expires_at: string | null;
  access_token: string | null;
  approved_by_admin: boolean;
  download_link?: string | null;
  created_at?: string;
}

export interface AppVersion {
  id: string;
  app_name: string;
  version_code: string;
  download_url: string;
  is_forced: boolean;
  release_notes: string | null;
  created_at?: string;
}

export interface V8MatrixUsage {
  id: string;
  user_product_id: string;
  remaining_disparos: number;
  threads: number;
  daily_count: number;
  total_count: number;
  last_reset: string;
}

export interface Testimonial {
  id: string | number;
  name: string;
  company: string | null;
  quote: string;
  approved: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  // Added email property to fix type errors in AdminDashboard.tsx
  email: string | null;
  cpf_cnpj: string | null;
  gender: 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não informar' | null;
  whatsapp: string | null;
  user_type: 'client' | 'admin';
  created_at?: string;
}

export interface Contact {
  id?: string | number;
  name: string;
  email: string;
  message: string;
  created_at?: string;
}
