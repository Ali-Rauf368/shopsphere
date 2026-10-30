import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokenStore, type Cart, type User } from "./api";

interface StoreValue {
  user: User | null;
  ready: boolean;
  cart: Cart | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshCart: () => Promise<void>;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  setQuantity: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

/** Session (JWT user) and server-side cart. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [ready, setReady] = useState(false);

  const refreshCart = useCallback(async () => {
    setCart(await api<Cart>("/cart"));
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    api<{ user: User }>("/auth/me")
      .then(({ user }) => {
        setUser(user);
        return refreshCart();
      })
      .catch(() => tokenStore.set(null))
      .finally(() => setReady(true));
  }, [refreshCart]);

  const startSession = async (res: { token: string; user: User }) => {
    tokenStore.set(res.token);
    setUser(res.user);
    await refreshCart();
  };

  const value: StoreValue = {
    user,
    ready,
    cart,
    login: async (email, password) => startSession(await api("/auth/login", { method: "POST", body: { email, password } })),
    signup: async (name, email, password) =>
      startSession(await api("/auth/signup", { method: "POST", body: { name, email, password } })),
    logout: () => {
      tokenStore.set(null);
      setUser(null);
      setCart(null);
    },
    refreshCart,
    addToCart: async (productId, quantity = 1) =>
      setCart(await api<Cart>("/cart/items", { method: "POST", body: { productId, quantity } })),
    setQuantity: async (productId, quantity) =>
      setCart(await api<Cart>(`/cart/items/${productId}`, { method: "PUT", body: { quantity } })),
    removeFromCart: async (productId) => setCart(await api<Cart>(`/cart/items/${productId}`, { method: "DELETE" })),
  };

  return <StoreContext value={value}>{children}</StoreContext>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
