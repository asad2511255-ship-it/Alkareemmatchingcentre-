import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import {
  initDatabase,
  getSettings,
  updateSettings,
  getOwnerAuthStatus,
  registerOwner,
  loginOwner,
  logoutOwner,
  requestPasswordReset,
  resetOwnerPasswordWithCode,
  verifyOwnerToken,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
  getPaymentMethods,
  getPaymentMethodById,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  createOrder,
  getOrderById,
  getOrderByTrackingToken,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getDashboardOverview,
} from './server/db.ts';
import { buildWhatsAppOrderUrl } from './src/utils/orderLogic.ts';
import {
  saveOrderToSupabase,
  updateOrderInSupabase,
  checkSupabaseHealth,
  syncAllToSupabase,
} from './server/supabase.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite DB
initDatabase();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body Parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Directories
const DATA_DIR = path.resolve(process.cwd(), 'data');
const PROOFS_DIR = path.resolve(DATA_DIR, 'uploads', 'proofs');
const PRODUCTS_IMG_DIR = path.resolve(DATA_DIR, 'uploads', 'products');

// Configure Multer for Payment Proofs (Private Storage)
const proofStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PROOFS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
    cb(null, unique);
  },
});

const proofUpload = multer({
  storage: proofStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WebP are accepted.'));
    }
  },
});

// Configure Multer for Product Images (Public Storage)
const productImgStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, PRODUCTS_IMG_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
    cb(null, unique);
  },
});

const productImgUpload = multer({
  storage: productImgStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

// Auth helper middleware
function getBearerToken(req: express.Request): string | undefined {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return undefined;
}

function requireOwnerAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = getBearerToken(req);
  if (!token || !verifyOwnerToken(token)) {
    res.status(401).json({ error: 'Unauthorized: Owner session invalid or expired.' });
    return;
  }
  next();
}

// ------------------- API ROUTES -------------------

// 1. Auth routes
app.get('/api/auth/status', (req, res) => {
  const status = getOwnerAuthStatus();
  const token = getBearerToken(req);
  const isAuthenticated = verifyOwnerToken(token);
  res.json({
    ...status,
    isAuthenticated,
  });
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password } = req.body;
    const result = registerOwner(email, password);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    const result = loginOwner(email, password);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid credentials' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  const token = getBearerToken(req);
  logoutOwner(token);
  res.json({ success: true });
});

app.post('/api/auth/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Please enter a valid owner email address.' });
      return;
    }
    const result = requestPasswordReset(email);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to generate verification code.' });
  }
});

app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { email, code, new_password } = req.body;
    if (!email || !code || !new_password) {
      res.status(400).json({ error: 'Email, 6-digit verification code, and new password are required.' });
      return;
    }
    const result = resetOwnerPasswordWithCode(email, code, new_password);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reset password.' });
  }
});

// 2. Settings
app.get('/api/settings', (_req, res) => {
  res.json(getSettings());
});

app.post('/api/settings', requireOwnerAuth, (req, res) => {
  try {
    const updated = updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Categories
app.get('/api/categories', (req, res) => {
  const activeOnly = req.query.all !== '1';
  res.json(getCategories(activeOnly));
});

app.post('/api/categories', requireOwnerAuth, (req, res) => {
  try {
    const { name, display_order } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }
    const cat = addCategory(name, Number(display_order) || 0);
    res.json(cat);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/categories/:id', requireOwnerAuth, (req, res) => {
  try {
    const updated = updateCategory(req.params.id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', requireOwnerAuth, (req, res) => {
  try {
    const result = deleteCategory(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Products
app.get('/api/products', (req, res) => {
  const categoryId = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const isOwner = verifyOwnerToken(getBearerToken(req));
  const activeOnly = !isOwner || req.query.active_only === '1';

  const products = getProducts({
    categoryId,
    search,
    activeOnly,
  });
  res.json(products);
});

// Permanent Unique Product URL endpoint
app.get('/api/products/:id', (req, res) => {
  const product = getProductById(req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  const isOwner = verifyOwnerToken(getBearerToken(req));
  if (!product.is_active && !isOwner) {
    res.status(404).json({ error: 'Product is currently unavailable' });
    return;
  }
  res.json(product);
});

app.post('/api/products', requireOwnerAuth, (req, res) => {
  try {
    const product = addProduct(req.body);
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', requireOwnerAuth, (req, res) => {
  try {
    const product = updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', requireOwnerAuth, (req, res) => {
  try {
    const result = deleteProduct(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 5. Payment Methods
app.get('/api/payment-methods', (req, res) => {
  const isOwner = verifyOwnerToken(getBearerToken(req));
  const activeOnly = !isOwner || req.query.all !== '1';
  res.json(getPaymentMethods(activeOnly));
});

app.post('/api/payment-methods', requireOwnerAuth, (req, res) => {
  try {
    const method = addPaymentMethod(req.body);
    res.json(method);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/payment-methods/:id', requireOwnerAuth, (req, res) => {
  try {
    const method = updatePaymentMethod(req.params.id, req.body);
    res.json(method);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/payment-methods/:id', requireOwnerAuth, (req, res) => {
  try {
    const result = deletePaymentMethod(req.params.id);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 6. Image Uploads
// Public product images serving
app.use('/api/uploads/products', express.static(PRODUCTS_IMG_DIR));

app.post('/api/upload/product-image', requireOwnerAuth, productImgUpload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No image uploaded' });
    return;
  }
  const imageUrl = `/api/uploads/products/${req.file.filename}`;
  res.json({ imageUrl, filename: req.file.filename });
});

// Customer Payment Proof Upload (Private)
app.post('/api/upload/payment-proof', proofUpload.single('proof'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No proof file uploaded' });
    return;
  }
  res.json({
    filename: req.file.filename,
    path: req.file.path,
    size: req.file.size,
    mimetype: req.file.mimetype,
  });
});

// Strictly Protected Payment Proof Viewing
// Only authorized owner OR customer with valid tracking_token can view!
app.get('/api/orders/:orderId/payment-proof', (req, res) => {
  const order = getOrderById(req.params.orderId);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const token = getBearerToken(req);
  const isOwner = verifyOwnerToken(token);
  const trackingTokenQuery = req.query.token as string | undefined;
  const isCustomerAuthorized = trackingTokenQuery && trackingTokenQuery === order.tracking_token;

  if (!isOwner && !isCustomerAuthorized) {
    res.status(403).json({ error: 'Forbidden: Access denied to private payment proof.' });
    return;
  }

  if (!order.payment_proof_path || !fs.existsSync(order.payment_proof_path)) {
    res.status(404).json({ error: 'Payment proof file missing on server.' });
    return;
  }

  res.sendFile(order.payment_proof_path);
});

// 7. Orders
app.post('/api/orders', (req, res) => {
  try {
    const {
      customer_name,
      customer_phone,
      customer_city,
      delivery_address,
      product_id,
      selected_colour,
      quantity,
      payment_method_id,
      payment_proof_filename,
      payment_proof_path,
      idempotency_key,
    } = req.body;

    const result = createOrder({
      customer_name,
      customer_phone,
      customer_city,
      delivery_address,
      product_id,
      selected_colour,
      quantity,
      payment_method_id,
      payment_proof_filename,
      payment_proof_path,
      idempotency_key,
    });

    const settings = getSettings();
    const whatsappRecipient = settings.whatsapp_number || '03067341386';

    const whatsappPayload = {
      orderId: result.order.order_id,
      createdAt: result.order.created_at,
      customerName: result.order.customer_name,
      customerPhone: result.order.customer_phone,
      customerCity: result.order.customer_city,
      deliveryAddress: result.order.delivery_address,
      productName: result.order.product_name_snapshot,
      productId: result.order.product_id,
      selectedColour: result.order.selected_colour,
      quantity: result.order.quantity,
      unitPrice: result.order.unit_price_snapshot,
      totalPrice: result.order.total_price,
      paymentMethod: result.order.payment_method_snapshot?.provider_name || 'Online Transfer',
    };

    const whatsappUrl = buildWhatsAppOrderUrl(whatsappPayload, whatsappRecipient);

    // Asynchronously sync new order to Supabase database
    saveOrderToSupabase(result.order).catch((syncErr) => {
      console.warn('[Supabase Sync Order Background Error]:', syncErr?.message || syncErr);
    });

    res.json({
      success: true,
      orderId: result.order.order_id,
      trackingToken: result.order.tracking_token,
      order: result.order,
      whatsappUrl,
      isDuplicate: result.isDuplicate,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to process order' });
  }
});

// Customer Tracking Lookup
app.get('/api/orders/track/:token', (req, res) => {
  const order = getOrderByTrackingToken(req.params.token);
  if (!order) {
    res.status(404).json({ error: 'Order not found. Please check your tracking link.' });
    return;
  }
  res.json(order);
});

// Customer search track by 6-digit ID + Phone verification
app.post('/api/orders/track-lookup', (req, res) => {
  const { order_id, phone } = req.body;
  if (!order_id || !phone) {
    res.status(400).json({ error: 'Both 6-digit Order ID and Customer Phone are required to track.' });
    return;
  }
  const order = getOrderById(String(order_id).trim());
  if (!order) {
    res.status(404).json({ error: 'No order found with this Order ID.' });
    return;
  }

  // Normalize phone for comparison
  const normalize = (p: string) => p.replace(/\D/g, '');
  if (!normalize(order.customer_phone).endsWith(normalize(phone).slice(-7))) {
    res.status(403).json({ error: 'Phone number does not match this Order ID.' });
    return;
  }

  const publicData = getOrderByTrackingToken(order.tracking_token);
  res.json(publicData);
});

// 8. Owner Admin Orders Management
app.get('/api/owner/orders', requireOwnerAuth, (req, res) => {
  const { search, status } = req.query;
  const orders = getAllOrders({
    search: search as string | undefined,
    status: status as string | undefined,
  });
  res.json(orders);
});

app.get('/api/owner/orders/:orderId', requireOwnerAuth, (req, res) => {
  const order = getOrderById(req.params.orderId);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  res.json(order);
});

app.put('/api/owner/orders/:orderId/status', requireOwnerAuth, (req, res) => {
  try {
    const updated = updateOrderStatus(req.params.orderId, req.body);
    // Asynchronously sync update to Supabase
    updateOrderInSupabase(req.params.orderId, req.body).catch((err) => {
      console.warn('[Supabase Sync Order Status Background Error]:', err?.message || err);
    });
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/owner/orders/:orderId', requireOwnerAuth, (req, res) => {
  try {
    const result = deleteOrder(req.params.orderId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 9. Supabase Integration & Status Routes
app.get('/api/supabase/status', async (_req, res) => {
  try {
    const health = await checkSupabaseHealth();
    res.json(health);
  } catch (err: any) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

app.get('/api/supabase/schema', (_req, res) => {
  try {
    const schemaPath = path.resolve(process.cwd(), 'supabase_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      res.type('text/plain').send(sql);
    } else {
      res.status(404).json({ error: 'Schema file not found' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/owner/supabase/sync', requireOwnerAuth, async (_req, res) => {
  try {
    const orders = getAllOrders();
    const products = getProducts();
    const categories = getCategories();
    const paymentMethods = getPaymentMethods();

    const syncResult = await syncAllToSupabase({
      orders,
      products,
      categories,
      payment_methods: paymentMethods,
    });

    res.json({
      success: true,
      ...syncResult,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Owner Overview & Notifications
app.get('/api/owner/overview', requireOwnerAuth, (_req, res) => {
  res.json(getDashboardOverview());
});

app.get('/api/owner/notifications', requireOwnerAuth, (_req, res) => {
  res.json(getNotifications());
});

app.post('/api/owner/notifications/:id/read', requireOwnerAuth, (req, res) => {
  res.json(markNotificationRead(req.params.id));
});

app.post('/api/owner/notifications/read-all', requireOwnerAuth, (_req, res) => {
  res.json(markAllNotificationsRead());
});

// ------------------- VITE / STATIC INTEGRATION -------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AL KAREEM MATCHING CENTRE full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
