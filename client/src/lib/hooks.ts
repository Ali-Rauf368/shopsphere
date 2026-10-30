import { useEffect, useState } from "react";
import type { Product } from "./api";

/** Sets the browser tab title for the current page. */
export function useTitle(title: string | undefined) {
  useEffect(() => {
    if (title) document.title = `${title} · ShopSphere`;
  }, [title]);
}

export function useDebounced<T>(value: T, ms = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

const RECENT_KEY = "shopsphere.recent";

/** Last few products the visitor opened, kept in localStorage. */
export const recentlyViewed = {
  get(): Product[] {
    try {
      return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    } catch {
      return [];
    }
  },
  push(p: Product) {
    try {
      const next = [p, ...recentlyViewed.get().filter((x) => x.id !== p.id)].slice(0, 8);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures: this is a convenience feature.
    }
  },
};
