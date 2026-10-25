import { Product, Category, PaymentMethod, Order, StoreSettings, AdminNotification, DashboardOverviewData, TrackOrderResponse } from '../types.ts';

const TOKEN_KEY = 'alkareem_owner_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async getAuthStatus(): Promise<{ isRegistered: boolean; email: string | null; isAuthenticated: boolean }> {
    const res = await fetch('/api/auth/status', {
      headers: authHeaders(),
    });
    return res.json();
  },

  async registerOwner(email: string, password: string): Promise<{ success: boolean; token: string; email: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    setAuthToken(data.token);
    return data;
  },

  async loginOwner(email: string, password: string): Promise<{ success: boolean; token: string; email: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setAuthToken(data.token);
    return data;
  },

  async logout(): Promise<void> {
    const token = getAuthToken();
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: authHeaders(),
      });
    } catch (e) {
      console.error(e);
    }
    clearAuthToken();
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; email?: string; code?: string; expiresInMinutes?: number }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send verification code');
    return data;
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; token: string; email: string; message: string }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, new_password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update password');
    setAuthToken(data.token);
    return data;
  },

  // Settings
  async getSettings(): Promise<StoreSettings> {
    const res = await fetch('/api/settings');
    return res.json();
  },

  async updateSettings(settings: Partial<StoreSettings>): Promise<{ success: boolean; settings: StoreSettings }> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update settings');
    return data;
  },

  // Categories
  async getCategories(all = false): Promise<Category[]> {
    const res = await fetch(`/api/categories${all ? '?all=1' : ''}`);
    return res.json();
  },

  async addCategory(name: string, displayOrder = 0): Promise<Category> {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, display_order: displayOrder }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add category');
    return data;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update category');
    return data;
  },

  async deleteCategory(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete category');
    return data;
  },

  // Products
  async getProducts(params?: { category?: string; search?: string; active_only?: boolean }): Promise<Product[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.active_only) searchParams.set('active_only', '1');

    const res = await fetch(`/api/products?${searchParams.toString()}`, {
      headers: authHeaders(),
    });
    return res.json();
  },

  async getProduct(id: string): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Product not found');
    return data;
  },

  async addProduct(product: Partial<Product>): Promise<Product> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(product),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create product');
    return data;
  },

  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(product),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update product');
    return data;
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete product');
    return data;
  },

  // Upload Product Image
  async uploadProductImage(file: File): Promise<{ imageUrl: string; filename: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/upload/product-image', {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Image upload failed');
    return data;
  },

  // Payment Methods
  async getPaymentMethods(all = false): Promise<PaymentMethod[]> {
    const res = await fetch(`/api/payment-methods${all ? '?all=1' : ''}`, {
      headers: authHeaders(),
    });
    return res.json();
  },

  async addPaymentMethod(method: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const res = await fetch('/api/payment-methods', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(method),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add payment method');
    return data;
  },

  async updatePaymentMethod(id: string, method: Partial<PaymentMethod>): Promise<PaymentMethod> {
    const res = await fetch(`/api/payment-methods/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(method),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update payment method');
    return data;
  },

  async deletePaymentMethod(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/payment-methods/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete payment method');
    return data;
  },

  // Payment Proof Upload
  async uploadPaymentProof(file: File): Promise<{ filename: string; path: string; size: number }> {
    const formData = new FormData();
    formData.append('proof', file);

    const res = await fetch('/api/upload/payment-proof', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Proof upload failed');
    return data;
  },

  // Customer Order Submission
  async submitOrder(orderData: {
    customer_name: string;
    customer_phone: string;
    customer_city: string;
    delivery_address: string;
    product_id: string;
    selected_colour: string;
    quantity: number;
    payment_method_id: string;
    payment_proof_filename: string;
    payment_proof_path: string;
    idempotency_key: string;
  }): Promise<{
    success: boolean;
    orderId: string;
    trackingToken: string;
    order: Order;
    whatsappUrl: string;
    isDuplicate: boolean;
  }> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Order submission failed');
    return data;
  },

  // Tracking
  async trackOrder(token: string): Promise<TrackOrderResponse> {
    const res = await fetch(`/api/orders/track/${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Tracking lookup failed');
    return data;
  },

  async trackOrderByLookup(orderId: string, phone: string): Promise<TrackOrderResponse> {
    const res = await fetch('/api/orders/track-lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Tracking lookup failed');
    return data;
  },

  // Owner Orders
  async getOwnerOrders(params?: { search?: string; status?: string }): Promise<Order[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);

    const res = await fetch(`/api/owner/orders?${searchParams.toString()}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch orders');
    return data;
  },

  async getOwnerOrder(orderId: string): Promise<Order> {
    const res = await fetch(`/api/owner/orders/${orderId}`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch order');
    return data;
  },

  async updateOrderStatus(
    orderId: string,
    updates: {
      order_status?: 'In Review' | 'Payment Verified' | 'Completed';
      payment_status?: string;
      estimated_delivery_date?: string;
      note?: string;
    }
  ): Promise<Order> {
    const res = await fetch(`/api/owner/orders/${orderId}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update order status');
    return data;
  },

  async deleteOrder(orderId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/owner/orders/${orderId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete order');
    return data;
  },

  // Dashboard Overview & Notifications
  async getDashboardOverview(): Promise<DashboardOverviewData> {
    const res = await fetch('/api/owner/overview', {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load dashboard overview');
    return data;
  },

  async getNotifications(): Promise<AdminNotification[]> {
    const res = await fetch('/api/owner/notifications', {
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load notifications');
    return data;
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/owner/notifications/${id}/read`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return res.json();
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    const res = await fetch('/api/owner/notifications/read-all', {
      method: 'POST',
      headers: authHeaders(),
    });
    return res.json();
  },

  // Supabase Integration
  async getSupabaseStatus(): Promise<{
    connected: boolean;
    projectId: string;
    url: string;
    hasOrdersTable: boolean;
    hasProductsTable: boolean;
    error?: string;
    lastChecked: string;
  }> {
    const res = await fetch('/api/supabase/status');
    return res.json();
  },

  async getSupabaseSchema(): Promise<string> {
    const res = await fetch('/api/supabase/schema');
    return res.text();
  },

  async syncAllToSupabase(): Promise<{
    success: boolean;
    ordersSynced: number;
    productsSynced: number;
    categoriesSynced: number;
    paymentMethodsSynced: number;
    errors: string[];
  }> {
    const res = await fetch('/api/owner/supabase/sync', {
      method: 'POST',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to sync with Supabase');
    return data;
  },
};

