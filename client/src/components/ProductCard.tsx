import { Heart, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { img, type Product } from "../lib/api";
import { useStore } from "../lib/store";
import { useToast } from "../lib/toast";
import { Stars } from "./Stars";
import { Price, ProductCardSkeleton } from "./ui";

/** Redirects anonymous visitors to log in, then returns them here. */
export function useRequireLogin() {
  const { user } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  return (fn: () => Promise<void>) => async () => {
    if (!user) return navigate("/login", { state: { from: location.pathname + location.search } });
    await fn();
  };
}

export function WishlistButton({ product, className = "" }: { product: Product; className?: string }) {
  const { wishlist, toggleWishlist } = useStore();
  const guard = useRequireLogin();
  const saved = wishlist.has(product.id);
  const [pop, setPop] = useState(0);
  return (
    <button
      onClick={guard(async () => {
        setPop((n) => n + 1);
        await toggleWishlist(product);
      })}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      className={`grid size-9 cursor-pointer place-items-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur transition hover:scale-110 hover:text-rose-600 ${className}`}
    >
      <Heart key={pop} className={`size-[18px] ${pop ? "animate-pop" : ""} ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
    </button>
  );
}

export function AddToCartButton({ product, quantity = 1, compact, className = "" }: { product: Product; quantity?: number; compact?: boolean; className?: string }) {
  const { addToCart } = useStore();
  const toast = useToast();
  const guard = useRequireLogin();
  const [busy, setBusy] = useState(false);

  if (product.stock === 0) {
    return <span className={`block rounded-xl bg-soft py-2.5 text-center text-sm font-medium text-ink-3 ${className}`}>Sold out</span>;
  }
  return (
    <button
      disabled={busy}
      onClick={guard(async () => {
        setBusy(true);
        try {
          await addToCart(product, quantity);
        } catch (e) {
          toast({ kind: "error", title: "Couldn't add to cart", body: (e as Error).message });
        } finally {
          setBusy(false);
        }
      })}
      className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 active:scale-[0.98] disabled:opacity-60 ${compact ? "size-10" : "w-full py-2.5"} ${className}`}
      aria-label={compact ? `Add ${product.name} to cart` : undefined}
    >
      {compact ? <Plus className="size-5" /> : <><ShoppingCart className="size-4" /> Add to cart</>}
    </button>
  );
}

export function ProductCard({ product: p }: { product: Product }) {
  const badges = [
    p.discountPercent > 0 && <span key="sale" className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">−{p.discountPercent}%</span>,
    p.soldCount >= 8 && <span key="best" className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-900">Bestseller</span>,
    p.stock > 0 && p.stock < 10 && <span key="low" className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-amber-700">Only {p.stock} left</span>,
  ].filter(Boolean);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-card transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5" data-testid="product-card">
      <Link to={`/product/${p.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-soft">
        <img src={img(p.imageUrl, 600)} alt={p.name} loading="lazy" className={`size-full object-cover transition duration-500 group-hover:scale-105 ${p.stock === 0 ? "opacity-50 grayscale" : ""}`} />
        <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">{badges}</div>
      </Link>
      <WishlistButton product={p} className="absolute end-3 top-3" />
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs font-semibold tracking-wide text-brand-600 uppercase dark:text-brand-400">{p.category.name}</p>
        <h3 className="mt-1 leading-snug font-semibold">
          <Link to={`/product/${p.slug}`} className="hover:text-brand-600 dark:hover:text-brand-400">{p.name}</Link>
        </h3>
        <div className="mt-1.5 flex h-4 items-center gap-1.5 text-xs text-ink-3">
          {p.rating !== null && <><Stars value={p.rating} size={13} /> <span>{p.rating.toFixed(1)} ({p.reviewCount})</span></>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <Price cents={p.finalPriceCents} was={p.priceCents} />
          <AddToCartButton product={p} compact />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, loading, count = 8, cols = 4 }: { products?: Product[]; loading?: boolean; count?: number; cols?: 3 | 4 }) {
  const grid = cols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  return (
    <div className={`grid gap-5 ${grid}`}>
      {loading || !products
        ? Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)
        : products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
