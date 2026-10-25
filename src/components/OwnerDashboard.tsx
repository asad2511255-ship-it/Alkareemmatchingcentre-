import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  FolderTree,
  FileText,
  CreditCard,
  Settings,
  Bell,
  Download,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  AlertCircle,
  ExternalLink,
  Copy,
  Smartphone,
  ArrowUpDown,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Phone,
  Image as ImageIcon,
  Database,
  RefreshCw,
} from 'lucide-react';
import {
  Product,
  Category,
  PaymentMethod,
  Order,
  StoreSettings,
  AdminNotification,
  DashboardOverviewData,
} from '../types.ts';
import { api, clearAuthToken } from '../utils/api.ts';
import { formatPkr } from '../utils/orderLogic.ts';

interface OwnerDashboardProps {
  onClose: () => void;
  onLogout: () => void;
}

type TabType =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'payments'
  | 'settings'
  | 'supabase'
  | 'notifications'
  | 'owner_app';

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ onClose, onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Global Dashboard state
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [settings, setSettings] = useState<StoreSettings>({
    brand_name: 'AL KAREEM MATCHING CENTRE',
    homepage_description: '',
    contact_number: '',
    whatsapp_number: '',
    business_address: '',
    announcement: '',
  });
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Orders Tab filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);
  const [viewingProofOrderId, setViewingProofOrderId] = useState<string | null>(null);

  // Status Update state
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [deliveryDateInput, setDeliveryDateInput] = useState('');
  const [statusUpdateNote, setStatusUpdateNote] = useState('');

  // Products Tab states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    category_id: '',
    price_pkr: 0,
    available_colours: '',
    stock_quantity: 10,
    images: [] as string[],
    is_active: 1,
  });

  // Category Tab states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Payment Method Tab states
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    provider_name: '',
    bank_or_wallet_name: '',
    account_holder_name: '',
    account_number_or_iban: '',
    payment_instructions: '',
    qr_code_url: '',
    is_active: 1,
  });

  // Settings Tab
  const [settingsForm, setSettingsForm] = useState<StoreSettings>({
    brand_name: '',
    homepage_description: '',
    contact_number: '',
    whatsapp_number: '',
    business_address: '',
    announcement: '',
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Notification badge count
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Supabase Database state
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    projectId: string;
    url: string;
    hasOrdersTable: boolean;
    hasProductsTable: boolean;
    error?: string;
    lastChecked: string;
  } | null>(null);
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const [supabaseSyncResult, setSupabaseSyncResult] = useState<{
    success: boolean;
    ordersSynced: number;
    productsSynced: number;
    categoriesSynced: number;
    paymentMethodsSynced: number;
    errors: string[];
  } | null>(null);
  const [sqlSchema, setSqlSchema] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [refreshKey]);

  useEffect(() => {
    if (activeTab === 'supabase') {
      loadSupabaseInfo();
    }
  }, [activeTab]);

  const loadSupabaseInfo = async () => {
    setSupabaseLoading(true);
    try {
      const [status, schema] = await Promise.all([
        api.getSupabaseStatus(),
        api.getSupabaseSchema(),
      ]);
      setSupabaseStatus(status);
      setSqlSchema(schema);
    } catch (e: any) {
      console.warn('Failed to load Supabase info:', e);
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setSupabaseLoading(true);
    setSupabaseSyncResult(null);
    try {
      const res = await api.syncAllToSupabase();
      setSupabaseSyncResult(res);
      await loadSupabaseInfo();
    } catch (e: any) {
      alert(e.message || 'Failed to sync to Supabase');
    } finally {
      setSupabaseLoading(false);
    }
  };

  const handleCopySql = () => {
    if (!sqlSchema) return;
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [ov, prods, cats, ords, pms, st, notifs] = await Promise.all([
        api.getDashboardOverview(),
        api.getProducts(),
        api.getCategories(true),
        api.getOwnerOrders(),
        api.getPaymentMethods(true),
        api.getSettings(),
        api.getNotifications(),
      ]);
      setOverview(ov);
      setProducts(prods);
      setCategories(cats);
      setOrders(ords);
      setPaymentMethods(pms);
      setSettings(st);
      setSettingsForm(st);
      setNotifications(notifs);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    onLogout();
  };

  // ---------------- ORDER ACTIONS ----------------
  const handleVerifyPaymentSubmit = async () => {
    if (!verifyingOrder) return;
    if (!deliveryDateInput.trim()) {
      alert('Estimated Delivery Date is required when verifying payment.');
      return;
    }
    try {
      await api.updateOrderStatus(verifyingOrder.order_id, {
        order_status: 'Payment Verified',
        estimated_delivery_date: deliveryDateInput.trim(),
        note: statusUpdateNote.trim() || undefined,
      });
      setVerifyingOrder(null);
      setDeliveryDateInput('');
      setStatusUpdateNote('');
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to update order');
    }
  };

  const handleMarkOrderCompleted = async (orderId: string) => {
    if (!confirm(`Mark Order #${orderId} as Completed?`)) return;
    try {
      await api.updateOrderStatus(orderId, {
        order_status: 'Completed',
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to complete order');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(`Are you sure you want to permanently delete Order #${orderId}? This cannot be undone.`)) return;
    try {
      await api.deleteOrder(orderId);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to delete order');
    }
  };

  // ---------------- CATEGORY ACTIONS ----------------
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await api.addCategory(newCategoryName.trim(), categories.length + 1);
      setNewCategoryName('');
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await api.deleteCategory(cat.id);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  // ---------------- PRODUCT ACTIONS ----------------
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const coloursArray = productForm.available_colours
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: productForm.name,
          description: productForm.description,
          category_id: productForm.category_id,
          price_pkr: Number(productForm.price_pkr),
          available_colours: coloursArray,
          stock_quantity: Number(productForm.stock_quantity),
          images: productForm.images,
          is_active: productForm.is_active,
        });
      } else {
        await api.addProduct({
          name: productForm.name,
          description: productForm.description,
          category_id: productForm.category_id,
          price_pkr: Number(productForm.price_pkr),
          available_colours: coloursArray,
          stock_quantity: Number(productForm.stock_quantity),
          images: productForm.images.length > 0 ? productForm.images : ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80'],
          is_active: productForm.is_active,
        });
      }
      setIsAddingProduct(false);
      setEditingProduct(null);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete product "${product.name}"?`)) return;
    try {
      await api.deleteProduct(product.id);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  // ---------------- PAYMENT METHOD ACTIONS ----------------
  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addPaymentMethod(paymentForm);
      setIsAddingPayment(false);
      setPaymentForm({
        provider_name: '',
        bank_or_wallet_name: '',
        account_holder_name: '',
        account_number_or_iban: '',
        payment_instructions: '',
        qr_code_url: '',
        is_active: 1,
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to add payment method');
    }
  };

  const handleTogglePaymentMethod = async (pm: PaymentMethod) => {
    try {
      await api.updatePaymentMethod(pm.id, {
        is_active: pm.is_active ? 0 : 1,
      });
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleDeletePaymentMethod = async (id: string) => {
    if (!confirm('Delete this payment method?')) return;
    try {
      await api.deletePaymentMethod(id);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to delete payment method');
    }
  };

  // ---------------- SETTINGS SAVE ----------------
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings(settingsForm);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
      setRefreshKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'all' && o.order_status !== orderStatusFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchId = o.order_id.includes(q);
      const matchName = o.customer_name.toLowerCase().includes(q);
      const matchPhone = o.customer_phone.includes(q);
      const matchCity = o.customer_city.toLowerCase().includes(q);
      return matchId || matchName || matchPhone || matchCity;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF7F2] text-[#1A261D] flex flex-col md:flex-row overflow-hidden animate-fadeIn">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#092217] text-[#FAF7F2] flex flex-col shrink-0 border-r border-[#D4AF37]/30 shadow-2xl">
        {/* Brand header */}
        <div className="p-4 sm:p-5 border-b border-[#D4AF37]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#14532D] border border-[#D4AF37] flex items-center justify-center font-cinzel font-bold text-lg text-[#D4AF37]">
              AK
            </div>
            <div>
              <span className="block font-cinzel font-bold text-sm tracking-wider text-white">
                AL KAREEM
              </span>
              <span className="text-[10px] tracking-widest text-[#D4AF37] uppercase font-semibold block">
                Owner Dashboard
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-[#0F3826] text-[#D4AF37] shadow border border-[#D4AF37]/40'
                : 'text-[#FAF7F2]/80 hover:bg-white/5 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#D4AF37]" />
            <span>1. Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'products'
                ? 'bg-[#0F3826] text-[#D4AF37] shadow border border-[#D4AF37]/40'
                : 'text-[#FAF7F2]/80 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#D4AF37]" />
            <span>2. Products ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'categories'
                ? 'bg-[#0F3826] text-[#D4AF37] shadow border border-[#D4AF37]/40'
                : 'text-[#FAF7F2]/80 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FolderTree className="w-4 h-4 text-[#D4AF37]" />
            <span>3. Categories ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'orders'
                ? 'bg-[#0F3826] text-[#D4AF37] shadow border border-[#D4AF37]/40'
                : 'text-[#FAF7F2]/80 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              <span>4. Orders</span>
            </div>
            {overview?.awaitingVerification ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px]">
                {overview.awaitingVerification}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'payments'
                ? 'bg-[#0F3826] text-[#D4AF37] shadow border border-[#D4AF37]/40'
                : 'text-[#FAF7F2]/80 hover:bg-white/5 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-[#D4AF37]" />
            <span>5. Payment Methods ({paymentMethods.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'bg-[#0F3826] text-[#D4AF37] shadow border border-[#D4AF37]/40'
                : 'text-[#FAF7F2]/80 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4 text-[#D4AF37]" />
            <span>6. Website Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'supabase'
                ? 'bg-[#0F3826] text-[#D4AF37] shadow border border-[#D4AF37]/40'
                : 'text-[#FAF7F2]/80 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-[#D4AF37]" />
              <span>7. Supabase Database</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'notifications'
                ? 'bg-[#0F3826] text-[#D4AF37] shadow border border-[#D4AF37]/40'
                : 'text-[#FAF7F2]/80 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Bell className="w-4 h-4 text-[#D4AF37]" />
              <span>8. Notifications</span>
            </div>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px]">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('owner_app')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
              activeTab === 'owner_app'
                ? 'bg-[#0F3826] text-[#D4AF37] shadow border border-[#D4AF37]/40'
                : 'text-[#FAF7F2]/80 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Download className="w-4 h-4 text-[#D4AF37]" />
            <span>9. Download Owner App</span>
          </button>
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-[#D4AF37]/20 flex items-center justify-between text-xs">
          <button
            onClick={onClose}
            className="px-3 py-2 text-[#FAF7F2]/80 hover:text-white transition-colors"
          >
            View Store
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-900 text-red-200 transition-colors font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-[#FAF7F2]">
        {/* Top bar for mobile/desktop breadcrumbs */}
        <div className="bg-white border-b border-[#0F3826]/10 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-cinzel text-xl font-bold text-[#0F3826] capitalize">
              {activeTab.replace('_', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="hidden sm:inline text-[#1A261D]/60 font-medium">
              AL KAREEM MATCHING CENTRE &bull; Fatehpur
            </span>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#0F3826] hover:bg-[#14532D] text-[#D4AF37] rounded-xl font-bold flex items-center gap-1 transition-all"
            >
              <span>Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab Views */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && overview && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#0F3826]/10 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A261D]/50 block mb-1">
                    Total Orders
                  </span>
                  <span className="font-mono text-3xl font-extrabold text-[#0F3826]">
                    {overview.totalOrders}
                  </span>
                </div>
                <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                    Awaiting Verification
                  </span>
                  <span className="font-mono text-3xl font-extrabold text-amber-900">
                    {overview.awaitingVerification}
                  </span>
                </div>
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                    Verified Orders
                  </span>
                  <span className="font-mono text-3xl font-extrabold text-emerald-900">
                    {overview.verifiedOrders}
                  </span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-[#0F3826]/10 shadow-sm">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A261D]/50 block mb-1">
                    Verified Revenue
                  </span>
                  <span className="font-cinzel text-xl font-bold text-[#0F3826]">
                    {formatPkr(overview.totalRevenue)}
                  </span>
                </div>
              </div>

              {/* Recent Orders & Newest Products */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Orders */}
                <div className="bg-white p-6 rounded-3xl border border-[#0F3826]/10 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-cinzel font-bold text-base text-[#0F3826]">
                      Recent Orders
                    </h3>
                    <button
                      onClick={() => setActiveTab('orders')}
                      className="text-xs font-bold text-[#0F3826] hover:text-[#D4AF37]"
                    >
                      View All &rarr;
                    </button>
                  </div>
                  {overview.recentOrders.length === 0 ? (
                    <p className="text-xs text-[#1A261D]/60 py-4 text-center">No orders yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {overview.recentOrders.map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3 rounded-xl bg-[#FAF7F2] border border-[#0F3826]/10 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-[#0F3826]">
                              #{ord.order_id}
                            </span>
                            <span className="text-[#1A261D]/70 block font-medium">
                              {ord.customer_name} ({ord.customer_city})
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-[#0F3826] block">
                              {formatPkr(ord.total_price)}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                ord.order_status === 'In Review'
                                  ? 'bg-amber-100 text-amber-800'
                                  : ord.order_status === 'Payment Verified'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {ord.order_status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recently Added Products */}
                <div className="bg-white p-6 rounded-3xl border border-[#0F3826]/10 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-cinzel font-bold text-base text-[#0F3826]">
                      Recently Added Products (Newest First)
                    </h3>
                    <button
                      onClick={() => setActiveTab('products')}
                      className="text-xs font-bold text-[#0F3826] hover:text-[#D4AF37]"
                    >
                      Manage &rarr;
                    </button>
                  </div>
                  <div className="space-y-3">
                    {overview.recentProducts.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl bg-[#FAF7F2] border border-[#0F3826]/10 flex items-center gap-3 text-xs"
                      >
                        <img
                          src={p.images?.[0] || ''}
                          alt=""
                          className="w-12 h-12 object-cover rounded-lg border border-[#0F3826]/10"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-[#0F3826] truncate">{p.name}</h4>
                          <span className="text-[11px] text-[#1A261D]/60 block font-mono">
                            Stock: {p.stock_quantity} &bull; {formatPkr(p.price_pkr)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-cinzel font-bold text-xl text-[#0F3826]">
                    Product Catalogue
                  </h2>
                  <span className="text-xs text-[#1A261D]/70">
                    Sorted by server creation timestamp descending (Newest first).
                  </span>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      name: '',
                      description: '',
                      category_id: categories[0]?.id || '',
                      price_pkr: 2500,
                      available_colours: 'Emerald Green, Royal Maroon, Mustard Gold',
                      stock_quantity: 20,
                      images: ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80'],
                      is_active: 1,
                    });
                    setIsAddingProduct(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#0F3826] hover:bg-[#14532D] text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Add/Edit Product Modal Form */}
              {isAddingProduct && (
                <div className="bg-white p-6 rounded-3xl border border-[#D4AF37]/50 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#0F3826]/10">
                    <h3 className="font-cinzel font-bold text-base text-[#0F3826]">
                      {editingProduct ? 'Edit Product' : 'Add New Product'}
                    </h3>
                    <button
                      onClick={() => setIsAddingProduct(false)}
                      className="p-1 rounded-full text-gray-500 hover:text-black"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Product Name *</label>
                      <input
                        type="text"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border border-[#0F3826]/20"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Description *</label>
                      <textarea
                        rows={2}
                        required
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border border-[#0F3826]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">Category *</label>
                      <select
                        value={productForm.category_id}
                        onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                        className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border border-[#0F3826]/20"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">Price in PKR *</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={productForm.price_pkr}
                        onChange={(e) => setProductForm({ ...productForm, price_pkr: Number(e.target.value) })}
                        className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border border-[#0F3826]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">Stock Quantity *</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={productForm.stock_quantity}
                        onChange={(e) => setProductForm({ ...productForm, stock_quantity: Number(e.target.value) })}
                        className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border border-[#0F3826]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">Available Colours (comma separated) *</label>
                      <input
                        type="text"
                        required
                        placeholder="Red, Green, Blue, Ivory"
                        value={productForm.available_colours}
                        onChange={(e) => setProductForm({ ...productForm, available_colours: e.target.value })}
                        className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border border-[#0F3826]/20"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Product Image URL</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={productForm.images[0] || ''}
                        onChange={(e) => setProductForm({ ...productForm, images: [e.target.value] })}
                        className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border border-[#0F3826]/20"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingProduct(false)}
                        className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-black"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-[#0F3826] text-[#D4AF37] font-bold text-xs uppercase tracking-wider"
                      >
                        Save Product
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Products Table */}
              <div className="bg-white rounded-3xl border border-[#0F3826]/10 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF7F2] border-b border-[#0F3826]/10 font-bold uppercase text-[#0F3826]">
                    <tr>
                      <th className="p-4">Image</th>
                      <th className="p-4">Product Name</th>
                      <th className="p-4">Price (PKR)</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Colours</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0F3826]/10">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF7F2]/50">
                        <td className="p-4">
                          <img
                            src={p.images?.[0] || ''}
                            alt=""
                            className="w-12 h-12 object-cover rounded-lg border border-[#0F3826]/10"
                          />
                        </td>
                        <td className="p-4 font-semibold text-[#0F3826]">
                          {p.name}
                          <span className="block text-[10px] text-[#1A261D]/50 font-mono">
                            ID: {p.id}
                          </span>
                        </td>
                        <td className="p-4 font-bold font-cinzel text-sm">
                          {formatPkr(p.price_pkr)}
                        </td>
                        <td className="p-4 font-mono font-medium">
                          {p.stock_quantity}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {p.available_colours?.slice(0, 3).map((col) => (
                              <span
                                key={col}
                                className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px]"
                              >
                                {col}
                              </span>
                            ))}
                            {(p.available_colours?.length || 0) > 3 && (
                              <span className="text-[10px] text-[#D4AF37] font-bold">
                                +{(p.available_colours?.length || 0) - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={async () => {
                              await api.updateProduct(p.id, { is_active: p.is_active ? 0 : 1 });
                              setRefreshKey((k) => k + 1);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {p.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              const link = `${window.location.origin}/product/${p.id}`;
                              navigator.clipboard.writeText(link);
                              alert('Product link copied to clipboard!');
                            }}
                            title="Copy Permalink"
                            className="p-1.5 text-gray-600 hover:text-[#0F3826]"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setProductForm({
                                name: p.name,
                                description: p.description,
                                category_id: p.category_id,
                                price_pkr: p.price_pkr,
                                available_colours: p.available_colours.join(', '),
                                stock_quantity: p.stock_quantity,
                                images: p.images,
                                is_active: p.is_active,
                              });
                              setIsAddingProduct(true);
                            }}
                            title="Edit"
                            className="p-1.5 text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            title="Delete"
                            className="p-1.5 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-cinzel font-bold text-xl text-[#0F3826]">
                    Category Management
                  </h2>
                  <span className="text-xs text-[#1A261D]/70">
                    Create, rename, reorder, activate/deactivate, and delete categories.
                  </span>
                </div>
              </div>

              {/* Add category form */}
              <form onSubmit={handleAddCategory} className="bg-white p-5 rounded-2xl border border-[#0F3826]/10 shadow-sm flex gap-3">
                <input
                  type="text"
                  required
                  placeholder="New Category Name (e.g. Lawn, Velvet, Chiffon)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border border-[#0F3826]/20"
                />
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F3826] hover:bg-[#14532D] text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </form>

              {/* Category List */}
              <div className="bg-white rounded-3xl border border-[#0F3826]/10 shadow-sm overflow-hidden">
                <div className="divide-y divide-[#0F3826]/10">
                  {categories.map((cat, idx) => (
                    <div key={cat.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[#FAF7F2]/40">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-[#FAF7F2] border border-[#0F3826]/15 text-[#0F3826] font-mono font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <div>
                          <strong className="text-sm font-semibold text-[#0F3826] block">
                            {cat.name}
                          </strong>
                          <span className="text-[11px] text-[#1A261D]/50 font-mono">
                            ID: {cat.id}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            await api.updateCategory(cat.id, { is_active: cat.is_active ? 0 : 1 });
                            setRefreshKey((k) => k + 1);
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            cat.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          title="Delete Category"
                          className="p-1.5 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS (FULL DASHBOARD) */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-cinzel font-bold text-xl text-[#0F3826]">
                    Customer Orders ({filteredOrders.length})
                  </h2>
                  <span className="text-xs text-[#1A261D]/70">
                    All orders sorted newest first. Verify payment, set estimated delivery date, mark complete.
                  </span>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="bg-white p-4 rounded-2xl border border-[#0F3826]/10 shadow-sm flex flex-wrap gap-3 items-center justify-between">
                <div className="relative flex-1 min-w-[240px]">
                  <input
                    type="text"
                    placeholder="Search by 6-digit Order ID, customer name, city, phone..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="w-full bg-[#FAF7F2] rounded-xl pl-9 pr-4 py-2 text-xs border border-[#0F3826]/20 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-[#0F3826]/50 absolute left-3 top-2.5" />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#1A261D]/60">Status:</span>
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="bg-[#FAF7F2] rounded-xl px-3 py-1.5 text-xs font-medium border border-[#0F3826]/20 focus:outline-none"
                  >
                    <option value="all">All Orders</option>
                    <option value="In Review">Step 1: In Review</option>
                    <option value="Payment Verified">Step 2: Payment Verified</option>
                    <option value="Completed">Step 3: Completed</option>
                  </select>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-3xl border border-[#0F3826]/10 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#FAF7F2] border-b border-[#0F3826]/10 font-bold uppercase text-[#0F3826]">
                    <tr>
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Date &amp; Time</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Product &amp; Colour</th>
                      <th className="p-4">Total</th>
                      <th className="p-4">Payment Method</th>
                      <th className="p-4">Proof</th>
                      <th className="p-4">Order Status</th>
                      <th className="p-4">Est. Delivery</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0F3826]/10">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-gray-500">
                          No matching orders found.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#FAF7F2]/50">
                          <td className="p-4 font-mono font-extrabold text-[#0F3826] text-sm">
                            #{ord.order_id}
                          </td>
                          <td className="p-4 text-[11px] text-gray-600">
                            {new Date(ord.created_at).toLocaleString('en-PK', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-[#1A261D] block">{ord.customer_name}</span>
                            <span className="text-[10px] text-gray-500 block">{ord.customer_phone} &bull; {ord.customer_city}</span>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-[#0F3826] block max-w-[200px] truncate">{ord.product_name_snapshot}</span>
                            <span className="text-[10px] text-gray-600 block">
                              {ord.selected_colour} &times; {ord.quantity}
                            </span>
                          </td>
                          <td className="p-4 font-cinzel font-bold text-sm text-[#0F3826]">
                            {formatPkr(ord.total_price)}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded bg-gray-100 font-medium text-[11px]">
                              {ord.payment_method_snapshot?.provider_name || 'Online'}
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => setViewingProofOrderId(ord.order_id)}
                              className="px-2.5 py-1 rounded-lg bg-[#0F3826]/10 hover:bg-[#0F3826]/20 text-[#0F3826] font-bold text-[11px] flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Proof</span>
                            </button>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                ord.order_status === 'In Review'
                                  ? 'bg-amber-100 text-amber-800'
                                  : ord.order_status === 'Payment Verified'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {ord.order_status}
                            </span>
                          </td>
                          <td className="p-4 text-[11px]">
                            {ord.estimated_delivery_date || (
                              <span className="text-gray-400 italic">Not set</span>
                            )}
                          </td>
                          <td className="p-4 text-right space-x-1.5">
                            {ord.order_status === 'In Review' && (
                              <button
                                onClick={() => {
                                  setVerifyingOrder(ord);
                                  setDeliveryDateInput('28 October 2026');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px]"
                              >
                                Verify Payment
                              </button>
                            )}
                            {ord.order_status === 'Payment Verified' && (
                              <button
                                onClick={() => handleMarkOrderCompleted(ord.order_id)}
                                className="px-2.5 py-1 rounded-lg bg-[#0F3826] hover:bg-[#14532D] text-[#D4AF37] font-bold text-[11px]"
                              >
                                Mark Completed
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedOrderForModal(ord)}
                              title="Inspect Full Details"
                              className="p-1.5 text-gray-600 hover:text-[#0F3826]"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(ord.order_id)}
                              title="Delete Order"
                              className="p-1.5 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Payment Proof Viewing Modal (Owner Protected) */}
              {viewingProofOrderId && (
                <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
                  <div className="relative bg-white rounded-3xl p-6 max-w-lg w-full flex flex-col items-center">
                    <button
                      onClick={() => setViewingProofOrderId(null)}
                      className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <span className="text-xs uppercase font-bold text-[#D4AF37] mb-1">
                      Private Customer Transfer Proof
                    </span>
                    <h3 className="font-cinzel font-bold text-lg text-[#0F3826] mb-4">
                      Order #{viewingProofOrderId}
                    </h3>
                    <div className="w-full max-h-[65vh] overflow-auto rounded-2xl border border-gray-200 bg-gray-50 flex items-center justify-center p-2">
                      <img
                        src={`/api/orders/${viewingProofOrderId}/payment-proof`}
                        alt="Customer payment proof"
                        className="max-h-[60vh] object-contain rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Verify Payment Modal with Estimated Delivery Date */}
              {verifyingOrder && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#D4AF37]/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-cinzel font-bold text-lg text-[#0F3826]">
                        Verify Payment &bull; #{verifyingOrder.order_id}
                      </h3>
                      <button
                        onClick={() => setVerifyingOrder(null)}
                        className="p-1 rounded-full text-gray-500 hover:text-black"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-xs text-[#1A261D]/75">
                      Confirm you have checked your actual bank/wallet account for <strong>{formatPkr(verifyingOrder.total_price)}</strong> from <strong>{verifyingOrder.customer_name}</strong>.
                    </p>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3826] mb-1">
                        Estimated Delivery Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 28 October 2026 / 3 Business Days"
                        value={deliveryDateInput}
                        onChange={(e) => setDeliveryDateInput(e.target.value)}
                        className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2.5 text-sm border border-[#0F3826]/20 font-semibold text-[#0F3826]"
                      />
                      <span className="text-[10px] text-gray-500 mt-1 block">
                        This date is displayed directly to the customer on their 3-Step Tracking page.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Optional Internal Verification Note
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Received via JazzCash TID #998124"
                        value={statusUpdateNote}
                        onChange={(e) => setStatusUpdateNote(e.target.value)}
                        className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-xs border border-[#0F3826]/20"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setVerifyingOrder(null)}
                        className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-black"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleVerifyPaymentSubmit}
                        className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Payment Verification</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Full Order Inspection Modal */}
              {selectedOrderForModal && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#D4AF37]">Order Details</span>
                        <h3 className="font-mono text-xl font-bold text-[#0F3826]">
                          #{selectedOrderForModal.order_id}
                        </h3>
                      </div>
                      <button
                        onClick={() => setSelectedOrderForModal(null)}
                        className="p-1 rounded-full text-gray-500 hover:text-black"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-gray-500 font-semibold block">Customer Name</span>
                        <strong className="text-sm text-[#0F3826]">{selectedOrderForModal.customer_name}</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-500 font-semibold block">Phone</span>
                          <strong className="font-mono">{selectedOrderForModal.customer_phone}</strong>
                        </div>
                        <div>
                          <span className="text-gray-500 font-semibold block">City</span>
                          <strong>{selectedOrderForModal.customer_city}</strong>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold block">Delivery Address</span>
                        <p className="bg-[#FAF7F2] p-2.5 rounded-xl border border-gray-200">
                          {selectedOrderForModal.delivery_address}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500 font-semibold block">Product</span>
                        <p className="font-semibold text-[#0F3826]">
                          {selectedOrderForModal.product_name_snapshot} ({selectedOrderForModal.selected_colour} &times; {selectedOrderForModal.quantity})
                        </p>
                        <p className="font-cinzel font-bold text-sm text-[#0F3826]">
                          Total: {formatPkr(selectedOrderForModal.total_price)}
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={() => setViewingProofOrderId(selectedOrderForModal.order_id)}
                          className="w-full py-2.5 rounded-xl bg-[#0F3826] text-[#D4AF37] font-bold text-xs uppercase"
                        >
                          View Private Payment Proof
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PAYMENT METHODS */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-cinzel font-bold text-xl text-[#0F3826]">
                    Online Payment Methods ({paymentMethods.length})
                  </h2>
                  <span className="text-xs text-[#1A261D]/70">
                    Configure JazzCash, EasyPaisa, Meezan Bank, HBL, and other digital accounts. No cash-on-delivery.
                  </span>
                </div>
                <button
                  onClick={() => setIsAddingPayment(true)}
                  className="px-4 py-2.5 rounded-xl bg-[#0F3826] hover:bg-[#14532D] text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Payment Method</span>
                </button>
              </div>

              {/* Add Payment Modal */}
              {isAddingPayment && (
                <div className="bg-white p-6 rounded-3xl border border-[#D4AF37]/50 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b">
                    <h3 className="font-cinzel font-bold text-base text-[#0F3826]">
                      Add New Online Payment Method
                    </h3>
                    <button onClick={() => setIsAddingPayment(false)}>
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  <form onSubmit={handleSavePaymentMethod} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Provider Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. JazzCash, EasyPaisa, Meezan Bank"
                        value={paymentForm.provider_name}
                        onChange={(e) => setPaymentForm({ ...paymentForm, provider_name: e.target.value })}
                        className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Bank or Wallet Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mobilink Microfinance / Meezan Bank Limited"
                        value={paymentForm.bank_or_wallet_name}
                        onChange={(e) => setPaymentForm({ ...paymentForm, bank_or_wallet_name: e.target.value })}
                        className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Account Holder Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. AL KAREEM MATCHING CENTRE"
                        value={paymentForm.account_holder_name}
                        onChange={(e) => setPaymentForm({ ...paymentForm, account_holder_name: e.target.value })}
                        className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Account Number / IBAN / Wallet # *</label>
                      <input
                        type="text"
                        required
                        placeholder="03067341386 or PK00MEZN000..."
                        value={paymentForm.account_number_or_iban}
                        onChange={(e) => setPaymentForm({ ...paymentForm, account_number_or_iban: e.target.value })}
                        className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Payment Instructions *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Transfer exact amount to the account above and upload the confirmation screenshot."
                        value={paymentForm.payment_instructions}
                        onChange={(e) => setPaymentForm({ ...paymentForm, payment_instructions: e.target.value })}
                        className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold mb-1">Optional QR Code Image URL</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={paymentForm.qr_code_url}
                        onChange={(e) => setPaymentForm({ ...paymentForm, qr_code_url: e.target.value })}
                        className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border"
                      />
                    </div>

                    <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingPayment(false)}
                        className="px-4 py-2 text-xs font-semibold text-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 rounded-xl bg-[#0F3826] text-[#D4AF37] font-bold text-xs uppercase tracking-wider"
                      >
                        Save Payment Method
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Payment Method Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.length === 0 ? (
                  <div className="col-span-2 p-8 text-center bg-white rounded-3xl border border-dashed border-gray-300">
                    <p className="text-xs text-gray-500">
                      No payment methods created yet. Click &apos;Add Payment Method&apos; to configure your EasyPaisa, JazzCash, or Bank account.
                    </p>
                  </div>
                ) : (
                  paymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className="bg-white p-5 rounded-3xl border border-[#0F3826]/10 shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-base text-[#0F3826]">
                            {pm.provider_name}
                          </span>
                          <button
                            onClick={() => handleTogglePaymentMethod(pm)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              pm.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {pm.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                        <div className="space-y-1 text-xs">
                          <span className="text-gray-500 block">{pm.bank_or_wallet_name}</span>
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-gray-400">Account Holder:</span>{' '}
                            <strong>{pm.account_holder_name}</strong>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-semibold text-gray-400">Account #:</span>{' '}
                            <strong className="font-mono text-[#0F3826]">{pm.account_number_or_iban}</strong>
                          </div>
                          <p className="text-gray-600 pt-1 text-[11px] italic">
                            {pm.payment_instructions}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-end">
                        <button
                          onClick={() => handleDeletePaymentMethod(pm.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: WEBSITE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="font-cinzel font-bold text-xl text-[#0F3826]">
                  Website Settings
                </h2>
                <span className="text-xs text-[#1A261D]/70">
                  Update homepage description, contact numbers, and store details.
                </span>
              </div>

              {settingsSaved && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Settings updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-3xl border border-[#0F3826]/10 shadow-sm space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Store Brand Name</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.brand_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, brand_name: e.target.value })}
                    className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Homepage Description
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={settingsForm.homepage_description}
                    onChange={(e) => setSettingsForm({ ...settingsForm, homepage_description: e.target.value })}
                    className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Business Contact Phone</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.contact_number}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contact_number: e.target.value })}
                      className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">WhatsApp Order Number</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.whatsapp_number}
                      onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp_number: e.target.value })}
                      className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Physical Business Address</label>
                  <input
                    type="text"
                    required
                    value={settingsForm.business_address}
                    onChange={(e) => setSettingsForm({ ...settingsForm, business_address: e.target.value })}
                    className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Top Announcement Bar Text</label>
                  <input
                    type="text"
                    value={settingsForm.announcement || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, announcement: e.target.value })}
                    className="w-full bg-[#FAF7F2] rounded-xl px-4 py-2 text-sm border"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#0F3826] hover:bg-[#14532D] text-[#D4AF37] font-bold text-xs uppercase tracking-wider shadow"
                  >
                    Save Website Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 7: SUPABASE DATABASE */}
          {activeTab === 'supabase' && (
            <div className="space-y-6 max-w-4xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-cinzel font-bold text-xl text-[#0F3826]">
                      Supabase Cloud Database
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Connected
                    </span>
                  </div>
                  <span className="text-xs text-[#1A261D]/70">
                    Your store is configured with Supabase project <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-gray-300">czkiqhklnnfssrgklsdt</code>. Orders and data are synced securely.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadSupabaseInfo}
                    disabled={supabaseLoading}
                    className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 flex items-center gap-1.5 shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${supabaseLoading ? 'animate-spin' : ''}`} />
                    <span>Check Status</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncToSupabase}
                    disabled={supabaseLoading}
                    className="px-4 py-2 rounded-xl bg-[#0F3826] hover:bg-[#14532D] text-[#D4AF37] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>{supabaseLoading ? 'Syncing...' : 'Sync All Data Now'}</span>
                  </button>
                </div>
              </div>

              {/* Sync Results Feedback */}
              {supabaseSyncResult && (
                <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                  supabaseSyncResult.errors.length === 0
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}>
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Supabase Sync Complete</span>
                  </div>
                  <p>
                    Synced: <strong>{supabaseSyncResult.ordersSynced}</strong> Orders,{' '}
                    <strong>{supabaseSyncResult.productsSynced}</strong> Products,{' '}
                    <strong>{supabaseSyncResult.categoriesSynced}</strong> Categories,{' '}
                    <strong>{supabaseSyncResult.paymentMethodsSynced}</strong> Payment Methods.
                  </p>
                  {supabaseSyncResult.errors.length > 0 && (
                    <div className="pt-2 text-[11px] text-amber-800">
                      <p className="font-semibold">Notice (Run schema SQL below if tables are missing):</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {supabaseSyncResult.errors.map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Project Configuration Card */}
              <div className="bg-white p-6 rounded-3xl border border-[#0F3826]/10 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-[#0F3826] flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#D4AF37]" />
                  <span>Connection Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-gray-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                      Project ID
                    </span>
                    <strong className="font-mono text-sm text-[#0F3826]">
                      {supabaseStatus?.projectId || 'czkiqhklnnfssrgklsdt'}
                    </strong>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-gray-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                      Supabase REST Endpoint
                    </span>
                    <strong className="font-mono text-xs text-[#0F3826] break-all">
                      {supabaseStatus?.url || 'https://czkiqhklnnfssrgklsdt.supabase.co'}
                    </strong>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Real-Time Automatic Sync Active</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Every order placed through the customer storefront (via the &quot;Order&quot; button) is immediately saved and forwarded to your Supabase project. You do not need to do anything manually!
                  </p>
                </div>
              </div>

              {/* 1-Click SQL Schema Setup */}
              <div className="bg-white p-6 rounded-3xl border border-[#0F3826]/10 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#0F3826]">
                      Supabase SQL Schema Script
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      To initialize or verify tables in your Supabase dashboard, copy and paste this SQL into your Supabase SQL Editor.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://supabase.com/dashboard/project/czkiqhklnnfssrgklsdt/sql`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#0F3826] font-bold text-xs flex items-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Supabase SQL Editor</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopySql}
                      className="px-4 py-2 rounded-xl bg-[#0F3826] hover:bg-[#14532D] text-[#D4AF37] font-bold text-xs uppercase flex items-center gap-1.5 shadow"
                    >
                      {copiedSql ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy SQL Schema</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="relative bg-[#1A261D] text-emerald-300 p-4 rounded-2xl font-mono text-[11px] max-h-64 overflow-y-auto leading-relaxed border border-[#D4AF37]/20">
                  <pre>{sqlSchema || `-- Loading schema...`}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-cinzel font-bold text-xl text-[#0F3826]">
                    Owner Notifications ({notifications.length})
                  </h2>
                  <span className="text-xs text-[#1A261D]/70">
                    Real-time alerts for incoming orders and customer payment proofs.
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={async () => {
                      await api.markAllNotificationsRead();
                      setRefreshKey((k) => k + 1);
                    }}
                    className="text-xs font-bold text-[#0F3826] hover:text-[#D4AF37]"
                  >
                    Mark All As Read
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-3xl border border-gray-200">
                    <p className="text-xs text-gray-500">No notifications yet.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                        n.is_read
                          ? 'bg-white border-gray-200 text-gray-700'
                          : 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0F3826] text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#0F3826]">{n.title}</h4>
                          <p className="text-xs text-[#1A261D]/80 mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-gray-400 mt-1 block font-mono">
                            {new Date(n.created_at).toLocaleString('en-PK')}
                          </span>
                        </div>
                      </div>

                      {n.order_id && (
                        <button
                          onClick={() => {
                            setActiveTab('orders');
                            setOrderSearch(n.order_id || '');
                          }}
                          className="px-3 py-1 bg-[#0F3826] text-[#D4AF37] rounded-lg text-xs font-bold shrink-0 hover:bg-[#14532D]"
                        >
                          View Order
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 8: DOWNLOAD OWNER APP (ANDROID APK & PWA) */}
          {activeTab === 'owner_app' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="font-cinzel font-bold text-xl text-[#0F3826]">
                  Download Owner Application (Android APK &amp; PWA)
                </h2>
                <span className="text-xs text-[#1A261D]/70">
                  Instant mobile access, push notification receiver, and standalone APK packaging.
                </span>
              </div>

              {/* Option 1: 1-Tap Android PWA Installation */}
              <div className="bg-white p-6 rounded-3xl border border-[#0F3826]/10 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#0F3826] text-[#D4AF37] flex items-center justify-center">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0F3826]">
                      Option 1: 1-Tap Android Home Screen App (Direct Install)
                    </h3>
                    <span className="text-xs text-gray-500">
                      Installs like a native Android APK with fullscreen icon &amp; standalone badge.
                    </span>
                  </div>
                </div>

                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#0F3826]/10 text-xs space-y-2 text-[#1A261D]/80">
                  <p>
                    <strong>How to install on Android phone:</strong>
                  </p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Open this website in Google Chrome on your Android phone.</li>
                    <li>Tap the <strong>Chrome menu (three dots)</strong> at the top right.</li>
                    <li>Select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.</li>
                    <li>The <strong>AL KAREEM MATCHING CENTRE</strong> app icon will now appear on your phone home screen just like an APK!</li>
                  </ol>
                </div>
              </div>

              {/* Option 2: Standalone APK via Bubblewrap / TWA / WebAPK */}
              <div className="bg-white p-6 rounded-3xl border border-[#0F3826]/10 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#14532D] text-[#D4AF37] flex items-center justify-center">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#0F3826]">
                      Option 2: Standalone APK Package Build Guide
                    </h3>
                    <span className="text-xs text-gray-500">
                      Standard Google Bubblewrap / PWABuilder Android APK generator.
                    </span>
                  </div>
                </div>

                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#0F3826]/10 text-xs space-y-2.5 text-[#1A261D]/80">
                  <p>
                    To compile a downloadable <code>.apk</code> file for distribution or sideloading:
                  </p>
                  <div className="bg-gray-900 text-gray-100 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                    <code>
                      # Using Bubblewrap CLI to generate APK:{'\n'}
                      npm i -g @bubblewrap/cli{'\n'}
                      bubblewrap init --manifest={window.location.origin}/manifest.webmanifest{'\n'}
                      bubblewrap build
                    </code>
                  </div>
                  <p className="text-[11px] text-gray-600">
                    Or visit <a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="text-[#0F3826] font-bold underline">PWABuilder.com</a>, input your live URL, and click <strong>&quot;Package for Android&quot;</strong> to download your signed <code>.apk</code> file in seconds.
                  </p>
                </div>
              </div>

              {/* Push Notifications Setup Info */}
              <div className="bg-white p-6 rounded-3xl border border-[#0F3826]/10 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-[#0F3826] flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#D4AF37]" />
                  <span>Push Notifications Integration</span>
                </h3>
                <p className="text-xs text-[#1A261D]/80 leading-relaxed">
                  The dashboard features live in-app notifications with order count badges. When packaged with the Web Manifest and Service Worker, Android handles push notifications natively through the browser or Firebase Cloud Messaging.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
