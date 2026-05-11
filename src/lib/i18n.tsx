import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Lang = "ar" | "en";
type Dict = Record<string, { ar: string; en: string }>;

const dict: Dict = {
  brand: { ar: "Pavilion", en: "Pavilion" },
  tagline: { ar: "متجر اللابتوبات وقطع الغيار", en: "Laptops & Spare Parts Store" },
  home: { ar: "الرئيسية", en: "Home" },
  shop: { ar: "المتجر", en: "Shop" },
  categories: { ar: "الأقسام", en: "Categories" },
  contact: { ar: "تواصل", en: "Contact" },
  admin: { ar: "الإدارة", en: "Admin" },
  search_placeholder: { ar: "ابحث عن لابتوب أو قطعة...", en: "Search laptops, parts..." },
  add_to_cart: { ar: "أضف للسلة", en: "Add to Cart" },
  buy_now: { ar: "اشتري الآن", en: "Buy Now" },
  in_stock: { ar: "متوفر", en: "In Stock" },
  out_of_stock: { ar: "غير متوفر", en: "Out of Stock" },
  iqd: { ar: "د.ع", en: "IQD" },
  price_range: { ar: "نطاق السعر", en: "Price Range" },
  brands: { ar: "العلامات التجارية", en: "Brands" },
  models: { ar: "الموديلات", en: "Models" },
  filters: { ar: "الفلاتر", en: "Filters" },
  clear: { ar: "مسح", en: "Clear" },
  no_results: { ar: "لا توجد نتائج", en: "No results" },
  hero_title: { ar: "أفضل اللابتوبات وقطع الغيار في بغداد", en: "Top Laptops & Spare Parts in Baghdad" },
  hero_sub: { ar: "تصاميم زجاجية، أسعار منافسة، توصيل سريع", en: "Glass UI, sharp prices, fast delivery" },
  shop_now: { ar: "تسوق الآن", en: "Shop Now" },
  location: { ar: "بغداد - شارع الصناعة (مقابل الجامعة التكنولوجية)", en: "Baghdad - Al-Sina'a St. (Opposite Univ. of Technology)" },
  phone: { ar: "هاتف", en: "Phone" },
  cart: { ar: "السلة", en: "Cart" },
  checkout: { ar: "إتمام الطلب", en: "Checkout" },
  name: { ar: "الاسم", en: "Name" },
  address: { ar: "العنوان", en: "Address" },
  notes: { ar: "ملاحظات", en: "Notes" },
  total: { ar: "الإجمالي", en: "Total" },
  empty_cart: { ar: "السلة فارغة", en: "Cart is empty" },
  order_success: { ar: "تم استلام طلبك بنجاح!", en: "Order placed!" },
  source: { ar: "مصدر الطلب", en: "Order source" },
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  products: { ar: "المنتجات", en: "Products" },
  orders: { ar: "الطلبات", en: "Orders" },
  visitors: { ar: "الزوار", en: "Visitors" },
  total_orders: { ar: "إجمالي الطلبات", en: "Total Orders" },
  revenue: { ar: "الإيرادات", en: "Revenue" },
  add_product: { ar: "إضافة منتج", en: "Add Product" },
  edit: { ar: "تعديل", en: "Edit" },
  delete: { ar: "حذف", en: "Delete" },
  save: { ar: "حفظ", en: "Save" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  login: { ar: "تسجيل الدخول", en: "Sign In" },
  logout: { ar: "خروج", en: "Sign Out" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  password: { ar: "كلمة المرور", en: "Password" },
  signup: { ar: "إنشاء حساب", en: "Sign Up" },
};

interface I18nCtx { lang: Lang; t: (k: keyof typeof dict) => string; setLang: (l: Lang) => void; dir: "rtl" | "ltr"; }
const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (saved === "ar" || saved === "en") setLang(saved);
  }, []);
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      localStorage.setItem("lang", lang);
    }
  }, [lang]);
  const t = (k: keyof typeof dict) => dict[k]?.[lang] ?? String(k);
  return (
    <I18nContext.Provider value={{ lang, t, setLang, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
