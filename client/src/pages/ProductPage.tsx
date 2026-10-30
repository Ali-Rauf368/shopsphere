import { Minus, Plus, Star } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { AddToCartButton } from "../components/AddToCartButton";
import { ErrorBox, Loading } from "../components/Layout";
import { Stars } from "../components/Stars";
import { api, formatPrice, type Product, type Review } from "../lib/api";
import { useStore } from "../lib/store";
import { useApi } from "../lib/useApi";

function ReviewForm({ productId, onDone }: { productId: number; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api("/reviews", { method: "POST", body: { productId, rating, comment } });
      setComment("");
      onDone();
    } catch (err) {
      setError((err as Error).message);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
      <p className="font-semibold">Write a review</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} onClick={() => setRating(n)} className="cursor-pointer" aria-label={`${n} stars`}>
            <Star className={`size-6 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} required minLength={3} rows={3} placeholder="What did you think?" className="w-full rounded-lg border border-slate-300 p-3 text-sm" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">Submit</button>
    </form>
  );
}

export function ProductPage() {
  const { slug = "" } = useParams();
  const { user } = useStore();
  const { data, error, loading, reload } = useApi<{ product: Product }>(`/products/${slug}`);
  const productId = data?.product.id;
  const reviews = useApi<{ reviews: Review[] }>(productId ? `/reviews?productId=${productId}` : null);
  const [qty, setQty] = useState(1);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} />;
  if (!data) return null;
  const p = data.product;

  return (
    <div className="space-y-12">
      <nav className="text-sm text-slate-500">
        <Link to="/" className="hover:underline">Home</Link> / <Link to={`/category/${p.category.slug}`} className="hover:underline">{p.category.name}</Link> / {p.name}
      </nav>
      <div className="grid gap-10 md:grid-cols-2">
        <img src={p.imageUrl.replace("/600/450", "/900/675")} alt={p.name} className="w-full rounded-2xl object-cover shadow" />
        <div className="space-y-5">
          <h1 className="text-3xl font-bold">{p.name}</h1>
          {p.rating !== null && (
            <div className="flex items-center gap-2 text-sm text-slate-500"><Stars value={p.rating} /> {p.rating} · {p.reviewCount} reviews</div>
          )}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPrice(p.finalPriceCents)}</span>
            {p.discountPercent > 0 && (
              <>
                <span className="text-lg text-slate-400 line-through">{formatPrice(p.priceCents)}</span>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-sm font-semibold text-rose-700">Save {p.discountPercent}%</span>
              </>
            )}
          </div>
          <p className="leading-relaxed text-slate-600">{p.description}</p>
          <p className={`text-sm font-medium ${p.stock < 10 ? "text-amber-600" : "text-emerald-600"}`}>
            {p.stock === 0 ? "Out of stock" : p.stock < 10 ? `Only ${p.stock} left` : "In stock"}
          </p>
          {p.stock > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center rounded-lg border border-slate-300 bg-white">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="cursor-pointer p-2.5" aria-label="Decrease"><Minus className="size-4" /></button>
                <span className="w-10 text-center" data-testid="qty">{qty}</span>
                <button onClick={() => setQty(Math.min(p.stock, qty + 1))} className="cursor-pointer p-2.5" aria-label="Increase"><Plus className="size-4" /></button>
              </div>
              <AddToCartButton product={p} quantity={qty} className="flex-1" />
            </div>
          )}
        </div>
      </div>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Reviews</h2>
        {reviews.data?.reviews.length === 0 && <p className="text-slate-500">No reviews yet.</p>}
        {reviews.data?.reviews.map((r) => (
          <div key={r.id} className="flex gap-4 rounded-xl bg-white p-5 shadow-sm">
            <img src={r.avatarUrl} alt="" className="size-12 rounded-full bg-slate-100" />
            <div>
              <p className="font-semibold">{r.authorName} <span className="ms-2"><Stars value={r.rating} size={14} /></span></p>
              <p className="mt-1 text-slate-600">{r.comment}</p>
            </div>
          </div>
        ))}
        {user && productId && <ReviewForm productId={productId} onDone={() => { reviews.reload(); reload(); }} />}
      </section>
    </div>
  );
}
