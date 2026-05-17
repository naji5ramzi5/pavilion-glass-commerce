import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard, type Product } from "@/components/ProductCard";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowRight as ArrowRightIcon, 
  ArrowLeft, 
  Sparkles, 
  Truck, 
  ShieldCheck, 
  MapPin, 
  Cpu, 
  Zap, 
  Star, 
  ChevronRight as ChevronRightIcon, 
  ChevronLeft, 
  ShoppingBag, 
  Package 
} from "lucide-react";
import heroLaptop from "@/assets/hero-laptop-new.png";
import catLaptops from "@/assets/cat-laptops.png";
import catParts from "@/assets/cat-parts.png";
import catAccs from "@/assets/cat-accs.png";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { t, lang, dir } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("products").select("*").order("created_at", { ascending: false }).limit(8)
      .then(({ data }) => setProducts((data ?? []) as Product[]));
    supabase.from("categories").select("*").limit(6)
      .then(({ data }) => setCategories(data ?? []));
    supabase.from("visits").insert({ path: "/" });
  }, []);

  const HeroArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRightIcon;
  const CategoryArrowIcon = dir === "rtl" ? ChevronLeft : ChevronRightIcon;

  const getCatImg = (cat: any) => {
    if (cat.image) return cat.image;
    const name = (cat.name_en || "").toLowerCase();
    if (name.includes("laptop")) return catLaptops;
    if (name.includes("part") || name.includes("spare")) return catParts;
    if (name.includes("acc") || name.includes("other")) return catAccs;
    return catLaptops; // fallback
  };

  return (
    <Layout>
      {/* ─── Hero Section ──────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col rounded-[2.5rem] overflow-hidden mb-12 shadow-2xl">
        {/* Background Image with Cinematic Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroLaptop} 
            alt="PAVILION Premium" 
            className="w-full h-full object-cover object-center scale-100 animate-subtle-zoom brightness-[0.75] contrast-[1.1]" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060312] via-[#060312]/50 to-transparent" />
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
          
          {/* Decorative Glows */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/20 blur-[120px] rounded-full animate-pulse delay-700" />
        </div>

        {/* Main Content Container - Flex Grow to push features bar to bottom */}
        <div className="relative z-10 container mx-auto px-6 flex-1 flex flex-col items-center justify-center pt-32 pb-16 text-center">

          <div className="animate-slide-up space-y-4 max-w-5xl">
            <h1 className="relative inline-block mb-4">
              {/* Background Glow Text */}
              <span className="absolute -inset-x-24 -top-12 text-[10rem] sm:text-[18rem] font-black uppercase opacity-[0.03] tracking-[0.3em] select-none pointer-events-none blur-[4px] hidden lg:block">
                PAVILION
              </span>
              
              {/* Main Text */}
              <span className="block text-7xl sm:text-[11rem] lg:text-[13rem] font-black leading-none tracking-[0.02em] uppercase gradient-text drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] filter brightness-110">
                PAVILION
              </span>
            </h1>

            <div className="relative space-y-4">
              <div className="h-1 w-24 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mb-6" />
              <h2 className="text-xl sm:text-4xl font-black text-white tracking-tight max-w-3xl mx-auto drop-shadow-2xl">
                {t("hero_title")}
              </h2>
              <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto font-bold leading-relaxed opacity-90 drop-shadow-lg">
                {t("hero_sub")}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12 animate-fade-in delay-500">
            <Link to="/shop" className="btn-primary !px-16 !py-6 text-lg font-black tracking-[0.1em] uppercase glow-primary-sm hover:glow-primary hover:scale-105 active:scale-95 transition-all duration-300">
              {t("shop_now")} <HeroArrowIcon className="w-6 h-6 ms-4" />
            </Link>
            <Link to="/contact" className="btn-ghost !px-16 !py-6 text-lg font-black tracking-[0.1em] uppercase backdrop-blur-2xl border-white/20 hover:bg-white/15 hover:scale-105 active:scale-95 transition-all duration-300">
              {t("contact")}
            </Link>
          </div>
        </div>

        {/* Bottom Features Bar - Now as a flex child, naturally at bottom */}
        <div className="relative z-20 glass-strong border-t border-white/10 py-8 mt-auto hidden lg:block">
          <div className="container mx-auto px-6 flex justify-center gap-16">
            {[
              { icon: Cpu, label: lang === "ar" ? "أحدث المعالجات" : "Latest CPUs" },
              { icon: Zap, label: lang === "ar" ? "أداء فائق" : "Extreme Performance" },
              { icon: ShieldCheck, label: lang === "ar" ? "ضمان حقيقي" : "Genuine Warranty" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-base font-black uppercase tracking-wider text-white group hover:text-primary-glow transition-all duration-500 cursor-default">
                <item.icon className="w-6 h-6 text-primary-glow animate-float group-hover:scale-110 transition-transform" />
                <span className="drop-shadow-lg">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────── */}
      <section className="grid sm:grid-cols-3 gap-4 mb-16">
        {[
          { icon: Truck, title: lang === "ar" ? "توصيل سريع" : "Fast Delivery", desc: lang === "ar" ? "خلال 24 ساعة في بغداد" : "Within 24h in Baghdad", color: "from-blue-500 to-cyan-400" },
          { icon: ShieldCheck, title: lang === "ar" ? "ضمان أصلي" : "Genuine Warranty", desc: lang === "ar" ? "قطع أصلية مضمونة" : "Authentic guaranteed parts", color: "from-emerald-500 to-teal-400" },
          { icon: Star, title: lang === "ar" ? "تقييم عالي" : "Top Rated", desc: lang === "ar" ? "+500 عميل راضٍ" : "+500 satisfied customers", color: "from-primary to-primary-glow" },
        ].map((f, i) => (
          <div key={i} className="glass-strong rounded-2xl p-6 flex items-center gap-5 hover:border-primary/30 transition-all duration-300 group cursor-default">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center shrink-0 shadow-lg group-hover:rotate-6 transition-transform`}>
              <f.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-base mb-1">{f.title}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{f.desc}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ─── Categories ──────────────────────────────── */}
      {categories.length > 0 && (
        <section className="mb-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="text-primary-glow text-[10px] font-bold uppercase tracking-[0.3em] mb-2">{lang === "ar" ? "تصفح المجموعات" : "Explore Collections"}</div>
              <h2 className="text-3xl sm:text-4xl font-black">{lang === "ar" ? "الأقسام المميزة" : "Featured Categories"}</h2>
            </div>
            <Link to="/categories" className="btn-ghost !px-5 !py-2 !text-xs gap-2">
              {lang === "ar" ? "عرض الكل" : "View All"} <CategoryArrowIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat, i) => (
              <Link key={cat.id} to="/shop" className="glass rounded-3xl p-5 text-center hover:glass-strong hover:scale-[1.03] transition-all duration-500 group animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="relative w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:glow-primary-sm transition-all overflow-hidden border border-white/10">
                  <img src={getCatImg(cat)} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-sm font-bold tracking-tight">{lang === "ar" ? cat.name_ar : cat.name_en}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── Featured Products ────────────────────────── */}
      <section className="mb-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="text-accent text-[10px] font-bold uppercase tracking-[0.3em] mb-2">{lang === "ar" ? "وصلنا حديثاً" : "New Arrivals"}</div>
            <h2 className="text-3xl sm:text-4xl font-black">{lang === "ar" ? "أحدث المنتجات" : "Latest Tech"}</h2>
          </div>
          <Link to="/shop" className="btn-primary !px-6 !py-2.5 !text-xs">
            {lang === "ar" ? "تسوق المتجر" : "Shop Store"}
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="glass-strong rounded-3xl p-20 text-center border-dashed border-white/10">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-white/20" />
            </div>
            <div className="font-bold text-xl text-white/40">{lang === "ar" ? "جاري تحميل المنتجات..." : "Loading products..."}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p, i) => (
              <div key={p.id} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── CTA Banner ──────────────────────────────── */}
      <section className="mt-10">
        <div className="glass-strong rounded-3xl p-8 sm:p-12 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="relative">
            <div className="inline-flex items-center gap-2 badge badge-info mb-4">
              <MapPin className="w-3 h-3" />
              {lang === "ar" ? "تعال زورنا" : "Visit Us"}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
              {lang === "ar" ? "تجربة تسوق لا مثيل لها" : "Unmatched Shopping Experience"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto leading-relaxed">{t("location")}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a href="https://wa.me/9647712715130" target="_blank" rel="noopener noreferrer"
                className="btn-primary !px-6 gap-2">
                💬 WhatsApp
              </a>
              <Link to="/contact" className="btn-ghost !px-6">
                {t("contact")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
