import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard, type Product } from "@/components/ProductCard";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Sparkles, Truck, ShieldCheck, MapPin, Cpu, Zap } from "lucide-react";
import heroLaptop from "@/assets/hero-laptop.jpg";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { t, lang, dir } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    supabase.from("products").select("*").order("created_at", { ascending: false }).limit(8)
      .then(({ data }) => setProducts((data ?? []) as Product[]));
    supabase.from("visits").insert({ path: "/" });
  }, []);

  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <Layout>
      <section className="glass-strong rounded-3xl px-6 sm:px-10 py-10 sm:py-16 relative overflow-hidden">
        <div className="absolute -top-32 -end-32 w-96 h-96 rounded-full bg-primary/40 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -start-32 w-96 h-96 rounded-full bg-accent/40 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />

        <div className="relative grid lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-5 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-primary-glow" />
              <span className="truncate">{t("location")}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
              <span className="gradient-text">{t("hero_title")}</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">{t("hero_sub")}</p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/shop"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground px-6 py-3 rounded-xl font-semibold glow-primary hover:opacity-90 hover:scale-105 transition-all">
                {t("shop_now")} <Arrow className="w-4 h-4" />
              </Link>
              <Link to="/categories" className="glass rounded-xl px-6 py-3 font-semibold hover:bg-white/10 transition">
                {t("categories")}
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 pt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-primary-glow" /> {lang === "ar" ? "أحدث المعالجات" : "Latest CPUs"}</div>
              <div className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-accent" /> {lang === "ar" ? "أداء عالي" : "High Performance"}</div>
              <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-primary-glow" /> {lang === "ar" ? "ضمان رسمي" : "Official Warranty"}</div>
            </div>
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-accent/20 to-transparent blur-2xl" />
            <div className="relative glass-strong rounded-3xl p-3 sm:p-4 hover:scale-[1.02] transition-transform duration-700"
                 style={{ transform: "perspective(1000px) rotateY(-8deg) rotateX(4deg)" }}>
              <img src={heroLaptop} alt="Premium gaming laptop" width={1024} height={1024}
                   className="w-full h-auto rounded-2xl" />
              <div className="absolute -bottom-3 -start-3 sm:-bottom-4 sm:-start-4 glass-strong rounded-2xl px-4 py-2.5 flex items-center gap-2 glow-primary">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-semibold">{lang === "ar" ? "متوفر الآن" : "In Stock Now"}</span>
              </div>
              <div className="absolute -top-3 -end-3 sm:-top-4 sm:-end-4 glass-strong rounded-2xl px-3 py-2 text-xs font-bold gradient-text">
                {lang === "ar" ? "إصدار 2026" : "2026 Edition"}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4 mt-6">
        {[
          { icon: Truck, t: lang === "ar" ? "توصيل سريع" : "Fast Delivery", d: lang === "ar" ? "خلال 24 ساعة في بغداد" : "Within 24h in Baghdad" },
          { icon: ShieldCheck, t: lang === "ar" ? "ضمان أصلي" : "Genuine Warranty", d: lang === "ar" ? "قطع أصلية مضمونة" : "Authentic guaranteed parts" },
          { icon: MapPin, t: lang === "ar" ? "موقع مركزي" : "Central Location", d: t("location") },
        ].map((f, i) => (
          <div key={i} className="glass rounded-2xl p-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shrink-0">
              <f.icon className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-semibold">{f.t}</div>
              <div className="text-xs text-muted-foreground mt-1">{f.d}</div>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{lang === "ar" ? "الأحدث" : "Latest"}</h2>
          <Link to="/shop" className="text-sm text-primary-glow hover:underline">{t("shop_now")}</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </Layout>
  );
}
