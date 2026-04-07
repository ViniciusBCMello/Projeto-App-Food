import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (id: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (id) => {
        const { items } = get();
        const existing = items.find((i) => i.id === id);

        if (existing) {
          set({
            items: items.map((i) =>
              i.id === id ? { ...i, quantity: i.quantity + 1 } : i,
            ),
          });
        } else {
          set({ items: [...items, { id, quantity: 1 }] });
        }
      },

      removeItem: (id) =>
        set({
          items: get().items.filter((i) => i.id !== id),
        }),

      updateQuantity: (id, quantity) =>
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i,
          ),
        }),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'mesa-verde-cart',
    },
  ),
);
