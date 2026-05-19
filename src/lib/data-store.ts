import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";

interface DataState {
  products: any[];
  categories: any[];
  banners: any[];
  brands: any[];
  loadingHome: boolean;
  loadingShop: boolean;
  fetchedHome: boolean;
  fetchedShop: boolean;
  fetchHomeData: (force?: boolean) => Promise<void>;
  fetchShopData: (force?: boolean) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  products: [],
  categories: [],
  banners: [],
  brands: [],
  loadingHome: false,
  loadingShop: false,
  fetchedHome: false,
  fetchedShop: false,

  fetchHomeData: async (force = false) => {
    const state = get();
    if (state.fetchedHome && !force) {
      // Background refetch silently
      Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }).limit(8),
        supabase.from("categories").select("*").limit(6),
        supabase.from("banners").select("*").eq("active", true).order("order_index", { ascending: true })
      ]).then(([p, c, b]) => {
        set({
          products: p.data ?? [],
          categories: c.data ?? [],
          banners: b.data ?? []
        });
      }).catch(err => console.error("Silent home refetch error:", err));
      return;
    }

    set({ loadingHome: true });
    try {
      const [p, c, b] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }).limit(8),
        supabase.from("categories").select("*").limit(6),
        supabase.from("banners").select("*").eq("active", true).order("order_index", { ascending: true })
      ]);
      set({
        products: p.data ?? [],
        categories: c.data ?? [],
        banners: b.data ?? [],
        fetchedHome: true,
        loadingHome: false
      });
    } catch (e) {
      console.error("fetchHomeData error:", e);
      set({ loadingHome: false });
    }
  },

  fetchShopData: async (force = false) => {
    const state = get();
    if (state.fetchedShop && !force) {
      // Background refetch silently
      Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("brands").select("id,name_ar,name_en,parent_id").order("name_en"),
        supabase.from("categories").select("id,name_ar,name_en").order("name_en"),
      ]).then(([p, b, c]) => {
        set({
          products: p.data ?? [],
          brands: b.data ?? [],
          categories: c.data ?? []
        });
      }).catch(err => console.error("Silent shop refetch error:", err));
      return;
    }

    set({ loadingShop: true });
    try {
      const [p, b, c] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("brands").select("id,name_ar,name_en,parent_id").order("name_en"),
        supabase.from("categories").select("id,name_ar,name_en").order("name_en"),
      ]);
      set({
        products: p.data ?? [],
        brands: b.data ?? [],
        categories: c.data ?? [],
        fetchedShop: true,
        loadingShop: false
      });
    } catch (e) {
      console.error("fetchShopData error:", e);
      set({ loadingShop: false });
    }
  }
}));
