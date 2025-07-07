/**
 * Tipos TypeScript para API do Crowbar Backend
 * Baseado na estrutura do backend e protótipos das telas
 */

// ===== TIPOS BASE =====

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

// ===== USUÁRIO =====

export interface User {
  id: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  avatar?: string;
  phone?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  address?: Address;
  preferences?: UserPreferences;
  stats?: UserStats;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  is_default: boolean;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  categories: string[];
  price_range: {
    min: number;
    max: number;
  };
}

export interface UserStats {
  total_boxes_opened: number;
  total_spent: number;
  favorite_category: string;
  level: number;
  points: number;
}

// ===== CAIXAS MISTERIOSAS =====

export interface MysteryBox {
  id: string;
  name: string;
  description: string;
  short_description: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  category: Category;
  images: BoxImage[];
  thumbnail: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  tags: string[];
  possible_items: PossibleItem[];
  stats: BoxStats;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  is_active: boolean;
  boxes_count: number;
}

export interface BoxImage {
  id: string;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  order: number;
}

export interface PossibleItem {
  id: string;
  name: string;
  description: string;
  image: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  probability: number; // Porcentagem de chance
  estimated_value: number;
}

export interface BoxStats {
  total_sold: number;
  total_opened: number;
  average_rating: number;
  reviews_count: number;
  last_opened_at?: string;
}

// ===== COMPRAS E PEDIDOS =====

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  items: OrderItem[];
  shipping_address: Address;
  tracking_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  mystery_box: MysteryBox;
  quantity: number;
  unit_price: number;
  total_price: number;
  opened_items?: OpenedItem[];
}

export interface OpenedItem {
  id: string;
  item: PossibleItem;
  opened_at: string;
  user_reaction?: 'love' | 'like' | 'neutral' | 'dislike';
}

// ===== FAVORITOS =====

export interface Favorite {
  id: string;
  user_id: string;
  mystery_box: MysteryBox;
  created_at: string;
}

// ===== REVIEWS =====

export interface Review {
  id: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  mystery_box_id: string;
  rating: number; // 1-5
  comment?: string;
  images?: string[];
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

// ===== NOTIFICAÇÕES =====

export interface Notification {
  id: string;
  type: 'order_update' | 'new_box' | 'promotion' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

// ===== PROMOÇÕES =====

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: 'discount' | 'buy_x_get_y' | 'free_shipping';
  value: number; // Porcentagem ou valor fixo
  code?: string;
  min_amount?: number;
  max_uses?: number;
  used_count: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  applicable_boxes?: string[]; // IDs das caixas aplicáveis
}

// ===== CARRINHO =====

export interface CartItem {
  id: string;
  mystery_box: MysteryBox;
  quantity: number;
  added_at: string;
}

export interface Cart {
  items: CartItem[];
  total_items: number;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  applied_promotion?: Promotion;
}

// ===== FILTROS E BUSCA =====

export interface SearchFilters {
  query?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  rarity?: string[];
  is_featured?: boolean;
  is_new?: boolean;
  tags?: string[];
  sort_by?: 'name' | 'price' | 'created_at' | 'popularity' | 'rating';
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

export interface SearchResult {
  boxes: MysteryBox[];
  categories: Category[];
  total_results: number;
  filters_applied: SearchFilters;
  suggestions?: string[];
}

// ===== WEBSOCKET EVENTS =====

export interface WebSocketEvent {
  type: 'box_opened' | 'new_order' | 'stock_update' | 'notification';
  data: any;
  timestamp: string;
}

export interface BoxOpenedEvent {
  type: 'box_opened';
  data: {
    user_id: string;
    box_id: string;
    items: OpenedItem[];
    total_value: number;
  };
}

// ===== ESTATÍSTICAS =====

export interface AppStats {
  total_boxes: number;
  total_users: number;
  total_boxes_opened: number;
  featured_boxes: MysteryBox[];
  popular_categories: Category[];
  recent_openings: BoxOpenedEvent[];
}
