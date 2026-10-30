import { Check, ChevronRight, Minus, Plus, RotateCcw, Share2, ShieldCheck, Star, Truck } from "lucide-react";
import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { Link, useParams } from "react-router";
import { AddToCartButton, ProductGrid, WishlistButton } from "../components/ProductCard";
import { Stars } from "../components/Stars";
import { Button, Card, ErrorBox, Price, Skeleton } from "../components/ui";
import { api, img, type Product, type Review } from "../lib/api";
import { recentlyViewed, useTitle } from "../lib/hooks";
import { useStore } from "../lib/store";
import { useToast } from "../lib/toast";
import { useApi } from "../lib/useApi";

/** Image that zooms toward the cursor on hover. */
function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [origin, setOrigin] = useState<string | null>(null);
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };
  return (
    <div className="aspect-[4/5] cursor-zoom-in overflow-hidden rounded-xl bg-soft lg:aspect-[5/6]" onMouseMove={onMove} onMouseLeave={() => setOrigin(null)}>
      <img src={src} alt={alt} className="size-full object-cover transition-transform duration-200" style={{ transform: origin ? "scale(1.8)" : "none", transformOrigin: origin ?? "center" }} />
    </div>
  );
}

function deliveryWindow() {
  const fmt = (d: number) => new Date(Date.now() + d * 86_400_000).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return `${fmt(2)} – ${fmt(4)}`;
}

function RatingSummary({ reviews }: { reviews: Review[] }) {
  const avg = reviews.reduce((n, r) => n + r.rating, 0) / reviews.length;
  return (
    <div className="flex items-center gap-6">
      <div className="text-center">
        <p className="font-display text-5xl font-medium">{avg.toFixed(1)}</p>
        <Stars value={avg} size={14} />
        <p className="mt-1 text-xs text-ink-3">{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((n) => {
          const count = reviews.filter((r) => r.rating === n).length;
          return (
            <div key={n} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-ink-2">{n}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full bg-ink" style={{ width: `${(count / reviews.length) * 100}%` }} /></div>
              <span className="w-4 text-end text-ink-3">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewForm({ productId, onDone }: { productId: number; onDone: () => void }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rating) return toast({ kind: "error", title: "Pick a star rating first" });
    setBusy(true);
    try {
      await api("/reviews", { method: "POST", body: { productId, rating, comment } });
      setComment("");
      setRating(0);
      toast({ kind: "success", title: "Thanks for your review!" });
      onDone();
    } catch (err) {
      toast({ kind: "error", title: "Review not posted", body: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="p-5">
      <form onSubmit={submit} className="space-y-3">
        <p className="font-semibold">Write a review</p>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} className="cursor-pointer transition hover:scale-110" aria-label={`${n} stars`} aria-pressed={rating === n}>
              <Star className={`size-7 ${n <= (hover || rating) ? "fill-ink text-ink" : "text-ink-3/40"}`} />
            </button>
          ))}
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} required minLength={3} rows={3} placeholder="What did you think?" className="w-full rounded-xl border border-line bg-card p-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
        <Button busy={busy}>Submit</Button>
      </form>
    </Card>
  );
}

function ProductSkeleton() {
  return (
    <div className="grid gap-10 md:grid-cols-2">
      <Skeleton className="aspect-[4/3] rounded-3xl" />
      <div className="space-y-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-3/4" /><Skeleton className="h-6 w-40" /><Skeleton className="h-24 w-full" /><Skeleton className="h-12 w-full" /></div>
    </div>
  );
}

export function ProductPage() {
  const { slug = "" } = useParams();
  const { user } = useStore();
  const toast = useToast();
  const { data, error, loading, reload } = useApi<{ product: Product }>(`/products/${slug}`);
  const p = data?.product;
  useTitle(p?.name);
  const reviews = useApi<{ reviews: Review[] }>(p ? `/reviews?productId=${p.id}&limit=50` : null);
  const related = useApi<{ products: Product[] }>(`/products/${slug}/related`);
  const [qty, setQty] = useState(1);
  const [recent, setRecent] = useState<Product[]>([]);

  useEffect(() => {
    setQty(1);
  }, [slug]);
  useEffect(() => {
    if (!p) return;
    setRecent(recentlyViewed.get().filter((x) => x.id !== p.id).slice(0, 4));
    recentlyViewed.push(p);
  }, [p]);

  if (error) return <ErrorBox error={error} />;
  if (loading && !p) return <ProductSkeleton />;
  if (!p) return null;

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: p.name, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        toast({ kind: "success", title: "Link copied" });
      }
    } catch {
      // User dismissed the share sheet.
    }
  };

  return (
    <div className="space-y-16 pb-20 md:pb-0">
      <div>
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-ink-3" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-ink">Home</Link><ChevronRight className="size-3.5" />
          <Link to={`/category/${p.category.slug}`} className="hover:text-ink">{p.category.name}</Link><ChevronRight className="size-3.5" />
          <span className="text-ink-2">{p.name}</span>
        </nav>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="relative">
            <ZoomImage src={img(p.imageUrl, 900, 1080)} alt={p.name} />
            {p.discountPercent > 0 && <span className="absolute start-4 top-4 rounded bg-card px-2 py-1 text-sm font-medium text-brand-700 dark:text-brand-400">−{p.discountPercent}%</span>}
          </div>
          <div className="flex flex-col">
            <Link to={`/category/${p.category.slug}`} className="text-xs font-medium tracking-[0.18em] text-brand-600 uppercase dark:text-brand-400">{p.category.name}</Link>
            <h1 className="mt-2 text-4xl leading-tight sm:text-5xl">{p.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
              {p.rating !== null ? (
                <a href="#reviews" className="flex items-center gap-1.5 hover:text-ink"><Stars value={p.rating} /> {p.rating.toFixed(1)} · {p.reviewCount} {p.reviewCount === 1 ? "review" : "reviews"}</a>
              ) : <span>No reviews yet</span>}
              {p.soldCount > 0 && <span>{p.soldCount} sold recently</span>}
            </div>
            <div className="mt-6 flex items-center gap-3">
              <Price cents={p.finalPriceCents} was={p.priceCents} size="lg" />
              {p.discountPercent > 0 && <span className="text-sm text-brand-700 dark:text-brand-400">You save ${((p.priceCents - p.finalPriceCents) / 100).toFixed(2)}</span>}
            </div>
            <p className="mt-5 leading-relaxed text-ink-2">{p.description}</p>
            {p.highlights.length > 0 && (
              <ul className="mt-5 space-y-2">
                {p.highlights.map((h) => <li key={h} className="flex items-start gap-2.5 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-ink-3" /> {h}</li>)}
              </ul>
            )}
            <p className="mt-6 flex items-center gap-2 text-sm text-ink-2">
              <span className={`size-1.5 rounded-full ${p.stock === 0 ? "bg-ink-3" : p.stock < 10 ? "bg-brand-500" : "bg-emerald-600"}`} />
              {p.stock === 0 ? "Sold out. We're restocking soon." : p.stock < 10 ? `Only ${p.stock} left in stock` : "In stock, ships within one working day"}
            </p>
            {p.stock > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center rounded-xl border border-line bg-card">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} className="cursor-pointer p-3 disabled:opacity-30" aria-label="Decrease"><Minus className="size-4" /></button>
                  <span className="w-8 text-center font-semibold" data-testid="qty">{qty}</span>
                  <button onClick={() => setQty(Math.min(p.stock, qty + 1))} disabled={qty >= p.stock} className="cursor-pointer p-3 disabled:opacity-30" aria-label="Increase"><Plus className="size-4" /></button>
                </div>
                <AddToCartButton product={p} quantity={qty} className="flex-1 py-3.5" />
                <WishlistButton product={p} className="size-12 border border-line !bg-card !text-ink" />
                <button onClick={share} className="grid size-12 cursor-pointer place-items-center rounded-full border border-line hover:bg-soft" aria-label="Share"><Share2 className="size-[18px]" /></button>
              </div>
            )}
            <Card className="mt-6 divide-y divide-line text-sm">
              <p className="flex items-center gap-3 p-4"><Truck className="size-5 text-ink-3" strokeWidth={1.5} /><span>Arrives <b>{deliveryWindow()}</b>{p.finalPriceCents >= 5000 ? " · free shipping" : ""}</span></p>
              <p className="flex items-center gap-3 p-4"><RotateCcw className="size-5 text-ink-3" strokeWidth={1.5} /> Free 30-day returns</p>
              <p className="flex items-center gap-3 p-4"><ShieldCheck className="size-5 text-ink-3" strokeWidth={1.5} /> Two-year warranty included</p>
            </Card>
          </div>
        </div>
      </div>

      <section id="reviews" className="grid gap-10 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-6">
          <h2 className="text-2xl font-medium">Customer reviews</h2>
          {reviews.data && reviews.data.reviews.length > 0 && <RatingSummary reviews={reviews.data.reviews} />}
          {user ? <ReviewForm productId={p.id} onDone={() => (reviews.reload(), reload())} /> : (
            <p className="text-sm text-ink-2"><Link to="/login" state={{ from: `/product/${p.slug}` }} className="font-semibold text-brand-600 hover:underline">Log in</Link> to write a review.</p>
          )}
        </div>
        <div className="space-y-4">
          {reviews.data?.reviews.length === 0 && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-2">No reviews yet. If you've bought this, tell us what you think.</p>}
          {reviews.data?.reviews.map((r) => (
            <Card key={r.id} className="flex gap-4 p-5">
              <img src={r.avatarUrl} alt="" className="size-12 shrink-0 rounded-full bg-soft" />
              <div>
                <p className="flex flex-wrap items-center gap-2 font-semibold">{r.authorName} <Stars value={r.rating} size={14} /></p>
                <p className="text-xs text-ink-3">{new Date(r.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })} </p>
                <p className="mt-2 text-ink-2">{r.comment}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {related.data && related.data.products.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-medium">You might also like</h2>
          <ProductGrid products={related.data.products} />
        </section>
      )}
      {recent.length > 0 && (
        <section>
          <h2 className="mb-6 text-2xl font-medium">Recently viewed</h2>
          <ProductGrid products={recent} />
        </section>
      )}

      {/* Sticky buy bar on small screens */}
      {p.stock > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-card/95 p-3 backdrop-blur md:hidden">
          <Price cents={p.finalPriceCents} />
          <AddToCartButton product={p} quantity={qty} className="flex-1" />
        </div>
      )}
    </div>
  );
}
