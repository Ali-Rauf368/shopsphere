import { ChevronLeft, ChevronRight, PackageSearch, SlidersHorizontal, Star, X } from "lucide-react";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { ProductGrid } from "../components/ProductCard";
import { ErrorBox, PageTitle } from "../components/ui";
import type { Category, Paged, Product } from "../lib/api";
import { useTitle } from "../lib/hooks";
import { useApi } from "../lib/useApi";

const SORTS = { popular: "Best selling", newest: "Newest", rating: "Top rated", price_asc: "Price: low to high", price_desc: "Price: high to low", name: "Name A–Z" };
const PRICE_RANGES: [string, number | null, number | null][] = [
  ["Under $25", null, 2500],
  ["$25 – $100", 2500, 10000],
  ["$100 – $500", 10000, 50000],
  ["$500 and up", 50000, null],
];
const FILTER_KEYS = ["minPrice", "maxPrice", "inStock", "minRating", "sub"];
const PAGE_SIZE = 12;

function Filters({ subcategories }: { subcategories?: { slug: string; name: string }[] }) {
  const [params, setParams] = useSearchParams();
  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v === null ? next.delete(k) : next.set(k, v);
    next.delete("page");
    setParams(next, { replace: true });
  };
  const radio = "size-4 accent-brand-600";

  return (
    <div className="space-y-7 text-sm">
      {subcategories && subcategories.length > 0 && (
        <fieldset>
          <legend className="mb-3 font-semibold">Collection</legend>
          <div className="space-y-2">
            {[{ slug: "", name: "All" }, ...subcategories].map((s) => (
              <label key={s.slug} className="flex cursor-pointer items-center gap-2.5 text-ink-2 hover:text-ink">
                <input type="radio" name="sub" className={radio} checked={(params.get("sub") ?? "") === s.slug} onChange={() => set({ sub: s.slug || null })} /> {s.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="mb-3 font-semibold">Price</legend>
        <div className="space-y-2">
          {PRICE_RANGES.map(([label, min, max]) => {
            const checked = params.get("minPrice") === (min === null ? null : String(min)) && params.get("maxPrice") === (max === null ? null : String(max));
            return (
              <label key={label} className="flex cursor-pointer items-center gap-2.5 text-ink-2 hover:text-ink">
                <input type="radio" name="price" className={radio} checked={checked} onChange={() => set({ minPrice: min === null ? null : String(min), maxPrice: max === null ? null : String(max) })} /> {label}
              </label>
            );
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-3 font-semibold">Customer rating</legend>
        <div className="space-y-2">
          {[4, 3].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2.5 text-ink-2 hover:text-ink">
              <input type="radio" name="rating" className={radio} checked={params.get("minRating") === String(r)} onChange={() => set({ minRating: String(r) })} />
              <span className="flex items-center gap-1">{r}<Star className="size-3.5 fill-amber-400 text-amber-400" /> &amp; up</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex cursor-pointer items-center justify-between gap-2 font-semibold">
        In stock only
        <input type="checkbox" role="switch" className="peer sr-only" checked={params.get("inStock") === "true"} onChange={(e) => set({ inStock: e.target.checked ? "true" : null })} />
        <span className="relative h-6 w-11 rounded-full bg-line transition peer-checked:bg-brand-600 after:absolute after:start-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5" />
      </label>
    </div>
  );
}

function ActiveChips({ subcategories }: { subcategories?: { slug: string; name: string }[] }) {
  const [params, setParams] = useSearchParams();
  const chips: [string, string[]][] = [];
  const sub = params.get("sub");
  if (sub) chips.push([subcategories?.find((s) => s.slug === sub)?.name ?? sub, ["sub"]]);
  if (params.has("minPrice") || params.has("maxPrice")) {
    const range = PRICE_RANGES.find(([, min, max]) => String(min ?? "") === (params.get("minPrice") ?? "") && String(max ?? "") === (params.get("maxPrice") ?? ""));
    chips.push([range?.[0] ?? "Price", ["minPrice", "maxPrice"]]);
  }
  if (params.get("minRating")) chips.push([`${params.get("minRating")}★ & up`, ["minRating"]]);
  if (params.get("inStock")) chips.push(["In stock", ["inStock"]]);
  if (!chips.length) return null;

  const remove = (keys: string[]) => {
    const next = new URLSearchParams(params);
    keys.forEach((k) => next.delete(k));
    next.delete("page");
    setParams(next, { replace: true });
  };
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map(([label, keys]) => (
        <button key={label} onClick={() => remove(keys)} className="flex cursor-pointer items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 hover:bg-brand-100 dark:bg-soft dark:text-brand-400">
          {label} <X className="size-3.5" />
        </button>
      ))}
      <button onClick={() => remove(FILTER_KEYS)} className="cursor-pointer text-sm text-ink-2 underline-offset-2 hover:underline">Clear all</button>
    </div>
  );
}

function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (n: number) => void }) {
  if (pages <= 1) return null;
  const btn = "grid size-10 cursor-pointer place-items-center rounded-xl text-sm font-medium transition disabled:cursor-default disabled:opacity-40";
  return (
    <nav className="mt-12 flex justify-center gap-1.5" aria-label="Pagination">
      <button disabled={page === 1} onClick={() => onPage(page - 1)} className={`${btn} hover:bg-soft`} aria-label="Previous page"><ChevronLeft className="size-4" /></button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <button key={n} onClick={() => onPage(n)} aria-current={n === page ? "page" : undefined} className={`${btn} ${n === page ? "bg-brand-600 text-white" : "hover:bg-soft"}`}>{n}</button>
      ))}
      <button disabled={page === pages} onClick={() => onPage(page + 1)} className={`${btn} hover:bg-soft`} aria-label="Next page"><ChevronRight className="size-4" /></button>
    </nav>
  );
}

function ProductListing({ title, eyebrow, sub, baseQuery, subcategories, defaultSort = "popular" }: {
  title: string;
  eyebrow?: string;
  sub?: string;
  baseQuery: Record<string, string>;
  subcategories?: { slug: string; name: string }[];
  defaultSort?: keyof typeof SORTS;
}) {
  useTitle(title);
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sort = params.get("sort") ?? defaultSort;
  const page = Number(params.get("page") ?? 1);

  const query = new URLSearchParams({ ...baseQuery, sort, page: String(page), pageSize: String(PAGE_SIZE) });
  for (const k of ["minPrice", "maxPrice", "inStock", "minRating"]) {
    const v = params.get(k);
    if (v) query.set(k, v);
  }
  if (params.get("sub")) query.set("category", params.get("sub")!);
  const { data, error, loading } = useApi<Paged<Product>>(`/products?${query}`);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => next.set(k, v));
    setParams(next);
    if (patch.page) window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <PageTitle eyebrow={eyebrow} sub={sub}>{title}</PageTitle>
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20"><Filters subcategories={subcategories} /></div>
        </aside>
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-2" aria-live="polite">{data ? `${data.total} ${data.total === 1 ? "product" : "products"}` : "Loading…"}</p>
            <div className="flex gap-2">
              <button onClick={() => setFiltersOpen(true)} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-card px-3 py-2 text-sm font-medium lg:hidden">
                <SlidersHorizontal className="size-4" /> Filters
              </button>
              <select value={sort} onChange={(e) => update({ sort: e.target.value, page: "1" })} className="cursor-pointer rounded-xl border border-line bg-card px-3 py-2 text-sm" aria-label="Sort">
                {Object.entries(SORTS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <ActiveChips subcategories={subcategories} />
          {error && <ErrorBox error={error} />}
          {data && data.products.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-line py-20 text-center">
              <PackageSearch className="mb-4 size-12 text-ink-3" />
              <p className="font-semibold">No products match these filters</p>
              <p className="mt-1 text-sm text-ink-2">Try removing a filter or searching for something else.</p>
              <Link to="/" className="mt-5 text-sm font-semibold text-brand-600 hover:underline">Back to the shop</Link>
            </div>
          ) : (
            <ProductGrid products={loading ? undefined : data?.products} count={6} cols={3} />
          )}
          <Pagination page={page} pages={pages} onPage={(n) => update({ page: String(n) })} />
        </div>
      </div>

      {/* Mobile filter sheet */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-lg font-bold">Filters</p>
              <button onClick={() => setFiltersOpen(false)} className="cursor-pointer rounded-lg p-1.5 hover:bg-soft" aria-label="Close filters"><X className="size-5" /></button>
            </div>
            <Filters subcategories={subcategories} />
            <button onClick={() => setFiltersOpen(false)} className="mt-8 w-full cursor-pointer rounded-xl bg-brand-600 py-3 font-semibold text-white">Show {data?.total ?? ""} results</button>
          </div>
        </div>
      )}
    </>
  );
}

export function CategoryPage() {
  const { slug = "" } = useParams();
  const { data } = useApi<{ category: Category & { parentId: number | null } }>(`/categories/${slug}`);
  const c = data?.category;
  return (
    <ProductListing
      key={slug}
      eyebrow={c?.parentId ? "Collection" : "Department"}
      title={c?.name ?? "…"}
      sub={c?.children.length ? `Browse ${c.children.map((x) => x.name.toLowerCase()).join(", ")} and more.` : undefined}
      baseQuery={{ category: slug }}
      subcategories={c?.children}
    />
  );
}

export function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get("q") ?? "";
  return <ProductListing key={q} eyebrow={q ? "Search" : "Catalog"} title={q ? `Results for “${q}”` : "All products"} baseQuery={q ? { q } : {}} />;
}

export function OffersPage() {
  const { data } = useApi<Paged<Product>>("/products?offers=true&pageSize=60");
  const withVideo = data?.products.filter((p) => p.videoUrl).slice(0, 2) ?? [];
  return (
    <div className="space-y-12">
      {withVideo.length > 0 && (
        <section className="grid gap-6 md:grid-cols-2">
          {withVideo.map((p) => (
            <Link key={p.id} to={`/product/${p.slug}`} className="group relative overflow-hidden rounded-3xl bg-slate-900 text-white">
              <video autoPlay muted loop playsInline className="aspect-video w-full object-cover opacity-80 transition group-hover:opacity-100" poster={p.imageUrl}>
                <source src={p.videoUrl!} type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <span className="rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold">−{p.discountPercent}% this week</span>
                <p className="mt-2 text-2xl font-bold">{p.name}</p>
              </div>
            </Link>
          ))}
        </section>
      )}
      <ProductListing eyebrow="Limited time" title="Special Offers" sub="Hand-picked deals across every department." baseQuery={{ offers: "true" }} defaultSort="price_desc" />
    </div>
  );
}
