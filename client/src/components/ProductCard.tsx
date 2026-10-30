import { Heart, Plus, ShoppingBag, Star } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { img, type Product } from "../lib/api";
import { useStore } from "../lib/store";
import { useToast } from "../lib/toast";
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
      className={`grid size-9 cursor-pointer place-items-center rounded-full bg-card/90 text-ink transition hover:text-brand-600 ${className}`}
    >
      <Heart key={pop} className={`size-[18px] ${pop ? "animate-pop" : ""} ${saved ? "fill-brand-500 text-brand-500" : ""}`} />
    </button>
  );
}

export function AddToCartButton({ product, quantity = 1, compact, className = "" }: { product: Product; quantity?: number; compact?: boolean; className?: string }) {
  const { addToCart } = useStore();
  const toast = useToast();
  const guard = useRequireLogin();
  const [busy, setBusy] = useState(false);

  if (product.stock === 0) {
    return <span className={`block rounded-lg bg-soft py-2.5 text-center text-sm font-medium text-ink-3 ${compact ? "hidden" : ""} ${className}`}>Sold out</span>;
  }
  return (
    <button
      disabled={busy}
      onClick={guard(async () => {
        setBusy(true);
        try {
          await addToCart(product, quantity);
        } catch (e) {
          toast({ kind: "error", title: "Couldn't add that", body: (e as Error).message });
        } finally {
          setBusy(false);
        }
      })}
      className={`flex cursor-pointer items-center justify-center gap-2 text-sm font-medium transition active:scale-[0.98] disabled:opacity-60 ${compact ? "size-9 rounded-full bg-ink text-page hover:bg-brand-600" : "w-full rounded-lg bg-ink py-2.5 text-page hover:bg-ink/85"} ${className}`}
      aria-label={compact ? `Add ${product.name} to bag` : undefined}
    >
      {compact ? <Plus className="size-5" /> : <><ShoppingBag className="size-4" /> Add to bag</>}
    </button>
  );
}

export function ProductCard({ product: p }: { product: Product }) {
  return (
    <article className="group relative flex flex-col" data-testid="product-card">
      <div className="relative overflow-hidden rounded-lg bg-soft">
        <Link to={`/product/${p.slug}`} className="block aspect-[4/5]" tabIndex={-1}>
          <img src={img(p.imageUrl, 600, 750)} alt={p.name} loading="lazy" className={`size-full object-cover transition duration-700 group-hover:scale-[1.03] ${p.stock === 0 ? "opacity-50 grayscale" : ""}`} />
        </Link>
        {p.discountPercent > 0 && <span className="absolute start-3 top-3 rounded bg-card px-1.5 py-0.5 text-xs font-medium text-brand-700 dark:text-brand-400">−{p.discountPercent}%</span>}
        <WishlistButton product={p} className="absolute end-3 top-3" />
        <div className="absolute end-3 bottom-3 transition md:translate-y-2 md:opacity-0 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100">
          <AddToCartButton product={p} compact />
        </div>
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-sans text-[15px] leading-snug font-medium">
            <Link to={`/product/${p.slug}`} className="hover:underline hover:underline-offset-2">{p.name}</Link>
          </h3>
          <Price cents={p.finalPriceCents} was={p.priceCents} />
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-3">
          {p.category.name}
          {p.rating !== null && <><span aria-hidden>·</span><Star className="size-3 fill-current" aria-hidden /> <span aria-label={`${p.rating} out of 5 stars`}>{p.rating.toFixed(1)}</span></>}
          {p.stock > 0 && p.stock < 10 && <><span aria-hidden>·</span><span className="text-brand-700 dark:text-brand-400">{p.stock} left</span></>}
          {p.stock === 0 && <><span aria-hidden>·</span><span>Sold out</span></>}
        </p>
      </div>
    </article>
  );
}

export function ProductGrid({ products, loading, count = 8, cols = 4 }: { products?: Product[]; loading?: boolean; count?: number; cols?: 3 | 4 }) {
  const grid = cols === 3 ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 lg:grid-cols-4";
  return (
    <div className={`grid gap-x-5 gap-y-10 ${grid}`}>
      {loading || !products
        ? Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)
        : products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
