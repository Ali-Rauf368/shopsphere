import { useParams, useSearchParams } from "react-router";
import { ErrorBox, Loading, PageTitle } from "../components/Layout";
import { ProductGrid } from "../components/ProductCard";
import type { Product } from "../lib/api";
import { useApi } from "../lib/useApi";

const SORTS = { newest: "Newest", price_asc: "Price: low to high", price_desc: "Price: high to low", name: "Name" };

function ProductListing({ title, sub, baseQuery }: { title: string; sub?: string; baseQuery: Record<string, string> }) {
  const [params, setParams] = useSearchParams();
  const sort = params.get("sort") ?? "newest";
  const page = Number(params.get("page") ?? 1);
  const query = new URLSearchParams({ ...baseQuery, sort, page: String(page), pageSize: "12" });
  const { data, error, loading } = useApi<{ products: Product[]; total: number; pageSize: number }>(`/products?${query}`);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => next.set(k, v));
    setParams(next);
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle sub={sub ?? (data ? `${data.total} products` : undefined)}>{title}</PageTitle>
        <select value={sort} onChange={(e) => update({ sort: e.target.value, page: "1" })} className="mb-8 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" aria-label="Sort">
          {Object.entries(SORTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      {error && <ErrorBox error={error} />}
      {loading && !data ? <Loading /> : data && data.products.length === 0 ? (
        <p className="py-16 text-center text-slate-500">No products found.</p>
      ) : (
        data && <ProductGrid products={data.products} />
      )}
      {pages > 1 && (
        <div className="mt-10 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => update({ page: String(n) })} className={`size-10 cursor-pointer rounded-lg text-sm font-medium ${n === page ? "bg-brand-600 text-white" : "bg-white hover:bg-slate-100"}`}>
              {n}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export function CategoryPage() {
  const { slug = "" } = useParams();
  const { data } = useApi<{ category: { name: string } }>(`/categories/${slug}`);
  return <ProductListing key={slug} title={data?.category.name ?? "…"} baseQuery={{ category: slug }} />;
}

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  return <ProductListing key={q} title={q ? `Results for “${q}”` : "All products"} baseQuery={q ? { q } : {}} />;
}

export function OffersPage() {
  const { data } = useApi<{ products: Product[] }>("/products?offers=true&pageSize=60");
  const withVideo = data?.products.filter((p) => p.videoUrl).slice(0, 2) ?? [];
  return (
    <div className="space-y-12">
      {withVideo.length > 0 && (
        <section className="grid gap-6 md:grid-cols-2">
          {withVideo.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-2xl bg-slate-900 text-white">
              <video autoPlay muted loop playsInline className="aspect-video w-full object-cover" poster={p.imageUrl}>
                <source src={p.videoUrl!} type="video/mp4" />
              </video>
              <div className="p-5">
                <p className="text-sm text-rose-400">−{p.discountPercent}% this week</p>
                <p className="text-xl font-bold">{p.name}</p>
              </div>
            </div>
          ))}
        </section>
      )}
      <ProductListing title="Special Offers" sub="Limited-time deals across every department" baseQuery={{ offers: "true" }} />
    </div>
  );
}
