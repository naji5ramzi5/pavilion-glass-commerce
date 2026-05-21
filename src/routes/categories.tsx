import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import catLaptops from "@/assets/cat-laptops.png";
import catParts from "@/assets/cat-parts.png";
import catAccs from "@/assets/cat-accs.png";

export const Route = createFileRoute("/categories")({
  head: () => ({ meta: [{ title: "الأقسام — Pavilion" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { lang, t } = useI18n();
  const [cats, setCats] = useState<any[]>([]);
  
  useEffect(() => { 
    supabase.from("categories").select("*").order("name_en").then(({ data }) => setCats(data ?? [])); 
  }, []);

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
      <h1 className="text-3xl font-bold mb-6">{t("categories")}</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cats.map((c) => (
          <Link key={c.id} to={`/shop?category=${c.id}`}
            className="glass rounded-2xl p-6 flex flex-col items-center gap-4 hover:glass-strong hover:-translate-y-1 transition group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center transition">
              <img src={getCatImg(c)} alt={c.name_en} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="font-semibold text-center">{lang === "ar" ? c.name_ar : c.name_en}</span>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
