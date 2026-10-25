export interface Product {
  id: string;
  name: string;
  description: string;
  category_id: string;
  price_pkr: number;
  available_colours: string[];
  stock_quantity: number;
  is_active: number;
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  display_order: number;
  is_active: number;
  created_at?: string;
}

export interface PaymentMethod {
  id: string;
  provider_name: string;
  account_holder_name: string;
  bank_or_wallet_name: string;
  account_number_or_iban: string;
  payment_instructions: string;
  qr_code_url?: string;
  is_active: number;
  created_at?: string;
}

export interface OrderStatusHistoryItem {
  status: string;
  timestamp: string;
  note: string;
}

export interface Order {
  id: string;
  order_id: string; // 6 digits
  tracking_token?: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  delivery_address: string;
  product_id: string;
  product_name_snapshot: string;
  product_image_snapshot?: string;
  selected_colour: string;
  quantity: number;
  unit_price_snapshot: number;
  total_price: number;
  payment_method_id: string;
  payment_method_snapshot: {
    provider_name: string;
    bank_or_wallet_name: string;
    account_holder_name: string;
    account_number_or_iban: string;
  };
  payment_proof_filename: string;
  payment_status: string;
  order_status: 'In Review' | 'Payment Verified' | 'Completed';
  estimated_delivery_date?: string | null;
  status_history: OrderStatusHistoryItem[];
  created_at: string;
}

export interface TrackOrderResponse {
  order_id: string;
  tracking_token: string;
  created_at: string;
  product_name_snapshot: string;
  product_image_snapshot?: string;
  selected_colour: string;
  quantity: number;
  unit_price_snapshot: number;
  total_price: number;
  payment_status: string;
  order_status: 'In Review' | 'Payment Verified' | 'Completed';
  estimated_delivery_date?: string | null;
  customer_name?: string;
  customer_city?: string;
  delivery_address?: string;
  status_history: OrderStatusHistoryItem[];
}

export interface StoreSettings {
  brand_name: string;
  homepage_description: string;
  contact_number: string;
  whatsapp_number: string;
  business_address: string;
  announcement?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  order_id?: string;
  is_read: number;
  created_at: string;
}

export interface DashboardOverviewData {
  totalOrders: number;
  awaitingVerification: number;
  verifiedOrders: number;
  completedOrders: number;
  totalRevenue: number;
  unreadNotifications: number;
  recentOrders: Order[];
  recentProducts: Product[];
}
