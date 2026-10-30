export interface Category {
  id: number;
  slug: string;
  name: string;
  children: { id: number; slug: string; name: string }[];
}

export interface Product {
  id: number;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  discountPercent: number;
  finalPriceCents: number;
  imageUrl: string;
  videoUrl: string | null;
  stock: number;
  featured: boolean;
  highlights: string[];
  soldCount: number;
  category: { id: number; slug: string; name: string };
  rating: number | null;
  reviewCount: number;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: "customer" | "admin";
}

export interface Cart {
  items: { product: Product; quantity: number; lineTotalCents: number }[];
  itemCount: number;
  subtotalCents: number;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: number;
  status: OrderStatus;
  recipientName: string | null;
  phone: string | null;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  couponCode: string | null;
  totalCents: number;
  shippingAddress: string;
  createdAt: string;
  items: { productId: number; name: string; slug: string; imageUrl: string; quantity: number; unitPriceCents: number }[];
  events: { status: OrderStatus; at: string }[];
}

export interface Quote {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  freeShippingThresholdCents: number;
  coupon: { code: string; description: string; percentOff: number } | null;
}

export interface Paged<T> {
  products: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Review {
  id: number;
  authorName: string;
  rating: number;
  comment: string;
  productId: number | null;
  productName: string | null;
  avatarUrl: string;
  createdAt: string;
}

export interface AdminStats {
  totals: { revenueCents: number; orders: number; customers: number; products: number };
  daily: { day: string; revenueCents: number; orders: number }[];
  revenueByCategory: { category: string; revenueCents: number }[];
  lowStock: { id: number; name: string; stock: number }[];
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

const TOKEN_KEY = "shopsphere.token";
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY)),
};

export async function api<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = tokenStore.get();
  const res = await fetch(`/api${path}`, {
    method: init.method ?? "GET",
    headers: {
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const firstIssue = Array.isArray(data.details) ? data.details[0]?.message : undefined;
    throw new ApiError(res.status, firstIssue ? `${data.error}: ${firstIssue}` : (data.error ?? res.statusText), data.details);
  }
  return data as T;
}

/** Resizes an Unsplash image URL; other URLs pass through unchanged. */
export function img(url: string, w: number, h = Math.round((w * 3) / 4)) {
  if (!url.startsWith("https://images.unsplash.com/")) return url;
  const u = new URL(url);
  u.searchParams.set("w", String(w));
  u.searchParams.set("h", String(h));
  return u.toString();
}

export const formatPrice = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
