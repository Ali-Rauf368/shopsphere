import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokenStore, type Cart, type Product, type User } from "./api";
import { useToast } from "./toast";

interface StoreValue {
  user: User | null;
  ready: boolean;
  cart: Cart | null;
  wishlist: Set<number>;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (u: User) => void;
  refreshCart: () => Promise<void>;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  setQuantity: (productId: number, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  toggleWishlist: (product: Product) => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

/** Session (JWT user), server-side cart and wishlist, plus the cart drawer's open state. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const [cartOpen, setCartOpen] = useState(false);
  const [ready, setReady] = useState(false);

  const refreshCart = useCallback(async () => {
    setCart(await api<Cart>("/cart"));
  }, []);
  const loadWishlist = useCallback(async () => {
    const { products } = await api<{ products: Product[] }>("/wishlist");
    setWishlist(new Set(products.map((p) => p.id)));
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) {
      setReady(true);
      return;
    }
    api<{ user: User }>("/auth/me")
      .then(({ user }) => {
        setUser(user);
        return Promise.all([refreshCart(), loadWishlist()]);
      })
      .catch(() => tokenStore.set(null))
      .finally(() => setReady(true));
  }, [refreshCart, loadWishlist]);

  const startSession = async (res: { token: string; user: User }) => {
    tokenStore.set(res.token);
    setUser(res.user);
    await Promise.all([refreshCart(), loadWishlist()]);
  };

  const value: StoreValue = {
    user,
    ready,
    cart,
    wishlist,
    cartOpen,
    setCartOpen,
    setUser,
    login: async (email, password) => startSession(await api("/auth/login", { method: "POST", body: { email, password } })),
    signup: async (name, email, password) =>
      startSession(await api("/auth/signup", { method: "POST", body: { name, email, password } })),
    logout: () => {
      tokenStore.set(null);
      setUser(null);
      setCart(null);
      setWishlist(new Set());
      toast({ kind: "info", title: "You've been logged out" });
    },
    refreshCart,
    addToCart: async (product, quantity = 1) => {
      setCart(await api<Cart>("/cart/items", { method: "POST", body: { productId: product.id, quantity } }));
      toast({
        kind: "success",
        title: "Added to your bag",
        body: quantity > 1 ? `${quantity} × ${product.name}` : product.name,
        image: product.imageUrl,
        action: { label: "View bag", onClick: () => setCartOpen(true) },
      });
    },
    setQuantity: async (productId, quantity) =>
      setCart(await api<Cart>(`/cart/items/${productId}`, { method: "PUT", body: { quantity } })),
    removeFromCart: async (productId) => setCart(await api<Cart>(`/cart/items/${productId}`, { method: "DELETE" })),
    toggleWishlist: async (product) => {
      const saved = wishlist.has(product.id);
      const { products } = await api<{ products: Product[] }>(`/wishlist/${product.id}`, { method: saved ? "DELETE" : "PUT" });
      setWishlist(new Set(products.map((p) => p.id)));
      toast({ kind: saved ? "info" : "success", title: saved ? "Removed from wishlist" : "Saved to wishlist", body: product.name });
    },
  };

  return <StoreContext value={value}>{children}</StoreContext>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
