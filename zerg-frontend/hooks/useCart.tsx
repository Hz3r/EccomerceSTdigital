"use client";

import { useState, useEffect, useCallback, createContext, useContext, useReducer } from "react";
import type { CartItem, Plan, Product } from "@/types";
import { CURRENCY, itemsValue, toItem, track } from "@/lib/analytics";

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; plan: Plan; product: Product; cantidad: number }
  | { type: "REMOVE_ITEM"; planId: string }
  | { type: "UPDATE_QUANTITY"; planId: string; cantidad: number }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; items: CartItem[] }
  | { type: "RESTORE_ITEMS"; items: CartItem[] };

export const MAX_QUANTITY = 99;

export function clampQuantity(cantidad: number) {
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(cantidad) || 1));
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.planId === action.plan.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.planId === action.plan.id
              ? { ...i, cantidad: clampQuantity(i.cantidad + action.cantidad) }
              : i
          ),
        };
      }
      return {
        items: [
          ...state.items,
          {
            planId: action.plan.id,
            plan: action.plan,
            producto: action.product,
            cantidad: clampQuantity(action.cantidad),
          },
        ],
      };
    }
    case "REMOVE_ITEM":
      return {
        items: state.items.filter((i) => i.planId !== action.planId),
      };
    case "UPDATE_QUANTITY": {
      // La cantidad va de 1 a MAX_QUANTITY: para quitar un producto se usa REMOVE_ITEM (botón eliminar).
      const cantidad = clampQuantity(action.cantidad);
      return {
        items: state.items.map((i) =>
          i.planId === action.planId
            ? { ...i, cantidad }
            : i
        ),
      };
    }
    case "CLEAR_CART":
      return { items: [] };
    case "RESTORE_ITEMS": {
      // Productos de un pedido cancelado que vuelven al carrito: si ya estaban, se queda la cantidad mayor
      // (no se suman, para no duplicar si el carrito ya tenía lo mismo).
      const items = [...state.items];
      for (const r of action.items) {
        const i = items.findIndex((x) => x.planId === r.planId);
        if (i === -1) items.push({ ...r, cantidad: clampQuantity(r.cantidad) });
        else items[i] = { ...items[i], cantidad: clampQuantity(Math.max(items[i].cantidad, r.cantidad)) };
      }
      return { items };
    }
    case "LOAD_CART":
      // Un carrito guardado antes podría traer cantidades fuera de rango
      return { items: action.items.map((i) => ({ ...i, cantidad: clampQuantity(i.cantidad) })) };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  /** Suma `cantidad` (1 por defecto) al carrito y lo registra en Analytics (add_to_cart). */
  addItem: (plan: Plan, product: Product, cantidad?: number) => void;
  removeItem: (planId: string) => void;
  updateQuantity: (planId: string, cantidad: number) => void;
  clearCart: () => void;
  /** Regresa al carrito los productos de un pedido cancelado (sin contarlo como "añadir al carrito"). */
  restoreItems: (items: CartItem[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (saved) {
        dispatch({ type: "LOAD_CART", items: JSON.parse(saved) });
      }
    } catch {}
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("cart", JSON.stringify(state.items));
    }
  }, [state.items, isLoaded]);

  const addItem = useCallback((plan: Plan, product: Product, cantidad = 1) => {
    dispatch({ type: "ADD_ITEM", plan, product, cantidad });
    const item = toItem(product, plan, cantidad);
    track("add_to_cart", { currency: CURRENCY, value: itemsValue([item]), items: [item] });
  }, []);

  const removeItem = useCallback((planId: string) => {
    dispatch({ type: "REMOVE_ITEM", planId });
  }, []);

  const updateQuantity = useCallback((planId: string, cantidad: number) => {
    dispatch({ type: "UPDATE_QUANTITY", planId, cantidad });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const restoreItems = useCallback((items: CartItem[]) => {
    dispatch({ type: "RESTORE_ITEMS", items });
  }, []);

  const totalItems = state.items.reduce((sum, i) => sum + i.cantidad, 0);
  const totalPrice = state.items.reduce(
    (sum, i) => sum + i.plan.precio * i.cantidad,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        restoreItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
