import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export type CartAddon = { name: string; price: number };

export type CartItem = {
  cartId: string;             // uuid-ish, local only
  menuItemId: string;
  name: string;
  unitPrice: number;          // price after variant adjustments
  quantity: number;
  variant?: string | null;
  addons: CartAddon[];
  removed: string[];
  instructions?: string;
  image?: string;
  isVeg: boolean;
};

export type TableSession = {
  restaurantId: string;
  restaurantName: string;
  tableId?: string;
  tableNumber?: number;
};

type CartState = {
  session: TableSession | null;
  items: CartItem[];
  promoCode: string | null;
  discountAmount: number;
  pointsToRedeem: number;
  tipAmount: number;
  specialInstructions: string;

  startSession: (session: TableSession) => void;
  endSession: () => void;

  addItem: (item: Omit<CartItem, "cartId">) => void;
  updateQuantity: (cartId: string, qty: number) => void;
  removeItem: (cartId: string) => void;
  setInstructions: (cartId: string, instructions: string) => void;
  clearCart: () => void;

  applyPromo: (code: string | null, discountAmount: number) => void;
  setPoints: (points: number) => void;
  setTip: (amount: number) => void;
  setSpecialInstructions: (text: string) => void;

  subtotal: () => number;
  count: () => number;
};

const webStorage = {
  getItem: (name: string) => Promise.resolve(typeof window !== "undefined" ? window.localStorage.getItem(name) : null),
  setItem: (name: string, value: string) => Promise.resolve(typeof window !== "undefined" ? window.localStorage.setItem(name, value) : undefined),
  removeItem: (name: string) => Promise.resolve(typeof window !== "undefined" ? window.localStorage.removeItem(name) : undefined),
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      session: null,
      items: [],
      promoCode: null,
      discountAmount: 0,
      pointsToRedeem: 0,
      tipAmount: 0,
      specialInstructions: "",

      startSession: (session) => {
        const current = get().session;
        // Switching restaurants wipes the cart.
        if (current && current.restaurantId !== session.restaurantId) {
          set({ items: [], promoCode: null, discountAmount: 0, pointsToRedeem: 0, tipAmount: 0, specialInstructions: "" });
        }
        set({ session });
      },
      endSession: () => set({ session: null, items: [], promoCode: null, discountAmount: 0, pointsToRedeem: 0, tipAmount: 0, specialInstructions: "" }),

      addItem: (item) => {
        const cartId = `${item.menuItemId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({ items: [...s.items, { ...item, cartId }] }));
      },
      updateQuantity: (cartId, qty) => {
        if (qty <= 0) return get().removeItem(cartId);
        set((s) => ({ items: s.items.map((i) => (i.cartId === cartId ? { ...i, quantity: qty } : i)) }));
      },
      removeItem: (cartId) => set((s) => ({ items: s.items.filter((i) => i.cartId !== cartId) })),
      setInstructions: (cartId, instructions) =>
        set((s) => ({ items: s.items.map((i) => (i.cartId === cartId ? { ...i, instructions } : i)) })),
      clearCart: () => set({ items: [], promoCode: null, discountAmount: 0, pointsToRedeem: 0, tipAmount: 0, specialInstructions: "" }),

      applyPromo: (code, discountAmount) => set({ promoCode: code, discountAmount }),
      setPoints: (points) => set({ pointsToRedeem: Math.max(0, points) }),
      setTip: (tipAmount) => set({ tipAmount }),
      setSpecialInstructions: (specialInstructions) => set({ specialInstructions }),

      subtotal: () => {
        const items = get().items;
        return items.reduce((sum, i) => {
          const addons = i.addons.reduce((s2, a) => s2 + (a.price || 0), 0);
          return sum + (i.unitPrice + addons) * i.quantity;
        }, 0);
      },
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "dime-cart",
      storage: createJSONStorage(() => (Platform.OS === "web" ? (webStorage as never) : AsyncStorage)),
    }
  )
);
