import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  category: string;
  subCategory: string;
  subCategoryName: string;
  pricePerKg: number;
  estimatedWeight: number | null;
  notes: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  getTotalEstimate: () => number;
  getItemEstimate: (id: string) => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        const id = `${item.category}-${item.subCategory}-${Date.now()}`;
        set((state) => ({
          items: [...state.items, { ...item, id }]
        }));
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id)
        }));
      },
      
      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          )
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotalEstimate: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          if (item.estimatedWeight && item.estimatedWeight > 0) {
            return total + item.estimatedWeight * item.pricePerKg;
          }
          return total;
        }, 0);
      },

      getItemEstimate: (id: string) => {
        const { items } = get();
        const item = items.find((i) => i.id === id);
        if (item && item.estimatedWeight && item.estimatedWeight > 0) {
          return item.estimatedWeight * item.pricePerKg;
        }
        return 0;
      }
    }),
    {
      name: 'scrapy5-cart',
    }
  )
);
