import { create } from "zustand";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  qty: number;
}

interface CartStore {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
}

const STORAGE_KEY = "pavilion_cart";

const load = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
};
const save = (items: CartItem[]) => {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const useCart = create<CartStore>((set, get) => ({
  items: load(),
  add: (item) => set((s) => {
    const existing = s.items.find((i) => i.id === item.id);
    const next = existing
      ? s.items.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      : [...s.items, { ...item, qty: 1 }];
    save(next); return { items: next };
  }),
  remove: (id) => set((s) => { const next = s.items.filter((i) => i.id !== id); save(next); return { items: next }; }),
  setQty: (id, qty) => set((s) => {
    const next = s.items.map((i) => i.id === id ? { ...i, qty: Math.max(1, qty) } : i);
    save(next); return { items: next };
  }),
  clear: () => { save([]); set({ items: [] }); },
  total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
  count: () => get().items.reduce((s, i) => s + i.qty, 0),
}));
