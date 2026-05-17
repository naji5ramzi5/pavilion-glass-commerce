import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Search, X } from "lucide-react";

export interface FilterState {
  q: string;
  brands: string[];
  categories: string[];
  price: [number, number];
}

export interface BrandOpt { id: string; name_ar: string; name_en: string; parent_id?: string | null; }
export interface CatOpt { id: string; name_ar: string; name_en: string; }

interface Props {
  filters: FilterState;
  onChange: (f: FilterState) => void;
  brands: BrandOpt[];
  categories: CatOpt[];
  maxPrice: number;
}

export function FilterSidebar({ filters, onChange, brands, categories, maxPrice }: Props) {
  const { t, lang } = useI18n();
  const [local, setLocal] = useState(filters);
  useEffect(() => setLocal(filters), [filters]);

  const toggle = (arr: string[], id: string) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];

  const parents = brands.filter((b) => !b.parent_id);
  const childrenOf = (pid: string) => brands.filter((b) => b.parent_id === pid);

  return (
    <aside className="glass-strong rounded-2xl p-5 space-y-6 sticky top-28 self-start">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">{t("filters")}</h3>
        <button onClick={() => onChange({ q: "", brands: [], categories: [], price: [0, maxPrice] })}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <X className="w-3 h-3" /> {t("clear")}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
        <input
          id="filter-search"
          name="search"
          type="search"
          autoComplete="off"
          value={local.q}
          onChange={(e) => { const v = { ...local, q: e.target.value }; setLocal(v); onChange(v); }}
          placeholder={t("search_placeholder")}
          className="w-full glass rounded-xl ps-10 pe-3 py-2.5 text-sm bg-transparent outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">{t("price_range")}</label>
        <div className="flex gap-2">
          <input id="filter-price-min" name="price_min" type="number" autoComplete="off" value={local.price[0]} min={0} max={local.price[1]}
            onChange={(e) => { const v = { ...local, price: [Number(e.target.value), local.price[1]] as [number, number] }; setLocal(v); onChange(v); }}
            className="flex-1 glass rounded-lg px-2 py-1.5 text-xs bg-transparent outline-none" />
          <input id="filter-price-max" name="price_max" type="number" autoComplete="off" value={local.price[1]} min={local.price[0]}
            onChange={(e) => { const v = { ...local, price: [local.price[0], Number(e.target.value)] as [number, number] }; setLocal(v); onChange(v); }}
            className="flex-1 glass rounded-lg px-2 py-1.5 text-xs bg-transparent outline-none" />
        </div>
        <input id="filter-price-range" name="price_range" type="range" min={0} max={maxPrice} step={Math.max(1000, Math.floor(maxPrice / 100))}
          value={local.price[1]}
          onChange={(e) => { const v = { ...local, price: [local.price[0], Number(e.target.value)] as [number, number] }; setLocal(v); onChange(v); }}
          className="w-full accent-primary" />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">{t("categories")}</label>
        <div className="space-y-1.5 max-h-44 overflow-y-auto pe-1">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary-glow">
              <input type="checkbox" checked={local.categories.includes(c.id)}
                onChange={() => { const v = { ...local, categories: toggle(local.categories, c.id) }; setLocal(v); onChange(v); }}
                className="accent-primary" />
              {lang === "ar" ? c.name_ar : c.name_en}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold">{t("brands")}</label>
        <div className="space-y-2 max-h-72 overflow-y-auto pe-1">
          {parents.map((p) => (
            <div key={p.id}>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={local.brands.includes(p.id)}
                  onChange={() => { const v = { ...local, brands: toggle(local.brands, p.id) }; setLocal(v); onChange(v); }}
                  className="accent-primary" />
                <span className="font-medium">{lang === "ar" ? p.name_ar : p.name_en}</span>
              </label>
              {childrenOf(p.id).length > 0 && local.brands.includes(p.id) && (
                <div className="ms-5 mt-1 space-y-1">
                  {childrenOf(p.id).map((ch) => (
                    <label key={ch.id} className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <input type="checkbox" checked={local.brands.includes(ch.id)}
                        onChange={() => { const v = { ...local, brands: toggle(local.brands, ch.id) }; setLocal(v); onChange(v); }}
                        className="accent-primary" />
                      {lang === "ar" ? ch.name_ar : ch.name_en}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
