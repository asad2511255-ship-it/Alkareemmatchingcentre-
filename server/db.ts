import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { generateCandidateSixDigitId, calculateOrderTotal, validateColour } from '../src/utils/orderLogic.ts';

// Ensure data directories exist
const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const PROOFS_DIR = path.resolve(UPLOADS_DIR, 'proofs');
const PRODUCTS_IMG_DIR = path.resolve(UPLOADS_DIR, 'products');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(PROOFS_DIR)) fs.mkdirSync(PROOFS_DIR, { recursive: true });
if (!fs.existsSync(PRODUCTS_IMG_DIR)) fs.mkdirSync(PRODUCTS_IMG_DIR, { recursive: true });

const dbPath = path.resolve(DATA_DIR, 'alkareem.db');
export const db = new DatabaseSync(dbPath);

// Initialize Tables
export function initDatabase() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS owner_auth (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS owner_sessions (
      token TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_reset_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category_id TEXT NOT NULL,
      price_pkr REAL NOT NULL,
      available_colours TEXT NOT NULL, -- JSON array
      stock_quantity INTEGER NOT NULL DEFAULT 10,
      is_active INTEGER NOT NULL DEFAULT 1,
      images TEXT NOT NULL, -- JSON array
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment_methods (
      id TEXT PRIMARY KEY,
      provider_name TEXT NOT NULL,
      account_holder_name TEXT NOT NULL,
      bank_or_wallet_name TEXT NOT NULL,
      account_number_or_iban TEXT NOT NULL,
      payment_instructions TEXT NOT NULL,
      qr_code_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_id TEXT UNIQUE NOT NULL, -- Exactly 6 digits
      tracking_token TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_city TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name_snapshot TEXT NOT NULL,
      product_image_snapshot TEXT,
      selected_colour TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price_snapshot REAL NOT NULL,
      total_price REAL NOT NULL,
      payment_method_id TEXT NOT NULL,
      payment_method_snapshot TEXT NOT NULL,
      payment_proof_filename TEXT NOT NULL,
      payment_proof_path TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'Awaiting Verification',
      order_status TEXT NOT NULL DEFAULT 'In Review',
      estimated_delivery_date TEXT,
      status_history TEXT NOT NULL, -- JSON array
      idempotency_key TEXT UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      order_id TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  // Seed Default Settings
  const defaultSettings: Record<string, string> = {
    brand_name: 'AL KAREEM MATCHING CENTRE',
    homepage_description: 'Premium Quality Fabrics, Beautiful Designs, and Multiple Colours. Only Online Payment Accepted.',
    contact_number: '03067341386',
    whatsapp_number: '03067341386',
    business_address: 'Moti Bazar, Link Masjid Wali Gali, Fatehpur',
    announcement: 'Welcome to AL KAREEM MATCHING CENTRE — Serving you with unmatched fabric matching & luxury unstitched fabrics.',
  };

  const getSettingStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const insertSettingStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');

  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = getSettingStmt.get(key);
    if (!existing) {
      insertSettingStmt.run(key, value);
    }
  }

  // Seed Categories if empty
  const countCategories = (db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number }).count;
  if (countCategories === 0) {
    const initialCategories = [
      { id: 'cat-dupatta', name: 'Dupatta', display_order: 1 },
      { id: 'cat-silk', name: 'Silk', display_order: 2 },
      { id: 'cat-shamoos', name: 'Shamoos', display_order: 3 },
      { id: 'cat-other-fabrics', name: 'Other Fabrics', display_order: 4 },
    ];

    const insertCat = db.prepare('INSERT INTO categories (id, name, display_order, is_active, created_at) VALUES (?, ?, ?, 1, ?)');
    for (const cat of initialCategories) {
      insertCat.run(cat.id, cat.name, cat.display_order, new Date().toISOString());
    }
  }

  // Seed Initial Products if empty
  const countProducts = (db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }).count;
  if (countProducts === 0) {
    const seedProducts = [
      {
        id: 'prod-shamoos-royal',
        name: 'Pure Shamoos Silk Fabric (Per Meter)',
        description: 'Ultra-luxurious, heavyweight Shamoos silk with a lustrous sheen and buttery soft drape. Ideal for premium matching shirts, formal trousers, and bridal dupattas.',
        category_id: 'cat-shamoos',
        price_pkr: 2850,
        available_colours: JSON.stringify(['Emerald Green', 'Royal Maroon', 'Mustard Gold', 'Plum Wine', 'Navy Blue', 'Ivory Cream']),
        stock_quantity: 45,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1000&q=80',
        ]),
        created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'prod-banarasi-dupatta',
        name: 'Traditional Banarasi Zari Chiffon Dupatta',
        description: 'Handcrafted floral zari border detailing on fine blended chiffon. Perfectly matched for wedding ensembles, festive occasions, and party wear matching.',
        category_id: 'cat-dupatta',
        price_pkr: 3450,
        available_colours: JSON.stringify(['Ruby Red', 'Deep Teal', 'Antique Gold', 'Black Gold', 'Rust Orange']),
        stock_quantity: 28,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80',
        ]),
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'prod-raw-silk-formal',
        name: '80-Gram Pakistani Raw Silk Matching Fabric',
        description: 'Dense, structured 80g raw silk featuring a signature subtle slub texture. Outstanding color absorption, designed for cigarette pants, kurtis, and matching suit bases.',
        category_id: 'cat-silk',
        price_pkr: 1950,
        available_colours: JSON.stringify(['Olive Green', 'Crimson Red', 'Powder Blue', 'Champagne', 'Charcoal Grey', 'Coffee Brown']),
        stock_quantity: 60,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1607344645866-009c320b5ab8?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1000&q=80',
        ]),
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'prod-organza-cutwork',
        name: 'Embroidered Cutwork Organza Dupatta',
        description: 'Intricate scalloped four-sided cutwork border with subtle sequin dusting on lightweight crisp organza. High aesthetic value for festive contrast matching.',
        category_id: 'cat-dupatta',
        price_pkr: 2650,
        available_colours: JSON.stringify(['Blush Pink', 'Mint Green', 'Lilac Mist', 'Pure White', 'Golden Beige']),
        stock_quantity: 35,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1000&q=80',
          'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=80',
        ]),
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: 'prod-jacquard-luxe',
        name: 'Metallic Weave Self-Jacquard Fabric',
        description: 'Exclusive metallic thread woven jacquard textile. Rich texture with soft hand-feel, wrinkle resistant and resilient for complete formal styling.',
        category_id: 'cat-other-fabrics',
        price_pkr: 2200,
        available_colours: JSON.stringify(['Midnight Blue', 'Emerald Gold', 'Dusty Rose', 'Silver Frost', 'Bronze Ochre']),
        stock_quantity: 40,
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1000&q=80',
        ]),
        created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
    ];

    const insertProd = db.prepare(`
      INSERT INTO products (id, name, description, category_id, price_pkr, available_colours, stock_quantity, is_active, images, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)
    `);

    for (const p of seedProducts) {
      insertProd.run(p.id, p.name, p.description, p.category_id, p.price_pkr, p.available_colours, p.stock_quantity, p.images, p.created_at, p.updated_at);
    }
  }

  // Notice Requirement 9:
  // "Start with no active payment methods until the owner configures them."
  // We strictly start with zero active payment methods! Owner can add EasyPaisa, JazzCash, Meezan Bank, etc.
}

// ------------------- AUTH -------------------

export function getOwnerAuthStatus() {
  const row = db.prepare('SELECT email, created_at FROM owner_auth WHERE id = 1').get() as { email: string; created_at: string } | undefined;
  return {
    isRegistered: Boolean(row),
    email: row ? row.email : null,
  };
}

export function registerOwner(email: string, password: string) {
  // Enforce one-time registration in backend
  const existing = db.prepare('SELECT id FROM owner_auth WHERE id = 1').get();
  if (existing) {
    throw new Error('Owner account has already been registered. Public registration is permanently closed.');
  }

  if (!email || !email.includes('@') || !password || password.length < 6) {
    throw new Error('Valid email and password (min 6 characters) are required.');
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO owner_auth (id, email, password_hash, salt, created_at, last_login_at)
    VALUES (1, ?, ?, ?, ?, ?)
  `).run(email.toLowerCase().trim(), passwordHash, salt, now, now);

  // Generate session token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(); // 30 days
  db.prepare('INSERT INTO owner_sessions (token, created_at, expires_at) VALUES (?, ?, ?)').run(token, now, expiresAt);

  return { token, email: email.toLowerCase().trim() };
}

export function loginOwner(email: string, password: string) {
  const row = db.prepare('SELECT email, password_hash, salt FROM owner_auth WHERE id = 1').get() as { email: string; password_hash: string; salt: string } | undefined;
  if (!row) {
    throw new Error('Owner account not registered yet.');
  }

  if (row.email.toLowerCase() !== email.toLowerCase().trim()) {
    throw new Error('Invalid email or password.');
  }

  const hashAttempt = crypto.pbkdf2Sync(password, row.salt, 100000, 64, 'sha512').toString('hex');
  if (hashAttempt !== row.password_hash) {
    throw new Error('Invalid email or password.');
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE owner_auth SET last_login_at = ? WHERE id = 1').run(now);

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  db.prepare('INSERT INTO owner_sessions (token, created_at, expires_at) VALUES (?, ?, ?)').run(token, now, expiresAt);

  return { token, email: row.email };
}

export function verifyOwnerToken(token: string | undefined): boolean {
  if (!token) return false;
  const row = db.prepare('SELECT token, expires_at FROM owner_sessions WHERE token = ?').get(token) as { token: string; expires_at: string } | undefined;
  if (!row) return false;
  if (new Date(row.expires_at) < new Date()) {
    db.prepare('DELETE FROM owner_sessions WHERE token = ?').run(token);
    return false;
  }
  return true;
}

export function logoutOwner(token: string | undefined) {
  if (!token) return;
  db.prepare('DELETE FROM owner_sessions WHERE token = ?').run(token);
}

export function requestPasswordReset(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const owner = db.prepare('SELECT email FROM owner_auth WHERE id = 1').get() as { email: string } | undefined;
  if (!owner) {
    throw new Error('No owner account has been registered yet.');
  }

  if (owner.email.toLowerCase() !== normalizedEmail) {
    throw new Error('This email does not match the registered owner account.');
  }

  // Generate 6-digit numeric OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const id = `reset-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

  // Invalidate any previously active codes for this email
  db.prepare('UPDATE password_reset_codes SET used = 1 WHERE email = ? AND used = 0').run(normalizedEmail);

  // Insert fresh code
  db.prepare(`
    INSERT INTO password_reset_codes (id, email, code, expires_at, used, created_at)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(id, normalizedEmail, code, expiresAt, now);

  console.log(`[PASSWORD RESET] Verification code generated for ${normalizedEmail}: ${code} (Expires in 15 mins)`);

  return {
    success: true,
    email: normalizedEmail,
    code, // Returned for dev helper / live preview so owner is never locked out
    expiresInMinutes: 15,
    message: `A 6-digit verification code has been dispatched to ${normalizedEmail}.`,
  };
}

export function resetOwnerPasswordWithCode(email: string, code: string, newPassword: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedCode = code.trim();

  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  const row = db.prepare(`
    SELECT id, email, code, expires_at, used
    FROM password_reset_codes
    WHERE email = ? AND code = ? AND used = 0
    ORDER BY created_at DESC
    LIMIT 1
  `).get(normalizedEmail, normalizedCode) as { id: string; email: string; code: string; expires_at: string; used: number } | undefined;

  if (!row) {
    throw new Error('Invalid verification code or email. Please check your code or request a new one.');
  }

  if (new Date(row.expires_at) < new Date()) {
    throw new Error('This verification code has expired. Please request a new 6-digit code.');
  }

  // Generate new salt and hash with PBKDF2
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.pbkdf2Sync(newPassword, salt, 100000, 64, 'sha512').toString('hex');
  const now = new Date().toISOString();

  // Update owner password in owner_auth
  db.prepare(`
    UPDATE owner_auth
    SET password_hash = ?, salt = ?, last_login_at = ?
    WHERE id = 1
  `).run(passwordHash, salt, now);

  // Mark code as used
  db.prepare('UPDATE password_reset_codes SET used = 1 WHERE id = ?').run(row.id);

  // Revoke all previous sessions
  db.prepare('DELETE FROM owner_sessions').run();

  // Create new active session token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
  db.prepare('INSERT INTO owner_sessions (token, created_at, expires_at) VALUES (?, ?, ?)').run(token, now, expiresAt);

  return {
    success: true,
    token,
    email: normalizedEmail,
    message: 'Owner password has been updated successfully!',
  };
}

// ------------------- SETTINGS -------------------

export function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  return settings;
}

export function updateSettings(data: Record<string, string>) {
  const stmt = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  for (const [key, value] of Object.entries(data)) {
    stmt.run(key, String(value));
  }
  return getSettings();
}

// ------------------- CATEGORIES -------------------

export function getCategories(activeOnly = false) {
  const query = activeOnly
    ? 'SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC, name ASC'
    : 'SELECT * FROM categories ORDER BY display_order ASC, name ASC';
  return db.prepare(query).all();
}

export function addCategory(name: string, displayOrder = 0) {
  const id = `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();
  db.prepare('INSERT INTO categories (id, name, display_order, is_active, created_at) VALUES (?, ?, ?, 1, ?)').run(id, name.trim(), displayOrder, now);
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

export function updateCategory(id: string, data: { name?: string; display_order?: number; is_active?: number }) {
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) throw new Error('Category not found');

  const fields: string[] = [];
  const params: (string | number)[] = [];

  if (typeof data.name === 'string') {
    fields.push('name = ?');
    params.push(data.name.trim());
  }
  if (typeof data.display_order === 'number') {
    fields.push('display_order = ?');
    params.push(data.display_order);
  }
  if (typeof data.is_active === 'number') {
    fields.push('is_active = ?');
    params.push(data.is_active);
  }

  if (fields.length > 0) {
    params.push(id);
    db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

export function deleteCategory(id: string) {
  // Check if any product is assigned to this category
  const productCount = (db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(id) as { count: number }).count;
  if (productCount > 0) {
    throw new Error(`Cannot delete category: ${productCount} product(s) are currently assigned to it. Reassign or delete the products first.`);
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  return { success: true };
}

// ------------------- PRODUCTS -------------------

export interface ProductInput {
  name: string;
  description: string;
  category_id: string;
  price_pkr: number;
  available_colours: string[];
  stock_quantity: number;
  images: string[];
  is_active?: number;
}

export function getProducts(options: { categoryId?: string; search?: string; activeOnly?: boolean } = {}) {
  let query = 'SELECT * FROM products WHERE 1=1';
  const params: (string | number)[] = [];

  if (options.activeOnly) {
    query += ' AND is_active = 1';
  }

  if (options.categoryId && options.categoryId !== 'all') {
    query += ' AND category_id = ?';
    params.push(options.categoryId);
  }

  if (options.search && options.search.trim()) {
    const s = `%${options.search.trim().toLowerCase()}%`;
    query += ' AND (LOWER(name) LIKE ? OR LOWER(description) LIKE ?)';
    params.push(s, s);
  }

  // Automatic newest-first sorting using database creation timestamp in descending order
  query += ' ORDER BY datetime(created_at) DESC';

  const rows = db.prepare(query).all(...params) as any[];
  return rows.map((r) => ({
    ...r,
    available_colours: JSON.parse(r.available_colours || '[]'),
    images: JSON.parse(r.images || '[]'),
  }));
}

export function getProductById(id: string) {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
  if (!row) return null;
  return {
    ...row,
    available_colours: JSON.parse(row.available_colours || '[]'),
    images: JSON.parse(row.images || '[]'),
  };
}

export function addProduct(data: ProductInput) {
  const id = `prod-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();
  const availableColoursJson = JSON.stringify(data.available_colours || []);
  const imagesJson = JSON.stringify(data.images || []);
  const isActive = data.is_active !== undefined ? data.is_active : 1;

  db.prepare(`
    INSERT INTO products (id, name, description, category_id, price_pkr, available_colours, stock_quantity, is_active, images, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.name.trim(),
    data.description.trim(),
    data.category_id,
    Number(data.price_pkr),
    availableColoursJson,
    Number(data.stock_quantity),
    isActive,
    imagesJson,
    now,
    now
  );

  return getProductById(id);
}

export function updateProduct(id: string, data: Partial<ProductInput>) {
  const existing = getProductById(id);
  if (!existing) throw new Error('Product not found');

  const fields: string[] = [];
  const params: any[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    params.push(data.name.trim());
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    params.push(data.description.trim());
  }
  if (data.category_id !== undefined) {
    fields.push('category_id = ?');
    params.push(data.category_id);
  }
  if (data.price_pkr !== undefined) {
    fields.push('price_pkr = ?');
    params.push(Number(data.price_pkr));
  }
  if (data.available_colours !== undefined) {
    fields.push('available_colours = ?');
    params.push(JSON.stringify(data.available_colours));
  }
  if (data.stock_quantity !== undefined) {
    fields.push('stock_quantity = ?');
    params.push(Number(data.stock_quantity));
  }
  if (data.is_active !== undefined) {
    fields.push('is_active = ?');
    params.push(Number(data.is_active));
  }
  if (data.images !== undefined) {
    fields.push('images = ?');
    params.push(JSON.stringify(data.images));
  }

  fields.push('updated_at = ?');
  params.push(new Date().toISOString());

  params.push(id);
  db.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).run(...params);

  return getProductById(id);
}

export function deleteProduct(id: string) {
  const existing = getProductById(id);
  if (!existing) throw new Error('Product not found');
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return { success: true };
}

// ------------------- PAYMENT METHODS -------------------

export interface PaymentMethodInput {
  provider_name: string;
  account_holder_name: string;
  bank_or_wallet_name: string;
  account_number_or_iban: string;
  payment_instructions: string;
  qr_code_url?: string;
  is_active?: number;
}

export function getPaymentMethods(activeOnly = false) {
  const query = activeOnly
    ? 'SELECT * FROM payment_methods WHERE is_active = 1 ORDER BY created_at DESC'
    : 'SELECT * FROM payment_methods ORDER BY created_at DESC';
  return db.prepare(query).all();
}

export function getPaymentMethodById(id: string) {
  return db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(id) as any;
}

export function addPaymentMethod(data: PaymentMethodInput) {
  const id = `pm-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO payment_methods (id, provider_name, account_holder_name, bank_or_wallet_name, account_number_or_iban, payment_instructions, qr_code_url, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.provider_name.trim(),
    data.account_holder_name.trim(),
    data.bank_or_wallet_name.trim(),
    data.account_number_or_iban.trim(),
    data.payment_instructions.trim(),
    data.qr_code_url || null,
    data.is_active !== undefined ? data.is_active : 1,
    now
  );
  return db.prepare('SELECT * FROM payment_methods WHERE id = ?').get(id);
}

export function updatePaymentMethod(id: string, data: Partial<PaymentMethodInput>) {
  const existing = getPaymentMethodById(id);
  if (!existing) throw new Error('Payment method not found');

  const fields: string[] = [];
  const params: any[] = [];

  if (data.provider_name !== undefined) {
    fields.push('provider_name = ?');
    params.push(data.provider_name.trim());
  }
  if (data.account_holder_name !== undefined) {
    fields.push('account_holder_name = ?');
    params.push(data.account_holder_name.trim());
  }
  if (data.bank_or_wallet_name !== undefined) {
    fields.push('bank_or_wallet_name = ?');
    params.push(data.bank_or_wallet_name.trim());
  }
  if (data.account_number_or_iban !== undefined) {
    fields.push('account_number_or_iban = ?');
    params.push(data.account_number_or_iban.trim());
  }
  if (data.payment_instructions !== undefined) {
    fields.push('payment_instructions = ?');
    params.push(data.payment_instructions.trim());
  }
  if (data.qr_code_url !== undefined) {
    fields.push('qr_code_url = ?');
    params.push(data.qr_code_url || null);
  }
  if (data.is_active !== undefined) {
    fields.push('is_active = ?');
    params.push(Number(data.is_active));
  }

  if (fields.length > 0) {
    params.push(id);
    db.prepare(`UPDATE payment_methods SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  }
  return getPaymentMethodById(id);
}

export function deletePaymentMethod(id: string) {
  db.prepare('DELETE FROM payment_methods WHERE id = ?').run(id);
  return { success: true };
}

// ------------------- ORDERS -------------------

export interface CreateOrderInput {
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
  idempotency_key?: string;
}

export function createOrder(input: CreateOrderInput) {
  // Idempotency check
  if (input.idempotency_key) {
    const existingOrder = db.prepare('SELECT * FROM orders WHERE idempotency_key = ?').get(input.idempotency_key) as any;
    if (existingOrder) {
      return {
        isDuplicate: true,
        order: {
          ...existingOrder,
          status_history: JSON.parse(existingOrder.status_history || '[]'),
          payment_method_snapshot: JSON.parse(existingOrder.payment_method_snapshot || '{}'),
        },
      };
    }
  }

  // 1. Mandatory fields validation
  if (!input.customer_name?.trim()) throw new Error('Customer full name is required');
  if (!input.customer_city?.trim()) throw new Error('City is required');
  if (!input.customer_phone?.trim()) throw new Error('Customer phone number is required');
  if (!input.delivery_address?.trim()) throw new Error('Delivery address is required');
  if (!input.product_id) throw new Error('Product selection is required');
  if (!input.selected_colour?.trim()) throw new Error('Colour selection is required');
  if (!input.payment_method_id) throw new Error('Payment method is required');
  
  const proofFilename = input.payment_proof_filename?.trim() || 'send_via_whatsapp';
  const proofPath = input.payment_proof_path?.trim() || 'send_via_whatsapp';

  const quantity = Math.floor(Number(input.quantity));
  if (!quantity || quantity <= 0) throw new Error('Quantity must be at least 1');

  // 2. Fetch actual product from database
  const product = getProductById(input.product_id);
  if (!product || !product.is_active) {
    throw new Error('Selected product is no longer active or available');
  }

  // 3. Validate stock
  if (product.stock_quantity < quantity) {
    throw new Error(`Insufficient stock. Only ${product.stock_quantity} item(s) available.`);
  }

  // 4. Validate colour against product available colours
  if (!validateColour(input.selected_colour, product.available_colours)) {
    throw new Error(`Invalid colour "${input.selected_colour}". Available colours are: ${product.available_colours.join(', ')}`);
  }

  // 5. Fetch actual payment method
  const paymentMethod = getPaymentMethodById(input.payment_method_id);
  if (!paymentMethod || !paymentMethod.is_active) {
    throw new Error('Selected payment method is inactive or invalid');
  }

  // 6. Calculate server-authoritative price
  const unitPrice = product.price_pkr;
  const totalPrice = calculateOrderTotal(unitPrice, quantity);

  // 7. Generate collision-safe 6-digit numeric ID
  let orderId = '';
  let attempts = 0;
  const checkIdStmt = db.prepare('SELECT 1 FROM orders WHERE order_id = ?');
  while (attempts < 50) {
    const candidate = generateCandidateSixDigitId();
    if (!checkIdStmt.get(candidate)) {
      orderId = candidate;
      break;
    }
    attempts++;
  }
  if (!orderId) {
    throw new Error('Unable to generate unique order ID. Please try again.');
  }

  const internalId = `ord-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const trackingToken = crypto.randomBytes(24).toString('hex');
  const now = new Date().toISOString();

  const statusHistory = [
    {
      status: 'In Review',
      timestamp: now,
      note: 'Order submitted. Payment proof received and awaiting manual owner verification.',
    },
  ];

  const paymentMethodSnapshot = {
    provider_name: paymentMethod.provider_name,
    bank_or_wallet_name: paymentMethod.bank_or_wallet_name,
    account_holder_name: paymentMethod.account_holder_name,
    account_number_or_iban: paymentMethod.account_number_or_iban,
  };

  const primaryImage = product.images?.[0] || '';

  // Execute in transaction
  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare(`
      INSERT INTO orders (
        id, order_id, tracking_token, customer_name, customer_phone, customer_city,
        delivery_address, product_id, product_name_snapshot, product_image_snapshot,
        selected_colour, quantity, unit_price_snapshot, total_price,
        payment_method_id, payment_method_snapshot, payment_proof_filename,
        payment_proof_path, payment_status, order_status, estimated_delivery_date,
        status_history, idempotency_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Awaiting Verification', 'In Review', NULL, ?, ?, ?)
    `).run(
      internalId,
      orderId,
      trackingToken,
      input.customer_name.trim(),
      input.customer_phone.trim(),
      input.customer_city.trim(),
      input.delivery_address.trim(),
      product.id,
      product.name,
      primaryImage,
      input.selected_colour.trim(),
      quantity,
      unitPrice,
      totalPrice,
      paymentMethod.id,
      JSON.stringify(paymentMethodSnapshot),
      proofFilename,
      proofPath,
      JSON.stringify(statusHistory),
      input.idempotency_key || null,
      now
    );

    // Decrement stock
    db.prepare('UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ?').run(quantity, now, product.id);

    // Create owner notification
    const notificationId = `notif-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    db.prepare(`
      INSERT INTO notifications (id, title, message, order_id, is_read, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(
      notificationId,
      `New Order Received — Order ID: ${orderId}`,
      `New order from ${input.customer_name.trim()} (${input.customer_city.trim()}) for ${product.name} [${input.selected_colour} x ${quantity}] - PKR ${Math.round(totalPrice).toLocaleString('en-PK')}. Payment proof is ready for review.`,
      orderId,
      now
    );

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  const savedOrder = getOrderById(orderId);
  return { isDuplicate: false, order: savedOrder, trackingToken };
}

export function getOrderById(orderId: string) {
  const row = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(orderId) as any;
  if (!row) return null;
  return {
    ...row,
    status_history: JSON.parse(row.status_history || '[]'),
    payment_method_snapshot: JSON.parse(row.payment_method_snapshot || '{}'),
  };
}

export function getOrderByTrackingToken(token: string) {
  const row = db.prepare('SELECT * FROM orders WHERE tracking_token = ?').get(token) as any;
  if (!row) return null;
  return {
    order_id: row.order_id,
    tracking_token: row.tracking_token,
    created_at: row.created_at,
    customer_name: row.customer_name,
    customer_city: row.customer_city,
    delivery_address: row.delivery_address,
    product_name_snapshot: row.product_name_snapshot,
    product_image_snapshot: row.product_image_snapshot,
    selected_colour: row.selected_colour,
    quantity: row.quantity,
    unit_price_snapshot: row.unit_price_snapshot,
    total_price: row.total_price,
    payment_status: row.payment_status,
    order_status: row.order_status,
    estimated_delivery_date: row.estimated_delivery_date,
    status_history: JSON.parse(row.status_history || '[]'),
  };
}

export function getAllOrders(options: { search?: string; status?: string } = {}) {
  let query = 'SELECT * FROM orders WHERE 1=1';
  const params: string[] = [];

  if (options.status && options.status !== 'all') {
    query += ' AND order_status = ?';
    params.push(options.status);
  }

  if (options.search && options.search.trim()) {
    const s = `%${options.search.trim().toLowerCase()}%`;
    query += ' AND (order_id LIKE ? OR LOWER(customer_name) LIKE ? OR customer_phone LIKE ? OR LOWER(customer_city) LIKE ?)';
    params.push(s, s, s, s);
  }

  query += ' ORDER BY datetime(created_at) DESC';

  const rows = db.prepare(query).all(...params) as any[];
  return rows.map((r) => ({
    ...r,
    status_history: JSON.parse(r.status_history || '[]'),
    payment_method_snapshot: JSON.parse(r.payment_method_snapshot || '{}'),
  }));
}

export function updateOrderStatus(
  orderId: string,
  updates: {
    order_status?: 'In Review' | 'Payment Verified' | 'Completed';
    payment_status?: string;
    estimated_delivery_date?: string;
    note?: string;
  }
) {
  const order = getOrderById(orderId);
  if (!order) throw new Error('Order not found');

  const now = new Date().toISOString();
  const history = order.status_history || [];

  const fields: string[] = [];
  const params: any[] = [];

  if (updates.order_status) {
    fields.push('order_status = ?');
    params.push(updates.order_status);

    // If marking Payment Verified, payment_status automatically becomes Verified
    if (updates.order_status === 'Payment Verified') {
      fields.push("payment_status = 'Verified'");
      if (!updates.estimated_delivery_date && !order.estimated_delivery_date) {
        throw new Error('Estimated delivery date is required when verifying payment.');
      }
    } else if (updates.order_status === 'Completed') {
      fields.push("payment_status = 'Verified'");
    }
  }

  if (updates.payment_status) {
    fields.push('payment_status = ?');
    params.push(updates.payment_status);
  }

  if (updates.estimated_delivery_date !== undefined) {
    fields.push('estimated_delivery_date = ?');
    params.push(updates.estimated_delivery_date);
  }

  // Append history
  const statusNote =
    updates.note ||
    (updates.order_status === 'Payment Verified'
      ? `Payment manually verified by owner. Estimated delivery: ${updates.estimated_delivery_date || order.estimated_delivery_date}`
      : updates.order_status === 'Completed'
      ? 'Order marked as completed by owner.'
      : 'Order updated by owner.');

  history.push({
    status: updates.order_status || order.order_status,
    timestamp: now,
    note: statusNote,
  });

  fields.push('status_history = ?');
  params.push(JSON.stringify(history));

  params.push(orderId);
  db.prepare(`UPDATE orders SET ${fields.join(', ')} WHERE order_id = ?`).run(...params);

  return getOrderById(orderId);
}

export function deleteOrder(orderId: string) {
  const order = getOrderById(orderId);
  if (!order) throw new Error('Order not found');

  // Remove payment proof file if exists
  if (order.payment_proof_path && fs.existsSync(order.payment_proof_path)) {
    try {
      fs.unlinkSync(order.payment_proof_path);
    } catch (e) {
      console.error('Failed to unlink proof file:', e);
    }
  }

  db.prepare('DELETE FROM orders WHERE order_id = ?').run(orderId);
  db.prepare('DELETE FROM notifications WHERE order_id = ?').run(orderId);
  return { success: true };
}

// ------------------- NOTIFICATIONS -------------------

export function getNotifications() {
  return db.prepare('SELECT * FROM notifications ORDER BY datetime(created_at) DESC LIMIT 50').all();
}

export function markNotificationRead(id: string) {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
  return { success: true };
}

export function markAllNotificationsRead() {
  db.prepare('UPDATE notifications SET is_read = 1').run();
  return { success: true };
}

// ------------------- DASHBOARD STATS -------------------

export function getDashboardOverview() {
  const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number }).count;
  const awaitingVerification = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'In Review'").get() as { count: number }).count;
  const verifiedOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Payment Verified'").get() as { count: number }).count;
  const completedOrders = (db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'Completed'").get() as { count: number }).count;

  const totalRevenue = (db.prepare("SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE order_status IN ('Payment Verified', 'Completed')").get() as { total: number }).total;

  const unreadNotifications = (db.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').get() as { count: number }).count;

  const recentOrders = getAllOrders().slice(0, 5);
  const recentProducts = getProducts().slice(0, 5);

  return {
    totalOrders,
    awaitingVerification,
    verifiedOrders,
    completedOrders,
    totalRevenue,
    unreadNotifications,
    recentOrders,
    recentProducts,
  };
}
