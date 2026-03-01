export interface ProductOption {
  label: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  emoji: string;
  description: string;
  bgColor: string;
  options: ProductOption[];
  imageUrl?: string;
}

// Raw DB row shape (snake_case)
export interface DbProduct {
  id: string;
  name: string;
  emoji: string;
  description: string;
  bg_color: string;
  options: ProductOption[];
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  image_url: string | null;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity_label: string;
  price: number;
}

export interface Order {
  id: string;
  first_name: string;
  surname: string;
  phone: string;
  email: string | null;
  address: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}
