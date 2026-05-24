import { Link, useRouterState } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FolderOpen,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Laptop,
  Bell,
  TrendingUp,
  Menu,
  X,
  Lock,
  Bookmark,
  Image as ImageIcon,
  Sun,
  Moon
} from "lucide-react";
import { ReactNode, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function AdminLayout({ children }: { children?: ReactNode }) {
  const { t, lang } = useI18n();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("theme") as "dark" | "light") || "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending")
      .then(({ count }) => setOrderCount(count || 0));

    const channel = supabase.channel("admin-layout-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => {
        setOrderCount(prev => prev + 1);
      })
      .subscribe();

    const onTab = (e: any) => setActiveTab(e.detail);
    window.addEventListener("admin-tab-change", onTab);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("admin-tab-change", onTab);
    };
  }, []);

  const menuItems = [
    { id: "overview", label: lang === "ar" ? "نظرة عامة" : "Overview", icon: TrendingUp },
    { id: "banners", label: lang === "ar" ? "البنرات المتحركة" : "Banners", icon: ImageIcon },
    { id: "products", label: lang === "ar" ? "المنتجات" : "Products", icon: Package },
    { id: "orders", label: lang === "ar" ? "الطلبات" : "Orders", icon: ShoppingBag, badge: orderCount },
    { id: "categories", label: lang === "ar" ? "الأقسام" : "Categories", icon: FolderOpen },
    { id: "brands", label: lang === "ar" ? "الماركات" : "Brands", icon: Bookmark },
    { id: "settings", label: lang === "ar" ? "الإعدادات" : "Settings", icon: Lock },
  ];

  const handleLogout = async () => {
    localStorage.removeItem("isAdmin");
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleTabClick = (id: string) => {
    const event = new CustomEvent("admin-tab-change", { detail: id });
    window.dispatchEvent(event);
    setIsMobileOpen(false);
  };

  const SidebarArrowIcon = lang === "ar" ? ChevronRight : ChevronLeft;

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className={`p-5 flex items-center gap-3 ${!isSidebarOpen ? "justify-center" : ""}`}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 animate-float overflow-hidden bg-white p-1">
          <img src="/logo.png" alt="Pavilion Admin Logo" className="w-full h-full object-contain" />
        </div>
        {isSidebarOpen && (
          <div className="overflow-hidden">
            <div className="font-bold text-base gradient-text whitespace-nowrap">Pavilion</div>
            <div className="text-[10px] text-muted-foreground whitespace-nowrap">Admin Dashboard</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 mt-2">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`nav-item ${isActive ? "active" : ""} ${!isSidebarOpen ? "justify-center px-0" : ""}`}
              title={!isSidebarOpen ? item.label : undefined}
            >
              <div className="relative shrink-0">
                <item.icon className={`w-5 h-5 transition-transform ${isActive ? "text-primary-glow" : ""}`} />
                {item.badge && item.badge > 0 && !isSidebarOpen && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] rounded-full flex items-center justify-center font-bold">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              {isSidebarOpen && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="badge badge-danger text-[9px] py-0.5 px-1.5">{item.badge}</span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3">
        <button
          onClick={handleLogout}
          className={`nav-item w-full text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 ${!isSidebarOpen ? "justify-center px-0" : ""}`}
          title={!isSidebarOpen ? t("logout") : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {isSidebarOpen && <span>{t("logout")}</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 start-0 z-50 w-72 glass-strong flex flex-col transition-transform duration-300 lg:hidden ${isMobileOpen ? "translate-x-0" : (lang === "ar" ? "translate-x-full" : "-translate-x-full")}`}>
        <div className="flex items-center justify-between p-4 border-b border-[oklch(1_0_0/10%)]">
          <div className="font-bold gradient-text">Navigation</div>
          <button onClick={() => setIsMobileOpen(false)} className="icon-btn">
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => handleTabClick(item.id)} className={`nav-item ${isActive ? "active" : ""}`}>
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-primary-glow" : ""}`} />
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="badge badge-danger">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-[oklch(1_0_0/10%)]">
          <button onClick={handleLogout} className="nav-item w-full text-destructive hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="w-5 h-5" />
            <span>{t("logout")}</span>
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex glass-strong transition-all duration-300 flex-col z-30 shrink-0 ${isSidebarOpen ? "w-64" : "w-[72px]"}`}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 glass-strong shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button onClick={() => setIsMobileOpen(true)} className="icon-btn lg:hidden">
              <Menu className="w-4 h-4" />
            </button>
            {/* Desktop Sidebar Toggle */}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="icon-btn hidden lg:flex" title="Toggle Sidebar">
              <SidebarArrowIcon className={`w-4 h-4 transition-transform ${isSidebarOpen ? "" : "rotate-180"}`} />
            </button>
            <div className="hidden sm:block">
              <div className="text-sm font-bold">{lang === "ar" ? menuItems.find(m => m.id === activeTab)?.label : menuItems.find(m => m.id === activeTab)?.label}</div>
              <div className="text-[11px] text-muted-foreground">{lang === "ar" ? "لوحة تحكم Pavilion" : "Pavilion Admin Panel"}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Switch */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="icon-btn"
              title={theme === "light" ? "Dark Mode" : "Light Mode"}
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-primary-glow" />}
            </button>

            {/* Bell */}
            <button className="icon-btn relative animate-pulse-ring" title={lang === "ar" ? "الإشعارات" : "Notifications"}>
              <Bell className="w-4 h-4" />
              {orderCount > 0 && (
                <span className="absolute -top-1 -end-1 bg-destructive text-destructive-foreground text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold border-2 border-background animate-bounce">
                  {orderCount > 9 ? "9+" : orderCount}
                </span>
              )}
            </button>

            {/* Admin Avatar */}
            <div className="flex items-center gap-2 ps-3 border-s border-[oklch(1_0_0/10%)]">
              <div className="text-end hidden sm:block">
                <div className="text-xs font-bold">Admin</div>
                <div className="text-[10px] text-muted-foreground">Manager</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border border-[oklch(1_0_0/20%)] flex items-center justify-center font-bold text-sm gradient-text">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar animate-slide-up">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
