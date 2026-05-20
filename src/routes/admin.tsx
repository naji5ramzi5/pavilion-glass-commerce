import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Package, ShoppingBag, Users, DollarSign, Plus, Trash2, Edit2, Eye, X, LogOut, ShieldCheck, Lock, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useDataStore } from "@/lib/data-store";

export const Route = createFileRoute("/admin")({ component: AdminDashboard });

interface Product {
  id?: string; sku?: string | null; name_ar: string; name_en: string;
  description_ar?: string | null; description_en?: string | null;
  regular_price: number; sale_price?: number | null;
  stock: number; in_stock: boolean; rating?: number;
  image?: string | null; gallery?: string[] | null;
  category_id?: string | null; brand_id?: string | null; model_id?: string | null;
  tags?: string[] | null; brand?: string | null;
}

function AdminDashboard() {
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [tab, setTab] = useState<"overview" | "banners" | "products" | "orders" | "categories" | "brands" | "settings">("overview");
  const [stats, setStats] = useState({ visits: 0, orders: 0, revenue: 0, products: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [editingBanner, setEditingBanner] = useState<{ id?: string, title?: string, link?: string, image_url: string, active: boolean, order_index: number } | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ id?: string, name_ar: string, name_en: string, image?: string } | null>(null);
  const [editingBrand, setEditingBrand] = useState<any | null>(null);
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);
  
  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [orderDateFilter, setOrderDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 30;

  useEffect(() => {
    setCurrentPage(1);
  }, [orderDateFilter, dateFrom, dateTo]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    
    // Quick filter
    if (orderDateFilter !== "all") {
      const now = new Date();
      result = result.filter((o) => {
        const d = new Date(o.created_at);
        if (orderDateFilter === "today") {
          return d.toDateString() === now.toDateString();
        } else if (orderDateFilter === "week") {
          const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
          return diffDays <= 7;
        } else if (orderDateFilter === "month") {
          const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
          return diffDays <= 30;
        }
        return true;
      });
    }

    // Custom From/To filter
    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      result = result.filter((o) => new Date(o.created_at).getTime() >= from);
    }
    if (dateTo) {
      // Add 1 day to include the whole end date
      const to = new Date(dateTo).getTime() + (24 * 60 * 60 * 1000);
      result = result.filter((o) => new Date(o.created_at).getTime() < to);
    }

    return result;
  }, [orders, orderDateFilter, dateFrom, dateTo]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, currentPage, pageSize]);
  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1;

  const exportOrdersCSV = () => {
    if (filteredOrders.length === 0) return toast.error(lang === "ar" ? "لا توجد طلبات للتصدير" : "No orders to export");
    const headers = ["Order ID", "Customer", "Phone", "Status", "Total", "Date", "Items"];
    const rows = filteredOrders.map(o => {
      let itemsStr = "";
      if (Array.isArray(o.items)) {
        itemsStr = o.items.map((item: any) => `${item.quantity || 1}x ${item.name_ar || item.name_en || 'Product'} (${item.price || 0} IQD)`).join(" | ");
      }
      return [
        o.id,
        `"${(o.customer_name || "").replace(/"/g, '""')}"`,
        `"${(o.customer_phone || "").replace(/"/g, '""')}"`,
        o.status,
        o.total,
        `"${new Date(o.created_at).toLocaleString()}"`,
        `"${itemsStr.replace(/"/g, '""')}"`
      ];
    });
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `orders_export_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const auth = localStorage.getItem("isAdmin") === "true";
    setIsAuth(auth);
    if (auth) {
      loadAll();
    } else {
      setIsAuth(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuth) return;

    // Full Real-time Sync
    const channel = supabase.channel("admin-realtime-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          toast.info(lang === "ar" ? `طلب جديد من ${payload.new.customer_name}` : `New order from ${payload.new.customer_name}`, {
            description: `${payload.new.total.toLocaleString()} ${t("iqd")}`,
            duration: 10000,
          });
        }
        loadAll();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "brands" }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "banners" }, () => loadAll())
      .subscribe();

    // Tab listener
    const onTab = (e: any) => setTab(e.detail);
    window.addEventListener("admin-tab-change", onTab);

    return () => { 
      supabase.removeChannel(channel); 
      window.removeEventListener("admin-tab-change", onTab);
    };
  }, [isAuth, lang]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const savedPass = localStorage.getItem("adminPassword") || "pavilion2026";
    if (email === "admin@pavilion.com" && password === savedPass) {
      localStorage.setItem("isAdmin", "true");
      setIsAuth(true);
      toast.success(lang === "ar" ? "أهلاً بك" : "Welcome");
      loadAll();
    } else {
      toast.error(lang === "ar" ? "بيانات خاطئة" : "Invalid credentials");
    }
    setBusy(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    setIsAuth(false);
    supabase.auth.signOut();
  };

  const runDiagnostics = async () => {
    setBusy(true);
    try {
      console.log("Running Diagnostics...");
      const { data: testData, error: testErr } = await supabase.from("orders").select("count", { count: "exact", head: true });
      
      if (testErr) {
        console.error("Diagnostic Error (Select):", testErr);
        toast.error(`خطأ في الاتصال: ${testErr.message} (Code: ${testErr.code})`);
      } else {
        console.log("Connection OK. Orders count:", testData);
        toast.success(`الاتصال سليم. عدد الطلبات في القاعدة: ${testData?.[0]?.count ?? 0}`);
      }

      // Try a test insert
      const { error: insErr } = await supabase.from("orders").insert([{
        customer_name: "Test User",
        customer_phone: "0000",
        total: 0,
        items: [],
        source: "diagnostic_test"
      }]);

      if (insErr) {
        console.error("Diagnostic Error (Insert):", insErr);
        toast.error(`فشل الإضافة التجريبية: ${insErr.message}. يرجى التأكد من تعطيل RLS.`);
      } else {
        toast.success("تمت الإضافة التجريبية بنجاح! قاعدة البيانات تعمل.");
        await loadAll();
      }
    } catch (err: any) {
      console.error("Fatal Diagnostic Error:", err);
      toast.error(`خطأ فادح: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const loadAll = async () => {
    try {
      const [v, o, p, c, b, bn] = await Promise.all([
        supabase.from("visits").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("*"),
        supabase.from("brands").select("*"),
        supabase.from("banners").select("*").order("order_index", { ascending: true }),
      ]);
      setOrders(o.data ?? []);
      setProducts((p.data ?? []) as Product[]);
      setCats(c.data ?? []);
      setBrands(b.data ?? []);
      setBanners(bn.data ?? []);
      const revenue = (o.data ?? [])
        .filter((x: any) => x.status === "delivered" || x.status === "تم التسليم")
        .reduce((s, x: any) => s + Number(x.total || 0), 0);
      setStats({ visits: v.count ?? 0, orders: (o.data ?? []).length, revenue, products: (p.data ?? []).length });
      useDataStore.getState().fetchData(true);
    } catch (err) {
      console.error("Load failed:", err);
      toast.error("Failed to load data");
    }
  };

  const uploadFile = async (file: File, bucket = "images") => {
    const ext = file.name.split(".").pop();
    const name = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const { data, error } = await supabase.storage.from(bucket).upload(name, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(name);
    return publicUrl;
  };

  const saveBanner = async (bn: any) => {
    setBusy(true);
    try {
      const payload = { ...bn };
      const id = payload.id;
      delete payload.id;
      
      const res = id
        ? await supabase.from("banners").update(payload).eq("id", id)
        : await supabase.from("banners").insert([payload]);
        
      if (res.error) throw res.error;
      toast.success(lang === "ar" ? "تم حفظ البنر" : "Banner saved");
      setEditingBanner(null);
      await loadAll();
    } catch (err: any) {
      toast.error(lang === "ar" ? `فشل الحفظ: ${err.message}` : `Save failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const deleteBanner = async (id: string) => {
    if (confirm(lang === "ar" ? "هل أنت متأكد من حذف هذا البنر؟" : "Are you sure you want to delete this banner?")) {
      setBusy(true);
      try {
        const { error } = await supabase.from("banners").delete().eq("id", id);
        if (error) throw error;
        toast.success(lang === "ar" ? "تم حذف البنر" : "Banner deleted");
        await loadAll();
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setBusy(false);
      }
    }
  };

  const saveProduct = async (p: Product) => {
    setBusy(true);
    try {
      console.log("Saving product:", p);
      const payload: any = { ...p };
      if (payload.tags && typeof payload.tags === "string") payload.tags = (payload.tags as any).split(",").map((s: string) => s.trim()).filter(Boolean);
      
      // Clean up optional IDs to avoid schema errors if columns are missing
      if (!payload.brand_id) delete payload.brand_id;
      if (!payload.category_id) delete payload.category_id;
      if (!payload.sku) delete payload.sku;
      if (payload.rating === undefined) delete payload.rating;

      const id = payload.id;
      delete payload.id;
      
      const res = id
        ? await supabase.from("products").update(payload).eq("id", id)
        : await supabase.from("products").insert([payload]);
        
      if (res.error) {
        console.error("Supabase error:", res.error);
        throw new Error(`${res.error.message} (Code: ${res.error.code})`);
      }
      
      toast.success(lang === "ar" ? "تم حفظ المنتج" : "Product saved");
      setEditing(null);
      await loadAll();
    } catch (err: any) {
      console.error("Save error details:", err);
      toast.error(lang === "ar" ? `فشل الحفظ: ${err.message}` : `Save failed: ${err.message}`, { duration: 5000 });
    } finally {
      setBusy(false);
    }
  };

  const saveCategory = async (cat: any) => {
    setBusy(true);
    try {
      console.log("Saving category:", cat);
      if (!cat.name_ar || !cat.name_en) throw new Error(lang === "ar" ? "الاسم مطلوب" : "Name is required");
      const payload: any = { name_ar: cat.name_ar, name_en: cat.name_en };
      // Only send image if col exists or if value is provided
      if (cat.image !== undefined) payload.image = cat.image || null;
      
      const id = cat.id;
      const res = id 
        ? await supabase.from("categories").update(payload).eq("id", id)
        : await supabase.from("categories").insert([payload]);
        
      if (res.error) {
        console.error("Supabase error:", res.error);
        throw new Error(`${res.error.message} (Code: ${res.error.code})`);
      }
      
      toast.success(lang === "ar" ? "تم حفظ القسم" : "Category saved");
      setEditingCategory(null);
      await loadAll();
    } catch (err: any) {
      console.error("Save error details:", err);
      toast.error(lang === "ar" ? `فشل الحفظ: ${err.message}` : `Save failed: ${err.message}`, { duration: 5000 });
    } finally {
      setBusy(false);
    }
  };

  const saveBrand = async () => {
    if (!editingBrand) return;
    setBusy(true);
    try {
      const payload: any = { 
        name_ar: editingBrand.name_ar, 
        name_en: editingBrand.name_en
      };
      // Only send image if it's provided, to avoid schema error if col missing
      if (editingBrand.image) payload.image = editingBrand.image;
      
      let res;
      if (editingBrand.id) res = await supabase.from("brands").update(payload).eq("id", editingBrand.id);
      else res = await supabase.from("brands").insert([payload]);

      if (res.error) throw res.error;
      toast.success(lang === "ar" ? "تم الحفظ" : "Saved");
      setEditingBrand(null);
      loadAll();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteBrand = async (id: string) => {
    if (!confirm(lang === "ar" ? "هل أنت متأكد؟" : "Are you sure?")) return;
    const { error } = await supabase.from("brands").delete().eq("id", id);
    if (error) return toast.error(error.message);
    loadAll();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm(lang === "ar" ? "هل أنت متأكد؟" : "Sure?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    loadAll();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(lang === "ar" ? "تم تحديث الحالة" : "Status updated");
    loadAll();
  };

  const changeAdminPassword = () => {
    if (newPassword.length < 6) {
      toast.error(lang === "ar" ? "كلمة السر قصيرة جداً" : "Password too short");
      return;
    }
    localStorage.setItem("adminPassword", newPassword);
    toast.success(lang === "ar" ? "تم تغيير كلمة السر بنجاح" : "Password changed successfully");
    setNewPassword("");
  };

  const getStatusLabel = (s: string) => {
    if (lang !== "ar") return s;
    const map: any = {
      pending: "قيد الانتظار",
      confirmed: "تم التأكيد",
      shipped: "تم الشحن",
      delivered: "تم التسليم",
      cancelled: "ملغي"
    };
    return map[s] || s;
  };


  const exportProductsCSV = () => {
    if (products.length === 0) return toast.error(lang === "ar" ? "لا توجد منتجات للتصدير" : "No products to export");
    const headers = ["Name AR", "Name EN", "Regular Price", "Sale Price", "Stock", "SKU", "Image URL", "Category ID", "Brand ID"];
    const rows = products.map(p => [
      `"${(p.name_ar || "").replace(/"/g, '""')}"`,
      `"${(p.name_en || "").replace(/"/g, '""')}"`,
      p.regular_price || 0,
      p.sale_price || "",
      p.stock || 0,
      `"${(p.sku || "").replace(/"/g, '""')}"`,
      `"${(p.image || "").replace(/"/g, '""')}"`,
      `"${(p.category_id || "").replace(/"/g, '""')}"`,
      `"${(p.brand_id || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `products_backup_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const rows = text.split("\n").map(r => r.trim()).filter(Boolean);
      if (rows.length <= 1) throw new Error("File is empty or invalid");
      
      const parseCSVRow = (str: string) => {
        const result = [];
        let cur = "";
        let inQuote = false;
        for (let i = 0; i < str.length; i++) {
            if (inQuote) {
                if (str[i] === '"') {
                    if (i < str.length - 1 && str[i + 1] === '"') { cur += '"'; i++; } else { inQuote = false; }
                } else { cur += str[i]; }
            } else {
                if (str[i] === '"') { inQuote = true; } else if (str[i] === ',') { result.push(cur.trim()); cur = ""; } else { cur += str[i]; }
            }
        }
        result.push(cur.trim());
        return result;
      };

      const newProducts = [];
      for (let i = 1; i < rows.length; i++) {
        const cols = parseCSVRow(rows[i]);
        if (cols.length >= 3) {
          const nameAr = cols[0];
          if (!nameAr) continue;
          newProducts.push({
            name_ar: nameAr,
            name_en: cols[1] || nameAr,
            regular_price: Number(cols[2]) || 0,
            sale_price: cols[3] ? Number(cols[3]) : null,
            stock: Number(cols[4]) || 0,
            in_stock: (Number(cols[4]) || 0) > 0,
            sku: cols[5] || null,
            image: cols[6] || null,
            category_id: cols[7] || null,
            brand_id: cols[8] || null,
          });
        }
      }
      
      if (newProducts.length === 0) throw new Error("No valid products found in file");
      const { error } = await supabase.from("products").insert(newProducts);
      if (error) throw error;
      toast.success(lang === "ar" ? `تم استيراد ${newProducts.length} منتج` : `Imported ${newProducts.length} products`);
      loadAll();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  // 1. Loading state
  if (isAuth === null) return <div className="min-h-screen bg-[#0a051a] flex items-center justify-center">…</div>;

  // 2. Login Screen
  if (!isAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a051a] p-4 text-foreground">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full animate-pulse delay-700" />
        </div>
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow glow-primary mb-4">
              <ShieldCheck className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight"><span className="gradient-text">Admin Login</span></h1>
          </div>
          <form onSubmit={handleLogin} className="glass-modal rounded-3xl p-8 shadow-2xl border border-white/5 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ps-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input id="admin-login-email" name="email" autoComplete="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@pavilion.com"
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl ps-10 pe-4 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="admin-login-password" className="text-xs font-bold text-muted-foreground uppercase tracking-widest ps-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input id="admin-login-password" name="password" autoComplete="current-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl ps-10 pe-4 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all" />
                </div>
              </div>
            </div>
            <button disabled={busy} className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-bold shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50">
              {busy ? "Entering..." : "Enter Dashboard"}
            </button>
            <div className="pt-4 border-t border-white/5 text-center">
              <button type="button" onClick={() => nav({ to: "/" })} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition">
                <ArrowLeft className="w-3 h-3" /> Back to Storefront
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 3. Dashboard Screen
  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold gradient-text">
            {tab === "overview" ? (lang === "ar" ? "نظرة عامة" : "Overview") : 
             tab === "products" ? t("products") :
             tab === "orders" ? t("orders") :
             tab === "categories" ? (lang === "ar" ? "الأقسام" : "Categories") :
             tab === "brands" ? (lang === "ar" ? "الماركات" : "Brands") :
             (lang === "ar" ? "الإعدادات" : "Settings")}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === "ar" ? "لوحة تحكم Pavilion" : "Pavilion Admin Dashboard"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: t("visitors"), value: stats.visits, color: "from-blue-500 to-cyan-400", sub: lang === "ar" ? "زائر" : "visitors" },
          { icon: ShoppingBag, label: t("total_orders"), value: stats.orders, color: "from-primary to-primary-glow", sub: lang === "ar" ? "طلب" : "orders" },
          { icon: DollarSign, label: t("revenue"), value: stats.revenue.toLocaleString(), color: "from-emerald-500 to-teal-400", sub: t("iqd") },
          { icon: Package, label: t("products"), value: stats.products, color: "from-pink-500 to-rose-400", sub: lang === "ar" ? "منتج" : "items" },
        ].map((s, i) => (
          <div key={i} className="stat-card animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between mb-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{s.label}</span>
            </div>
            <div className="text-3xl font-extrabold mb-1">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="glass rounded-2xl p-1.5 inline-flex gap-1 mb-6 overflow-x-auto max-w-full">
        {(["overview", "products", "orders", "categories", "brands", "settings"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer border border-transparent whitespace-nowrap ${
              tab === k
                ? "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground glow-primary-sm border-white/10"
                : "text-muted-foreground hover:text-foreground hover:bg-white/6"
            }`}>
            {k === "overview" ? (lang === "ar" ? "نظرة عامة" : "Overview") :
             k === "products" ? t("products") :
             k === "orders" ? t("orders") :
             k === "categories" ? (lang === "ar" ? "الأقسام" : "Categories") :
             k === "brands" ? (lang === "ar" ? "الماركات" : "Brands") :
             (lang === "ar" ? "الإعدادات" : "Settings")}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="glass-strong rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[oklch(1_0_0/10%)] flex items-center justify-between">
            <h3 className="font-bold">{lang === "ar" ? "آخر الطلبات" : "Recent Orders"}</h3>
            <span className="badge badge-info">{orders.length} {lang === "ar" ? "طلب" : "orders"}</span>
          </div>
          <div className="divide-y divide-[oklch(1_0_0/6%)]">
            {orders.slice(0, 7).map((o) => (
              <div key={o.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/3 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold gradient-text shrink-0">
                    {(o.customer_name || "?")[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{o.customer_phone} · {o.source}</div>
                  </div>
                </div>
                <div className="text-end">
                  <div className="font-bold text-sm gradient-text">{Number(o.total).toLocaleString()} {t("iqd")}</div>
                  <div className="text-[12px] text-muted-foreground font-mono">{new Date(o.created_at).toLocaleString("en-GB")}</div>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="p-16 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-muted-foreground text-sm">{lang === "ar" ? "لا توجد طلبات بعد" : "No orders yet"}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products Tab */}
      {tab === "products" && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setEditing({ name_ar: "", name_en: "", regular_price: 0, stock: 0, in_stock: true })}
              className="btn-primary gap-2 !h-10 !px-4">
              <Plus className="w-4 h-4" /> {t("add_product")}
            </button>
            <button
              onClick={exportProductsCSV}
              className="btn-secondary gap-2 !h-10 !px-4 whitespace-nowrap inline-flex items-center justify-center cursor-pointer">
              <Package className="w-4 h-4" /> {lang === "ar" ? "تصدير إكسل" : "Export Excel"}
            </button>
            <label className="btn-secondary gap-2 !h-10 !px-4 whitespace-nowrap inline-flex items-center justify-center cursor-pointer">
              <Package className="w-4 h-4" />
              {lang === "ar" ? "استيراد إكسل" : "Import Excel"}
              <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
            </label>
          </div>
          <div className="glass-strong rounded-2xl overflow-hidden">
            <table className="data-table">
              <thead><tr>
                <th>{lang === "ar" ? "المنتج" : "Product"}</th>
                <th>SKU</th>
                <th>{lang === "ar" ? "السعر" : "Price"}</th>
                <th>{lang === "ar" ? "المخزون" : "Stock"}</th>
                <th className="text-end">{lang === "ar" ? "إجراءات" : "Actions"}</th>
              </tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-primary/50" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-sm">{lang === "ar" ? p.name_ar : p.name_en}</div>
                          {p.sale_price && p.sale_price < p.regular_price && (
                            <span className="badge badge-success !text-[10px]">Sale</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className="text-xs text-muted-foreground font-mono">{p.sku || "—"}</span></td>
                    <td>
                      <span className="font-bold gradient-text">{(p.sale_price ?? p.regular_price).toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground ms-1">{t("iqd")}</span>
                    </td>
                    <td>
                      <span className={`badge ${ p.stock > 10 ? "badge-success" : p.stock > 0 ? "badge-warning" : "badge-danger" }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => setEditing(p)} className="icon-btn" title={t("edit")}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteProduct(p.id!)} className="icon-btn hover:!bg-destructive/20 hover:!text-destructive hover:!border-destructive/30" title={t("delete")}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={5}>
                    <div className="py-16 text-center">
                      <div className="text-4xl mb-2">📦</div>
                      <p className="text-muted-foreground text-sm">{lang === "ar" ? "لا توجد منتجات" : "No products yet"}</p>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {tab === "orders" && (
        <div className="glass-strong rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[oklch(1_0_0/10%)] flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-bold flex items-center gap-3">
              {lang === "ar" ? "إدارة الطلبات" : "Manage Orders"}
              <span className="badge badge-warning">{filteredOrders.filter(o => o.status === "pending").length} {lang === "ar" ? "معلق" : "pending"}</span>
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={exportOrdersCSV} className="btn-secondary !h-9 !px-3 !py-0 !text-xs font-bold whitespace-nowrap">
                {lang === "ar" ? "تصدير Excel" : "Export CSV"}
              </button>

              <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block"></div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{lang === "ar" ? "من:" : "From:"}</span>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="field-input !h-9 !px-2 !text-xs !w-auto" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{lang === "ar" ? "إلى:" : "To:"}</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="field-input !h-9 !px-2 !text-xs !w-auto" />
              </div>

              <select
                value={orderDateFilter}
                onChange={(e) => setOrderDateFilter(e.target.value as any)}
                className="field-input !h-9 !px-3 !text-xs !rounded-lg bg-black/20"
              >
                <option value="all">{lang === "ar" ? "كل الأوقات" : "All Time"}</option>
                <option value="today">{lang === "ar" ? "اليوم" : "Today"}</option>
                <option value="week">{lang === "ar" ? "هذا الأسبوع" : "This Week"}</option>
                <option value="month">{lang === "ar" ? "هذا الشهر" : "This Month"}</option>
              </select>
            </div>
          </div>
          <table className="data-table">
            <thead><tr>
              <th>{lang === "ar" ? "العميل" : "Customer"}</th>
              <th>{lang === "ar" ? "الهاتف" : "Phone"}</th>
              <th>{lang === "ar" ? "التاريخ والوقت" : "Date & Time"}</th>
              <th>{t("total")}</th>
              <th>{lang === "ar" ? "الحالة" : "Status"}</th>
              <th className="text-end">{lang === "ar" ? "إجراءات" : "Actions"}</th>
            </tr></thead>
            <tbody>
              {paginatedOrders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xs font-bold gradient-text shrink-0">
                        {(o.customer_name || "?")[0]}
                      </div>
                      <span className="font-semibold text-sm">{o.customer_name}</span>
                    </div>
                  </td>
                  <td><span className="text-xs text-muted-foreground">{o.customer_phone}</span></td>
                  <td><span className="text-[13px] text-muted-foreground font-mono">{new Date(o.created_at).toLocaleString("en-GB")}</span></td>
                  <td><span className="font-bold gradient-text">{Number(o.total).toLocaleString()} {t("iqd")}</span></td>
                  <td>
                    <select
                      value={o.status}
                      onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                      className="field-input !h-8 !px-2 !text-xs !rounded-lg cursor-pointer font-bold"
                    >
                      {["pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => (
                        <option key={s} value={s} className="bg-[#0a051a]">{getStatusLabel(s)}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <div className="flex justify-end">
                      <button onClick={() => setViewingOrder(o)} className="icon-btn" title={lang === "ar" ? "عرض الطلب" : "View Order"}>
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr><td colSpan={5}>
                  <div className="py-16 text-center">
                    <div className="text-4xl mb-2">📭</div>
                    <p className="text-muted-foreground text-sm">{lang === "ar" ? "لا توجد طلبات" : "No orders yet"}</p>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[oklch(1_0_0/10%)] flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {lang === "ar" ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="btn-secondary !h-8 !px-3 !text-xs"
                >
                  {lang === "ar" ? "السابق" : "Prev"}
                </button>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="btn-secondary !h-8 !px-3 !text-xs"
                >
                  {lang === "ar" ? "التالي" : "Next"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Banners Tab */}
      {tab === "banners" && (
        <div className="space-y-4 animate-fade-in">
          <button onClick={() => setEditingBanner({ title: "", link: "", image_url: "", active: true, order_index: 0 })} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> {lang === "ar" ? "إضافة بنر متحرك" : "Add Animated Banner"}
          </button>
          <div className="glass-strong rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{lang === "ar" ? "الصورة والبنر" : "Banner & Details"}</th>
                  <th>{lang === "ar" ? "العنوان" : "Title"}</th>
                  <th>{lang === "ar" ? "الرابط" : "Link"}</th>
                  <th>{lang === "ar" ? "الترتيب" : "Order"}</th>
                  <th>{lang === "ar" ? "الحالة" : "Status"}</th>
                  <th className="text-end">{lang === "ar" ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                          {b.image_url ? (
                            <img src={b.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-5 h-5 opacity-20" /></div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td><span className="font-semibold text-sm">{b.title || "—"}</span></td>
                    <td>
                      {b.link ? (
                        <a href={b.link} target="_blank" rel="noreferrer" className="text-xs text-primary-glow hover:underline truncate max-w-[150px] inline-block">{b.link}</a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td><span className="text-sm font-semibold">{b.order_index}</span></td>
                    <td>
                      <span className={`badge ${b.active ? 'badge-success' : 'badge-danger'}`}>
                        {b.active ? (lang === "ar" ? "نشط" : "Active") : (lang === "ar" ? "غير نشط" : "Inactive")}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => setEditingBanner(b)} className="icon-btn" title={t("edit")}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteBanner(b.id)} className="icon-btn hover:!bg-destructive/20 hover:!text-destructive hover:!border-destructive/30" title={t("delete")}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {banners.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="py-16 text-center">
                        <div className="text-4xl mb-2">📸</div>
                        <p className="text-muted-foreground text-sm">{lang === "ar" ? "لا توجد بنرات بعد" : "No banners yet"}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Banner Modal */}
      {editingBanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onMouseDown={() => setEditingBanner(null)}>
          <div className="glass-modal rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-slide-up" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-xl gradient-text">{editingBanner.id ? t("edit") : (lang === "ar" ? "إضافة بنر" : "Add Banner")}</h3>
              <button onClick={() => setEditingBanner(null)} className="icon-btn"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <Field label={lang === "ar" ? "العنوان" : "Title"} name="banner-title" value={editingBanner.title ?? ""} onChange={(v) => setEditingBanner({ ...editingBanner, title: v })} />
              <Field label={lang === "ar" ? "الرابط (عند النقر)" : "Link (On click)"} name="banner-link" value={editingBanner.link ?? ""} onChange={(v) => setEditingBanner({ ...editingBanner, link: v })} />
              
              <div className="grid grid-cols-2 gap-4">
                <Field label={lang === "ar" ? "ترتيب العرض" : "Order Index"} name="banner-order" type="number" value={String(editingBanner.order_index)} onChange={(v) => setEditingBanner({ ...editingBanner, order_index: Number(v) })} />
                <div className="space-y-1">
                  <label className="field-label">{lang === "ar" ? "الحالة" : "Status"}</label>
                  <select value={editingBanner.active ? "true" : "false"} onChange={(e) => setEditingBanner({ ...editingBanner, active: e.target.value === "true" })} className="field-input cursor-pointer">
                    <option value="true" className="bg-[#0a051a]">{lang === "ar" ? "نشط" : "Active"}</option>
                    <option value="false" className="bg-[#0a051a]">{lang === "ar" ? "غير نشط" : "Inactive"}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="admin-field-banner-image" className="field-label">{lang === "ar" ? "صورة البنر" : "Banner Image"}</label>
                <div className="flex gap-2">
                  <input id="admin-field-banner-image" name="banner-image" autoComplete="off" type="text" value={editingBanner.image_url ?? ""} onChange={(e) => setEditingBanner({ ...editingBanner, image_url: e.target.value })} placeholder="URL" className="field-input flex-1" />
                  <label className="icon-btn shrink-0 cursor-pointer">
                    <Plus className="w-4 h-4" />
                    <input type="file" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        toast.promise(uploadFile(file, "banners").then(url => setEditingBanner({ ...editingBanner, image_url: url })), {
                          loading: "Uploading to banners bucket...",
                          success: "Uploaded!",
                          error: "Upload failed"
                        });
                      }
                    }} />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setEditingBanner(null)} className="btn-ghost flex-1">{t("cancel")}</button>
              <button disabled={busy} onClick={() => saveBanner(editingBanner)} className="btn-primary flex-1">
                {busy ? "..." : t("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {tab === "categories" && (
        <div className="space-y-4">
          <button onClick={() => setEditingCategory({ name_ar: "", name_en: "" })} className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> {lang === "ar" ? "إضافة قسم" : "Add Category"}
          </button>
          <div className="glass-strong rounded-2xl overflow-hidden">
            <table className="data-table">
              <thead><tr>
                <th>{lang === "ar" ? "القسم" : "Category"}</th>
                <th className="text-end">{lang === "ar" ? "إجراءات" : "Actions"}</th>
              </tr></thead>
              <tbody>
                {cats.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
                          {c.image ? (
                            <img src={c.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-primary-glow" />
                          )}
                        </div>
                        <span className="font-semibold text-sm">{lang === "ar" ? c.name_ar : c.name_en}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 justify-end">
                        <button onClick={() => setEditingCategory(c)} className="icon-btn" title={t("edit")}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={async () => {
                          if (confirm(lang === "ar" ? "تأكيد الحذف؟" : "Confirm delete?")) {
                            await supabase.from("categories").delete().eq("id", c.id);
                            loadAll();
                          }
                        }} className="icon-btn hover:!bg-destructive/20 hover:!text-destructive hover:!border-destructive/30" title={t("delete")}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onMouseDown={() => setEditingCategory(null)}>
          <div className="glass-modal rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-slide-up" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-extrabold text-xl gradient-text">{editingCategory.id ? t("edit") : (lang === "ar" ? "إضافة قسم" : "Add Category")}</h3>
              <button onClick={() => setEditingCategory(null)} className="icon-btn"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <Field label={lang === "ar" ? "الاسم (ع)" : "Name (AR)"} name="category-name-ar" value={editingCategory.name_ar} onChange={(v) => setEditingCategory({ ...editingCategory, name_ar: v })} />
              <Field label={lang === "ar" ? "الاسم (EN)" : "Name (EN)"} name="category-name-en" value={editingCategory.name_en} onChange={(v) => setEditingCategory({ ...editingCategory, name_en: v })} />
              <div className="space-y-1">
                <label htmlFor="admin-field-category-image" className="field-label">{lang === "ar" ? "الصورة" : "Image"}</label>
                <div className="flex gap-2">
                  <input id="admin-field-category-image" name="category-image" autoComplete="off" type="text" value={editingCategory.image ?? ""} onChange={(e) => setEditingCategory({ ...editingCategory, image: e.target.value })} placeholder="URL" className="field-input flex-1" />
                  <label className="icon-btn shrink-0 cursor-pointer">
                    <Plus className="w-4 h-4" />
                    <input type="file" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        toast.promise(uploadFile(file).then(url => setEditingCategory({ ...editingCategory, image: url })), {
                          loading: "Uploading...",
                          success: "Uploaded!",
                          error: "Upload failed"
                        });
                      }
                    }} />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setEditingCategory(null)} className="btn-ghost flex-1">{t("cancel")}</button>
              <button disabled={busy} onClick={() => saveCategory(editingCategory)} className="btn-primary flex-1">
                {busy ? "..." : t("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onMouseDown={() => setEditing(null)}>
          <div className="glass-modal rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar animate-slide-up" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-background/5 backdrop-blur-xl -mx-6 -mt-6 px-6 py-4 border-b border-[oklch(1_0_0/10%)] z-10">
              <h3 className="font-extrabold text-xl gradient-text">{editing.id ? t("edit") : t("add_product")}</h3>
              <button onClick={() => setEditing(null)} className="icon-btn"><X className="w-4 h-4" /></button>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-5 text-sm">
              <div className="space-y-4">
                <Field label={lang === "ar" ? "الاسم (ع)" : "Name (AR)"} name="product-name-ar" value={editing.name_ar} onChange={(v) => setEditing({ ...editing, name_ar: v })} />
                <Field label={lang === "ar" ? "الاسم (EN)" : "Name (EN)"} name="product-name-en" value={editing.name_en} onChange={(v) => setEditing({ ...editing, name_en: v })} />
                <Field label="SKU" name="product-sku" value={editing.sku ?? ""} onChange={(v) => setEditing({ ...editing, sku: v })} />
                <div className="space-y-1">
                  <label htmlFor="admin-field-product-image" className="field-label">{lang === "ar" ? "الصورة" : "Image"}</label>
                  <div className="flex gap-2">
                    <input id="admin-field-product-image" name="product-image" autoComplete="off" type="text" value={editing.image ?? ""} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="URL" className="field-input flex-1" />
                    <label className="icon-btn shrink-0 cursor-pointer">
                      <Plus className="w-4 h-4" />
                      <input type="file" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          toast.promise(uploadFile(file).then(url => setEditing({ ...editing, image: url })), {
                            loading: "Uploading...",
                            success: "Uploaded!",
                            error: "Upload failed"
                          });
                        }
                      }} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label={lang === "ar" ? "السعر العادي" : "Regular Price"} name="product-regular-price" type="number" value={String(editing.regular_price)} onChange={(v) => setEditing({ ...editing, regular_price: Number(v) })} />
                  <Field label={lang === "ar" ? "سعر التخفيض" : "Sale Price"} name="product-sale-price" type="number" value={String(editing.sale_price ?? "")} onChange={(v) => setEditing({ ...editing, sale_price: v ? Number(v) : null })} />
                  <Field label={lang === "ar" ? "المخزون" : "Stock"} name="product-stock" type="number" value={String(editing.stock)} onChange={(v) => setEditing({ ...editing, stock: Number(v), in_stock: Number(v) > 0 })} />
                  <Field label={lang === "ar" ? "التقييم" : "Rating"} name="product-rating" type="number" value={String(editing.rating ?? 5)} onChange={(v) => setEditing({ ...editing, rating: Number(v) })} />
                </div>
                <Select label={lang === "ar" ? "القسم" : "Category"} value={editing.category_id ?? ""} onChange={(v) => setEditing({ ...editing, category_id: v || null })}
                    options={[{ value: "", label: "—" }, ...cats.map((c) => ({ value: c.id, label: lang === "ar" ? c.name_ar : c.name_en }))]} />
                <Select label={lang === "ar" ? "الماركة" : "Brand"} value={editing.brand_id ?? ""} onChange={(v) => setEditing({ ...editing, brand_id: v || null })}
                    options={[{ value: "", label: "—" }, ...brands.map((b) => ({ value: b.id, label: lang === "ar" ? b.name_ar : b.name_en }))]} />
              </div>
              
              <div className="sm:col-span-2 space-y-4 pt-2">
                <div className="space-y-1">
                  <label htmlFor="admin-field-product-desc-ar" className="field-label">{lang === "ar" ? "الوصف (ع)" : "Description (AR)"}</label>
                  <textarea id="admin-field-product-desc-ar" name="product-desc-ar" autoComplete="off" value={editing.description_ar ?? ""} onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })}
                    className="field-input !h-auto py-3 min-h-[100px] custom-scrollbar" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="admin-field-product-desc-en" className="field-label">{lang === "ar" ? "الوصف (EN)" : "Description (EN)"}</label>
                  <textarea id="admin-field-product-desc-en" name="product-desc-en" autoComplete="off" value={editing.description_en ?? ""} onChange={(e) => setEditing({ ...editing, description_en: e.target.value })}
                    className="field-input !h-auto py-3 min-h-[100px] custom-scrollbar" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-[oklch(1_0_0/10%)] justify-end">
              <button onClick={() => setEditing(null)} className="btn-ghost !px-8">{t("cancel")}</button>
              <button disabled={busy} onClick={() => saveProduct(editing)} className="btn-primary !px-10">
                {busy ? "..." : t("save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onMouseDown={() => setViewingOrder(null)}>
          <div className="glass-modal rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar animate-slide-up" onMouseDown={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-extrabold text-xl gradient-text">{lang === "ar" ? "تفاصيل الطلب" : "Order Details"}</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{viewingOrder.id}</p>
              </div>
              <button onClick={() => setViewingOrder(null)} className="icon-btn"><X className="w-4 h-4" /></button>
            </div>

            <div className="grid sm:grid-cols-2 gap-8 mb-8">
              <div className="space-y-3">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{lang === "ar" ? "العميل" : "Customer Info"}</div>
                <div className="glass rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{lang === "ar" ? "الاسم:" : "Name:"}</span>
                    <span className="font-bold">{viewingOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{lang === "ar" ? "الهاتف:" : "Phone:"}</span>
                    <a href={`tel:${viewingOrder.customer_phone}`} className="font-bold text-primary-glow hover:underline">{viewingOrder.customer_phone}</a>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{lang === "ar" ? "العنوان:" : "Address:"}</span>
                    <span className="font-bold text-end">{viewingOrder.customer_address || "—"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{lang === "ar" ? "ملخص الطلب" : "Order Summary"}</div>
                <div className="glass rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{lang === "ar" ? "المصدر:" : "Source:"}</span>
                    <span className="badge badge-info">{viewingOrder.source}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{lang === "ar" ? "الحالة:" : "Status:"}</span>
                    <span className={`badge ${viewingOrder.status === 'delivered' ? 'badge-success' : 'badge-warning'}`}>{viewingOrder.status}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                    <span className="font-bold">{lang === "ar" ? "الإجمالي:" : "Total:"}</span>
                    <span className="font-bold text-lg gradient-text">{Number(viewingOrder.total).toLocaleString()} {t("iqd")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{lang === "ar" ? "المنتجات المطلوبة" : "Ordered Items"}</div>
              <div className="space-y-2">
                {Array.isArray(viewingOrder.items) && viewingOrder.items.map((it: any, idx: number) => (
                  <div key={idx} className="glass rounded-2xl p-3 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                      {it.image ? (
                        <img src={it.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="w-5 h-5 opacity-20" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate">{it.name}</div>
                      <div className="text-xs text-muted-foreground">{Number(it.price).toLocaleString()} {t("iqd")} × {it.qty}</div>
                    </div>
                    <div className="text-end">
                      <div className="font-bold text-sm">{(Number(it.price) * Number(it.qty)).toLocaleString()}</div>
                      <div className="text-[10px] text-muted-foreground">{t("iqd")}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {viewingOrder.notes && (
              <div className="mt-6 p-4 glass rounded-2xl border-primary/20">
                <div className="text-[10px] font-bold text-primary-glow uppercase tracking-widest mb-1">{lang === "ar" ? "ملاحظات:" : "Notes:"}</div>
                <p className="text-sm italic">{viewingOrder.notes}</p>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button onClick={() => setViewingOrder(null)} className="btn-primary w-full">{lang === "ar" ? "إغلاق" : "Close"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Brands Tab */}
      {tab === "brands" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button onClick={() => setEditingBrand({ name_ar: "", name_en: "", image: "" })} className="btn-primary gap-2">
              <Plus className="w-4 h-4" /> {lang === "ar" ? "إضافة ماركة" : "Add Brand"}
            </button>
          </div>
          <div className="glass-strong rounded-2xl overflow-hidden">
            <table className="data-table">
              <thead><tr>
                <th>{lang === "ar" ? "الماركة" : "Brand"}</th>
                <th>{lang === "ar" ? "الاسم (EN)" : "Name (EN)"}</th>
                <th className="text-end">{lang === "ar" ? "إجراءات" : "Actions"}</th>
              </tr></thead>
              <tbody>
                {brands.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {b.image && <img src={b.image} className="w-8 h-8 rounded object-contain bg-white/5" alt="" />}
                        <span className="font-bold">{b.name_ar}</span>
                      </div>
                    </td>
                    <td><span className="text-sm text-muted-foreground">{b.name_en}</span></td>
                    <td>
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setEditingBrand(b)} className="icon-btn"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteBrand(b.id)} className="icon-btn hover:!bg-destructive/20 hover:!text-destructive hover:!border-destructive/30"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Brand Modal */}
      {editingBrand && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-modal rounded-3xl p-8 max-w-lg w-full shadow-2xl space-y-6" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-xl">{editingBrand.id ? (lang === "ar" ? "تعديل ماركة" : "Edit Brand") : (lang === "ar" ? "إضافة ماركة" : "Add Brand")}</h3>
            <div className="space-y-4">
              <Field label={lang === "ar" ? "الاسم بالعربي" : "Name (AR)"} name="brand-name-ar" value={editingBrand.name_ar} onChange={(v) => setEditingBrand({ ...editingBrand, name_ar: v })} />
              <Field label={lang === "ar" ? "الاسم بالإنجليزي" : "Name (EN)"} name="brand-name-en" value={editingBrand.name_en} onChange={(v) => setEditingBrand({ ...editingBrand, name_en: v })} />
              <Field label={lang === "ar" ? "رابط الصورة" : "Image URL"} name="brand-image" value={editingBrand.image || ""} onChange={(v) => setEditingBrand({ ...editingBrand, image: v })} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingBrand(null)} className="btn-ghost flex-1">{t("cancel")}</button>
              <button onClick={saveBrand} disabled={busy} className="btn-primary flex-1">{busy ? "..." : t("save")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {tab === "settings" && (
        <div className="max-w-md mx-auto">
          <div className="glass-strong rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary-glow" />
              </div>
              <h3 className="font-bold text-lg">{lang === "ar" ? "تغيير كلمة السر" : "Change Password"}</h3>
            </div>
            <div className="space-y-4">
              <Field label={lang === "ar" ? "كلمة السر الجديدة" : "New Password"} name="new-password" type="password" value={newPassword} onChange={setNewPassword} />
              <button onClick={changeAdminPassword} className="btn-primary w-full py-3">
                {lang === "ar" ? "حفظ التغييرات" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function Field({ label, value, onChange, type = "text", name, autoComplete = "off" }: { label: string; value: string; onChange: (v: string) => void; type?: string; name?: string; autoComplete?: string }) {
  const id = name ? `admin-field-${name}` : undefined;
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} name={name} autoComplete={autoComplete} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="field-input" />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="field-input cursor-pointer">
        {options.map((o) => <option key={o.value} value={o.value} className="bg-[#0a051a]">{o.label}</option>)}
      </select>
    </div>
  );
}
