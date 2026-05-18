import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useAddToCartModal } from "@/lib/add-to-cart-modal";
import { useBuyNow } from "@/lib/buy-now-modal";
import { ShoppingBag, ArrowLeft, ArrowRight as ArrowRightIcon, ShieldCheck, Truck, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$id")({ component: ProductDetails });

function ProductDetails() {
  const { id } = Route.useParams();
  const { t, lang, dir } = useI18n();
  const add = useCart((s) => s.add);
  const cartModal = useAddToCartModal();
  const buyNow = useBuyNow();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("products").select("*").eq("id", id).maybeSingle()
      .then(({ data }) => {
        setProduct(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <Layout><div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div></Layout>;
  if (!product) return <Layout><div className="text-center py-20 font-bold text-xl">{lang === "ar" ? "المنتج غير موجود" : "Product not found"}</div></Layout>;

  const price = product.sale_price ?? product.regular_price;
  const ArrowIcon = dir === "rtl" ? ArrowRightIcon : ArrowLeft;

  return (
    <Layout>
      <button onClick={() => window.history.back()} className="mb-8 flex items-center gap-2.5 text-muted-foreground hover:text-primary-glow transition-all font-bold uppercase tracking-widest text-xs group">
        <ArrowIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {lang === "ar" ? "رجوع" : "Back"}
      </button>

      <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="glass-strong rounded-[2.5rem] p-6 relative overflow-hidden border border-white/10 shadow-2xl">
            <img src={product.image || "/placeholder.svg"} alt={product.name_en} className="w-full h-auto rounded-3xl shadow-2xl group-hover:scale-[1.02] transition-transform duration-700" />
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="badge badge-info !text-[10px]">{product.sku || "PAV-GEN"}</span>
              {product.stock > 0 ? (
                <span className="badge badge-success !text-[10px]">{t("in_stock")}</span>
              ) : (
                <span className="badge badge-danger !text-[10px]">{t("out_of_stock")}</span>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tighter">
              <span className="gradient-text">{lang === "ar" ? product.name_ar : product.name_en}</span>
            </h1>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full">
                <Star className="w-4 h-4 fill-current" />
                <span className="font-black text-sm">{product.rating || 5.0}</span>
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-[2rem] p-8 space-y-6 border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
            
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black gradient-text tracking-tighter">{price.toLocaleString()}</span>
              <span className="text-sm font-bold text-muted-foreground uppercase">{t("iqd")}</span>
              {product.sale_price && (
                <span className="text-xl text-muted-foreground/40 line-through font-bold">{product.regular_price.toLocaleString()}</span>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{lang === "ar" ? "تفاصيل المنتج" : "PRODUCT DETAILS"}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                {lang === "ar" ? product.description_ar : product.description_en}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/5">
              <button onClick={() => { 
                add({ id: product.id, name: lang === "ar" ? product.name_ar : product.name_en, price: price, image: product.image }); 
                cartModal.open(lang === "ar" ? product.name_ar : product.name_en); 
              }}
                className="flex-1 glass border-white/10 hover:bg-white/10 rounded-2xl py-4.5 sm:py-5 min-h-[3.5rem] sm:min-h-[4rem] flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-lg shrink-0">
                <ShoppingBag className="w-5 h-5 text-primary-glow" /> {t("add_to_cart")}
              </button>
              <button onClick={() => buyNow.open(product)}
                className="flex-1 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground rounded-2xl py-4.5 sm:py-5 min-h-[3.5rem] sm:min-h-[4rem] flex items-center justify-center gap-3 font-black uppercase tracking-widest text-xs glow-primary hover:opacity-90 transition-all active:scale-95 shadow-xl shrink-0">
                {t("buy_now")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            {[
              { icon: ShieldCheck, label: lang === "ar" ? "ضمان رسمي" : "Official Warranty", sub: lang === "ar" ? "سنة كاملة" : "Full Year", color: "text-emerald-400 bg-emerald-500/10" },
              { icon: Truck, label: lang === "ar" ? "توصيل سريع" : "Fast Delivery", sub: lang === "ar" ? "لباب البيت" : "To your door", color: "text-blue-400 bg-blue-500/10" }
            ].map((item, i) => (
              <div key={i} className="glass rounded-2xl p-5 flex items-center gap-4 border border-white/5 shadow-lg">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-tight">{item.label}</div>
                  <div className="text-[10px] text-muted-foreground font-bold uppercase opacity-60 mt-0.5">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
