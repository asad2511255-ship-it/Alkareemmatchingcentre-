import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_ID = process.env.SUPABASE_PROJECT_ID || 'czkiqhklnnfssrgklsdt';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://czkiqhklnnfssrgklsdt.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_mPfIbWrXyrJ--ebLUr0Srg_VAhH_Ee6';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export interface SupabaseHealth {
  connected: boolean;
  projectId: string;
  url: string;
  hasOrdersTable: boolean;
  hasProductsTable: boolean;
  error?: string;
  lastChecked: string;
}

/**
 * Checks the connection and verifies whether schema tables are provisioned.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  const health: SupabaseHealth = {
    connected: false,
    projectId: SUPABASE_PROJECT_ID,
    url: SUPABASE_URL,
    hasOrdersTable: false,
    hasProductsTable: false,
    lastChecked: new Date().toISOString(),
  };

  try {
    const { error: ordersErr } = await supabase.from('orders').select('id').limit(1);
    if (!ordersErr) {
      health.connected = true;
      health.hasOrdersTable = true;
    } else if (ordersErr.code === 'PGRST205') {
      // Endpoint is reached successfully, but table schema is not yet created in Supabase
      health.connected = true;
      health.hasOrdersTable = false;
      health.error = 'Table "orders" does not exist yet. Run schema SQL in Supabase SQL editor.';
    } else {
      health.connected = true;
      health.error = ordersErr.message;
    }

    const { error: prodsErr } = await supabase.from('products').select('id').limit(1);
    if (!prodsErr) {
      health.hasProductsTable = true;
    }

    return health;
  } catch (err: any) {
    health.connected = false;
    health.error = err?.message || String(err);
    return health;
  }
}

/**
 * Store a new order in Supabase
 */
export async function saveOrderToSupabase(order: any): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      id: order.id,
      order_id: order.order_id,
      tracking_token: order.tracking_token,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_city: order.customer_city,
      delivery_address: order.delivery_address,
      product_id: order.product_id,
      product_name_snapshot: order.product_name_snapshot,
      product_image_snapshot: order.product_image_snapshot,
      selected_colour: order.selected_colour,
      quantity: order.quantity,
      unit_price_snapshot: order.unit_price_snapshot,
      total_price: order.total_price,
      payment_method_id: order.payment_method_id,
      payment_method_snapshot: typeof order.payment_method_snapshot === 'string' 
        ? JSON.parse(order.payment_method_snapshot || '{}') 
        : order.payment_method_snapshot,
      payment_proof_filename: order.payment_proof_filename,
      payment_proof_path: order.payment_proof_path,
      payment_status: order.payment_status || 'Awaiting Verification',
      order_status: order.order_status || 'In Review',
      estimated_delivery_date: order.estimated_delivery_date,
      status_history: typeof order.status_history === 'string'
        ? JSON.parse(order.status_history || '[]')
        : order.status_history,
      idempotency_key: order.idempotency_key,
      created_at: order.created_at || new Date().toISOString(),
    };

    const { error } = await supabase.from('orders').upsert(payload, { onConflict: 'order_id' });
    if (error) {
      console.warn('[Supabase] Could not sync order to Supabase:', error.message);
      return { success: false, error: error.message };
    }
    console.log(`[Supabase] Order ${order.order_id} successfully stored in Supabase!`);
    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase] Exception syncing order:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Update order status in Supabase
 */
export async function updateOrderInSupabase(orderId: string, updates: any): Promise<void> {
  try {
    const payload: any = {};
    if (updates.order_status) payload.order_status = updates.order_status;
    if (updates.payment_status) payload.payment_status = updates.payment_status;
    if (updates.estimated_delivery_date !== undefined) payload.estimated_delivery_date = updates.estimated_delivery_date;
    if (updates.status_history) {
      payload.status_history = typeof updates.status_history === 'string'
        ? JSON.parse(updates.status_history)
        : updates.status_history;
    }

    if (Object.keys(payload).length === 0) return;

    const { error } = await supabase.from('orders').update(payload).eq('order_id', orderId);
    if (error) {
      console.warn('[Supabase] Could not update order in Supabase:', error.message);
    }
  } catch (err: any) {
    console.warn('[Supabase] Error updating order:', err.message);
  }
}

/**
 * Bulk sync all data from local SQLite to Supabase
 */
export async function syncAllToSupabase(data: {
  orders: any[];
  products: any[];
  categories: any[];
  payment_methods: any[];
}): Promise<{
  ordersSynced: number;
  productsSynced: number;
  categoriesSynced: number;
  paymentMethodsSynced: number;
  errors: string[];
}> {
  const result = {
    ordersSynced: 0,
    productsSynced: 0,
    categoriesSynced: 0,
    paymentMethodsSynced: 0,
    errors: [] as string[],
  };

  // Sync Categories
  if (data.categories.length > 0) {
    const { error } = await supabase.from('categories').upsert(
      data.categories.map((c) => ({
        id: c.id,
        name: c.name,
        display_order: c.display_order || 0,
        is_active: c.is_active ?? 1,
        created_at: c.created_at || new Date().toISOString(),
      })),
      { onConflict: 'id' }
    );
    if (error) result.errors.push(`Categories: ${error.message}`);
    else result.categoriesSynced = data.categories.length;
  }

  // Sync Products
  if (data.products.length > 0) {
    const { error } = await supabase.from('products').upsert(
      data.products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category_id: p.category_id,
        price_pkr: p.price_pkr,
        available_colours: Array.isArray(p.available_colours) ? p.available_colours : JSON.parse(p.available_colours || '[]'),
        stock_quantity: p.stock_quantity,
        is_active: p.is_active ?? 1,
        images: Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]'),
        created_at: p.created_at || new Date().toISOString(),
        updated_at: p.updated_at || new Date().toISOString(),
      })),
      { onConflict: 'id' }
    );
    if (error) result.errors.push(`Products: ${error.message}`);
    else result.productsSynced = data.products.length;
  }

  // Sync Payment Methods
  if (data.payment_methods.length > 0) {
    const { error } = await supabase.from('payment_methods').upsert(
      data.payment_methods.map((pm) => ({
        id: pm.id,
        provider_name: pm.provider_name,
        account_holder_name: pm.account_holder_name,
        bank_or_wallet_name: pm.bank_or_wallet_name,
        account_number_or_iban: pm.account_number_or_iban,
        payment_instructions: pm.payment_instructions,
        qr_code_url: pm.qr_code_url,
        is_active: pm.is_active ?? 1,
        created_at: pm.created_at || new Date().toISOString(),
      })),
      { onConflict: 'id' }
    );
    if (error) result.errors.push(`Payment Methods: ${error.message}`);
    else result.paymentMethodsSynced = data.payment_methods.length;
  }

  // Sync Orders
  for (const ord of data.orders) {
    const res = await saveOrderToSupabase(ord);
    if (res.success) {
      result.ordersSynced++;
    } else if (res.error && !result.errors.includes(res.error)) {
      result.errors.push(`Orders: ${res.error}`);
    }
  }

  return result;
}
