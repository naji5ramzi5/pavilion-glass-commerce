import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard, type Product } from "@/components/ProductCard";
import { FilterSidebar, type FilterState, type BrandOpt, type CatOpt } from "@/components/FilterSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { SlidersHorizontal, X } from "lucide-react";

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [{ title: "المتجر — Pavilion" }, { name: "description", content: "تصفح اللابتوبات وقطع الغيار" }] }),
  component: Shop,
});

import { useDataStore } from "@/lib/data-store";

function Shop() {
  const { t, lang } = useI18n();
  const { products: storeProducts, brands, categories: cats, loadingShop: loading, fetchShopData } = useDataStore();
  const [maxPrice, setMaxPrice] = useState(5000000);
  const [filters, setFilters] = useState<FilterState>({ q: "", brands: [], categories: [], price: [0, 5000000] });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const products = useMemo(() => {
    return storeProducts.map(x => ({
      ...x,
      regular_price: Number(x.regular_price) || 0,
      sale_price: x.sale_price ? (Number(x.sale_price) || null) : null
    })) as Product[];
  }, [storeProducts]);

  useEffect(() => {
    fetchShopData();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map((x) => x.regular_price).filter(price => !isNaN(price) && price > 0);
      const max = prices.reduce((maxVal, p) => p > maxVal ? p : maxVal, 5000000);
      setMaxPrice(max);
      setFilters((f) => ({ ...f, price: [0, max] }));
    }
  }, [products]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !(`${p.name_ar} ${p.name_en} ${p.sku ?? ""}`.toLowerCase().includes(q))) return false;
      const price = p.sale_price ?? p.regular_price;
      if (price < filters.price[0] || price > filters.price[1]) return false;
      if (filters.categories.length && !filters.categories.includes((p as any).category_id)) return false;
      if (filters.brands.length) {
        const bid = (p as any).brand_id;
        const mid = (p as any).model_id;
        if (!filters.brands.includes(bid) && !filters.brands.includes(mid)) return false;
      }
      return true;
    });
  }, [products, filters]);

  return (
    <Layout>
      <div className="grid lg:grid-cols-[280px_1fr] gap-5">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <FilterSidebar filters={filters} onChange={setFilters} brands={brands} categories={cats} maxPrice={maxPrice} />
        </div>

        <div>
          <div className="glass rounded-2xl px-4 py-3 mb-4 text-sm flex items-center justify-between gap-4">
            <span className="font-bold">
              {loading ? "..." : `${filtered.length} ${lang === "ar" ? "منتج" : "products"}`}
            </span>
            
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-primary-glow hover:bg-primary/20 active:scale-95 transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" /> {lang === "ar" ? "الفلاتر" : "Filters"}
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="product-card group animate-pulse">
                  <div className="relative aspect-[4/3] bg-white/5" />
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <div className="h-4 bg-white/10 rounded-md w-3/4" />
                    <div className="h-4 bg-white/10 rounded-md w-1/2" />
                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/5">
                      <div className="w-11 h-11 rounded-xl bg-white/5" />
                      <div className="w-11 h-11 rounded-xl bg-white/5" />
                      <div className="flex-1 h-11 rounded-xl bg-white/5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass rounded-2xl py-20 text-center text-muted-foreground">{t("no_results")}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer Overlay */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsFilterOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="relative w-80 max-w-[85vw] h-full bg-background border-s border-white/5 shadow-2xl flex flex-col p-6 animate-in slide-in-from-left duration-300 overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <h3 className="font-black text-lg gradient-text">{lang === "ar" ? "تصفية المنتجات" : "Filter Products"}</h3>
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <FilterSidebar 
              filters={filters} 
              onChange={setFilters} 
              brands={brands} 
              categories={cats} 
              maxPrice={maxPrice}
              isMobile={true}
              onClose={() => setIsFilterOpen(false)}
            />
          </div>
        </div>
      )}
    </Layout>
  );
}
