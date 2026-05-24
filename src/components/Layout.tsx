import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ShoppingBag, ShoppingCart, Laptop, MapPin, Phone, Edit2, Trash2, Languages, Plus, Search, User, Menu, X, Mail, Sun, Moon } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { CartDrawer } from "./CartDrawer";
import { AddToCartModal } from "./AddToCartModal";
import { BuyNowModal } from "./BuyNowModal";

export function Layout({ children }: { children: ReactNode }) {
  const { t, lang, setLang, dir } = useI18n();
  const [openCart, setOpenCart] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const path = location.pathname;
  const cartCount = useCart((s) => s.count());

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

  const nav = [
    { label: t("home"), to: "/" },
    { label: t("shop"), to: "/shop" },
    { label: t("categories"), to: "/categories" },
    { label: t("contact"), to: "/contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/30 selection:text-white" dir={dir}>
      {/* ─── Header ────────────────────────────────── */}
      <header className="sticky top-2 sm:top-4 z-50 mx-2 sm:mx-8">
        <div className="glass-strong rounded-2xl sm:rounded-[1.5rem] px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between border border-white/5 shadow-2xl backdrop-blur-3xl">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shrink-0 overflow-hidden bg-white p-1">
              <img src="/logo.png" alt="Pavilion" className="w-full h-full object-contain" />
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-xl leading-tight gradient-text tracking-widest uppercase">{t("brand")}</div>
              <div className="text-[10px] text-muted-foreground leading-tight font-black opacity-60 uppercase tracking-widest">{t("tagline")}</div>
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden xl:flex items-center gap-2 flex-1 justify-center mx-10">
            {nav.map((n) => {
              const active = path === n.to;
              return (
                <Link key={n.to} to={n.to}
                  className={`px-5 py-2.5 rounded-xl text-[15px] font-black uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                    active
                      ? "bg-primary/20 text-primary-glow border border-primary/20 shadow-lg shadow-primary/10"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 ms-auto">
            {/* Lang Switch */}
            <div className="flex items-center gap-1 glass-strong rounded-lg sm:rounded-xl p-0.5 border border-white/5 shrink-0">
              {['ar', 'en'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l as any)}
                  className={`px-3 sm:px-6 py-1.5 sm:py-3 rounded-md sm:rounded-xl text-[11px] sm:text-sm font-black transition-all duration-300 uppercase tracking-widest ${
                    lang === l 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40 scale-105" 
                    : "text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Theme Switch */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all text-foreground cursor-pointer shrink-0"
              title={theme === "light" ? "Dark Mode" : "Light Mode"}
            >
              {theme === "light" ? <Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-primary-glow" />}
            </button>

            <button
              onClick={() => setOpenCart(true)}
              className="relative group flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-primary to-primary-glow p-1 sm:pe-5 rounded-xl sm:rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              title={t("cart")}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md relative shrink-0">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 bg-destructive text-destructive-foreground text-[9px] sm:text-[10px] w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center font-black border border-background animate-bounce">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[13px] font-black uppercase tracking-widest text-white hidden sm:block">{t("cart")}</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all xl:hidden text-white cursor-pointer shrink-0"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 mt-10">
        <div className="container mx-auto px-4 sm:px-8">
          {children}
        </div>
      </main>

      <footer className="mt-24 border-t border-[oklch(1_0_0/5%)] pt-16 pb-12 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2" />
        
        <div className="container mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 mb-16">
            {/* Brand Info */}
            <div className="space-y-8 text-center md:text-start flex flex-col items-center md:items-start">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center glow-primary-sm group-hover:scale-110 transition-transform shadow-lg">
                  <Laptop className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="font-black text-2xl gradient-text tracking-widest uppercase">{t("brand")}</div>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium opacity-80 max-w-xs">
                {t("tagline")}
              </p>
              <div className="flex items-center gap-4">
                {[
                  { icon: "facebook", href: "https://www.facebook.com/share/18V817G7BM/", color: "hover:bg-[#1877F2]/20 hover:border-[#1877F2]/30 hover:text-[#1877F2]" },
                  { icon: "instagram", href: "https://www.instagram.com/pavilion_data?igsh=MWRjeHFpcmlnbzBrbA==", color: "hover:bg-[#E4405F]/20 hover:border-[#E4405F]/30 hover:text-[#E4405F]" },
                  { icon: "whatsapp", href: "https://wa.me/9647712715130", color: "hover:bg-[#25D366]/20 hover:border-[#25D366]/30 hover:text-[#25D366]" }
                ].map((s) => (
                  <a key={s.icon} href={s.href} target="_blank" rel="noopener noreferrer" 
                     className={`w-12 h-12 rounded-2xl glass-strong border border-white/5 flex items-center justify-center transition-all duration-500 group ${s.color} shadow-lg`}>
                    <SocialIcon name={s.icon} className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">{lang === "ar" ? "روابط سريعة" : "QUICK LINKS"}</h4>
                <div className="flex flex-col gap-4">
                  {nav.map(n => (
                    <Link key={n.to} to={n.to} className="text-sm text-muted-foreground hover:text-primary-glow transition-colors font-semibold tracking-wide">{n.label}</Link>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">{lang === "ar" ? "الدعم" : "SUPPORT"}</h4>
                <div className="flex flex-col gap-4">
                  <a href="https://wa.me/9647712715130" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary-glow transition-colors font-semibold tracking-wide">
                    {lang === "ar" ? "اتصل بنا" : "Contact Us"}
                  </a>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-6 text-center md:text-start flex flex-col items-center md:items-start">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">{lang === "ar" ? "تواصل معنا" : "GET IN TOUCH"}</h4>
              <div className="space-y-6">
                <a href="tel:009647712715130" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-all group justify-center md:justify-start">
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors shadow-lg">
                    <Phone className="w-4.5 h-4.5 text-primary-glow" />
                  </div>
                  <span className="text-sm font-black tracking-[0.1em]">009647712715130</span>
                </a>
                <a href="mailto:info@pavilion-iq.com" className="flex items-center gap-4 text-muted-foreground hover:text-white transition-all group justify-center md:justify-start">
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors shadow-lg">
                    <Mail className="w-4.5 h-4.5 text-primary-glow" />
                  </div>
                  <span className="text-sm font-black tracking-[0.1em]">info@pavilion-iq.com</span>
                </a>
                <div className="flex items-start gap-4 text-muted-foreground justify-center md:justify-start">
                  <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center shrink-0 shadow-lg">
                    <MapPin className="w-4.5 h-4.5 text-primary-glow" />
                  </div>
                  <span className="text-sm font-semibold leading-relaxed max-w-[220px]">{t("location")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
            <p className="text-[10px] font-black tracking-[0.2em] text-white/20 uppercase text-center md:text-start">
              © {new Date().getFullYear()} {t("brand")} DATA. {lang === "ar" ? "جميع الحقوق محفوظة" : "ALL RIGHTS RESERVED"}.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/5 border border-white/5 shadow-inner">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{lang === "ar" ? "متصل الآن" : "ONLINE NOW"}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 xl:hidden animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 start-0 z-50 w-72 glass-strong flex flex-col transition-transform duration-300 xl:hidden animate-slide-right">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden p-1">
                  <img src="/logo.png" alt="Pavilion" className="w-full h-full object-contain" />
                </div>
                <span className="font-black gradient-text uppercase tracking-wider">{t("brand")}</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-5 space-y-2 mt-4">
              {nav.map((n) => {
                const active = path === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-5 py-3.5 rounded-xl text-base font-black uppercase tracking-widest transition-all duration-300 ${
                      active
                        ? "bg-primary/20 text-primary-glow border border-primary/20 shadow-lg shadow-primary/10"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-5 border-t border-white/10 text-center">
              <p className="text-[10px] font-black tracking-[0.2em] text-white/20 uppercase">
                © {new Date().getFullYear()} {t("brand")}
              </p>
            </div>
          </aside>
        </>
      )}

      <CartDrawer open={openCart} onClose={() => setOpenCart(false)} />
      <AddToCartModal onOpenCart={() => setOpenCart(true)} />
      <BuyNowModal />
    </div>
  );
}

function SocialIcon({ name, className }: { name: string; className?: string }) {
  if (name === "facebook") return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
  if (name === "instagram") return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.019 1.347 20.35.935 19.56.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.043-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.645-1.44-1.44 0-.794.645-1.439 1.44-1.439.794 0 1.44.645 1.44 1.439z"/></svg>;
  if (name === "whatsapp") return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
  return null;
}
