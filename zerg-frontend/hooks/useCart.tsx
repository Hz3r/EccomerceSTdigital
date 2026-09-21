"use client";

import { useState, useEffect, useCallback, createContext, useContext, useReducer } from "react";
import type { CartItem, Plan, Product } from "@/types";

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; plan: Plan; product: Product }
  | { type: "REMOVE_ITEM"; planId: string }
  | { type: "UPDATE_QUANTITY"; planId: string; cantidad: number }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.planId === action.plan.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.planId === action.plan.id
              ? { ...i, cantidad: i.cantidad + 1 }
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
            cantidad: 1,
          },
        ],
      };
    }
    case "REMOVE_ITEM":
      return {
        items: state.items.filter((i) => i.planId !== action.planId),
      };
    case "UPDATE_QUANTITY":
      if (action.cantidad <= 0) {
        return {
          items: state.items.filter((i) => i.planId !== action.planId),
        };
      }
      return {
        items: state.items.map((i) =>
          i.planId === action.planId
            ? { ...i, cantidad: action.cantidad }
            : i
        ),
      };
    case "CLEAR_CART":
      return { items: [] };
    case "LOAD_CART":
      return { items: action.items };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (plan: Plan, product: Product) => void;
  removeItem: (planId: string) => void;
  updateQuantity: (planId: string, cantidad: number) => void;
  clearCart: () => void;
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

  const addItem = useCallback((plan: Plan, product: Product) => {
    dispatch({ type: "ADD_ITEM", plan, product });
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
