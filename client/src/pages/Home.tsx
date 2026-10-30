import { ArrowRight, Flame, Quote, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Carousel } from "../components/Carousel";
import { ProductGrid } from "../components/ProductCard";
import { Stars } from "../components/Stars";
import type { Category, Paged, Product, Review } from "../lib/api";
import { useTitle } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { useApi } from "../lib/useApi";

const DEPARTMENT_IMAGES: Record<string, string> = {
  electronics: "1505740420928-5e560c06d30e",
  fashion: "1542291026-7eec264c27ff",
  home: "1507473885765-e6ed057f782c",
  beauty: "1541643600914-78b084683601",
  sports: "1504280390367-361c6d9f38f4",
  books: "1512820790803-83ca734da794",
};

function SectionHeader({ icon: Icon, title, to, sub }: { icon?: typeof Flame; title: string; to?: string; sub?: string }) {
  const { t } = useI18n();
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
          {Icon && <Icon className="size-6 text-brand-600 dark:text-brand-400" />} {title}
        </h2>
        {sub && <p className="mt-1 text-ink-2">{sub}</p>}
      </div>
      {to && (
        <Link to={to} className="group flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400">
          {t("viewAll")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

function DepartmentTiles({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {categories.map((c) => (
        <Link key={c.id} to={`/category/${c.slug}`} className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-soft">
          <img src={`https://images.unsplash.com/photo-${DEPARTMENT_IMAGES[c.slug]}?w=400&h=500&fit=crop&auto=format&q=75`} alt="" loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <p className="font-display text-lg font-bold">{c.name}</p>
            <p className="text-xs text-white/75">{c.children.length} collections →</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

/** Counts down to local midnight, when "today's" deals roll over. */
function useCountdown() {
  const until = () => {
    const end = new Date();
    end.setHours(24, 0, 0, 0);
    return Math.max(0, end.getTime() - Date.now());
  };
  const [ms, setMs] = useState(until);
  useEffect(() => {
    const id = setInterval(() => setMs(until()), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.floor(ms / 1000);
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0"));
}

function FlashDeals() {
  const { data } = useApi<Paged<Product>>("/products?offers=true&pageSize=4&sort=price_desc");
  const [h, m, s] = useCountdown();
  return (
    <section className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-amber-50 p-6 sm:p-8 dark:border-rose-900/50 dark:from-rose-950/30 dark:to-amber-950/20">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl"><Flame className="size-7 text-rose-600" /> Today's flash deals</h2>
          <p className="mt-1 text-ink-2">Prices this low don't last. Grab them before midnight.</p>
        </div>
        <div className="flex items-center gap-2" aria-label="Time left">
          {[h, m, s].map((v, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="grid min-w-12 place-items-center rounded-xl bg-slate-900 px-2 py-2 font-mono text-xl font-bold text-white tabular-nums">{v}</span>
              {i < 2 && <span className="font-bold text-ink-3">:</span>}
            </span>
          ))}
        </div>
      </div>
      <ProductGrid products={data?.products} count={4} />
      <Link to="/offers" className="mt-6 inline-flex items-center gap-1 font-semibold text-rose-700 hover:underline dark:text-rose-400">See every offer <ArrowRight className="size-4" /></Link>
    </section>
  );
}

/** The original layout: one container per department, each with 3 product cards. */
function CategorySection({ category }: { category: Category }) {
  const { data } = useApi<Paged<Product>>(`/products?category=${category.slug}&pageSize=3&sort=rating`);
  return (
    <section>
      <SectionHeader title={category.name} to={`/category/${category.slug}`} sub={category.children.map((c) => c.name).join(" · ")} />
      <ProductGrid products={data?.products} count={3} cols={3} />
    </section>
  );
}

function ReviewStrip() {
  const { data } = useApi<{ reviews: Review[] }>("/reviews?limit=6");
  if (!data) return null;
  return (
    <section>
      <SectionHeader icon={Sparkles} title="Loved by shoppers" to="/about/reviews" sub="Real reviews from real customers" />
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2">
        {data.reviews.map((r) => (
          <figure key={r.id} className="w-80 shrink-0 snap-start rounded-2xl border border-line bg-card p-6">
            <Quote className="mb-3 size-6 text-brand-500/40" />
            <blockquote className="text-ink-2">“{r.comment}”</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <img src={r.avatarUrl} alt="" className="size-10 rounded-full bg-soft" />
              <div>
                <p className="text-sm font-semibold">{r.authorName}</p>
                <Stars value={r.rating} size={13} />
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function Home() {
  useTitle("Everything under one roof");
  const { data } = useApi<{ categories: Category[] }>("/categories");
  const best = useApi<Paged<Product>>("/products?sort=popular&pageSize=8");
  return (
    <div className="space-y-16">
      <Carousel />
      {data && (
        <section>
          <SectionHeader title="Shop by department" />
          <DepartmentTiles categories={data.categories} />
        </section>
      )}
      <FlashDeals />
      <section>
        <SectionHeader icon={TrendingUp} title="Best sellers" sub="What everyone's buying right now" to="/search?sort=popular" />
        <ProductGrid products={best.data?.products} />
      </section>
      {data?.categories.map((c) => <CategorySection key={c.id} category={c} />)}
      <ReviewStrip />
    </div>
  );
}
