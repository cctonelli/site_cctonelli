
export interface Metric {
  id: string;
  label: string;
  value: number;
  suffix: string;
  description: string;
}

export interface Insight {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  date: string;
  imageUrl: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'product' | 'service';
  config: any;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatarUrl: string;
}
