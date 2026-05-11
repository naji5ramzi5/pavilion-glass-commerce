import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard, type Product } from "@/components/ProductCard";
import { FilterSidebar, type FilterState, type BrandOpt, type CatOpt } from "@/components/FilterSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/shop")({
  head: () => ({ meta: [{ title: "المتجر — Pavilion" }, { name: "description", content: "تصفح اللابتوبات وقطع الغيار" }] }),
  component: Shop,
});

function Shop() {
  const { t, lang } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<BrandOpt[]>([]);
  const [cats, setCats] = useState<CatOpt[]>([]);
  const [maxPrice, setMaxPrice] = useState(5000000);
  const [filters, setFilters] = useState<FilterState>({ q: "", brands: [], categories: [], price: [0, 5000000] });

  useEffect(() => {
    (async () => {
      const [p, b, c] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("brands").select("id,name,parent_id").order("name"),
        supabase.from("categories").select("id,name_ar,name_en").order("name_en"),
      ]);
      const prods = (p.data ?? []) as Product[];
      setProducts(prods);
      setBrands((b.data ?? []) as BrandOpt[]);
      setCats((c.data ?? []) as CatOpt[]);
      const max = Math.max(5000000, ...prods.map((x) => x.regular_price));
      setMaxPrice(max);
      setFilters((f) => ({ ...f, price: [0, max] }));
    })();
  }, []);

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
        <FilterSidebar filters={filters} onChange={setFilters} brands={brands} categories={cats} maxPrice={maxPrice} />
        <div>
          <div className="glass rounded-2xl px-4 py-3 mb-4 text-sm flex items-center justify-between">
            <span>{filtered.length} {lang === "ar" ? "منتج" : "products"}</span>
          </div>
          {filtered.length === 0 ? (
            <div className="glass rounded-2xl py-20 text-center text-muted-foreground">{t("no_results")}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
