import { ArrowRight } from "lucide-react";
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

function SectionHeader({ title, to, sub, link }: { title: string; to?: string; sub?: string; link?: string }) {
  const { t } = useI18n();
  return (
    <div className="mb-7 flex items-end justify-between gap-4 border-b border-line pb-4">
      <div>
        <h2 className="text-3xl">{title}</h2>
        {sub && <p className="mt-1 text-ink-2">{sub}</p>}
      </div>
      {to && (
        <Link to={to} className="group flex shrink-0 items-center gap-1 text-sm font-medium text-ink-2 hover:text-ink">
          {link ?? t("viewAll")} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

function DepartmentTiles({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-6 lg:grid-cols-6">
      {categories.map((c) => (
        <Link key={c.id} to={`/category/${c.slug}`} className="group">
          <div className="aspect-square overflow-hidden rounded-lg bg-soft">
            <img src={`https://images.unsplash.com/photo-${DEPARTMENT_IMAGES[c.slug]}?w=400&h=400&fit=crop&auto=format&q=75`} alt="" loading="lazy" className="size-full object-cover transition duration-700 group-hover:scale-105" />
          </div>
          <p className="mt-2.5 text-[15px] font-medium group-hover:underline group-hover:underline-offset-2">{c.name}</p>
        </Link>
      ))}
    </div>
  );
}

/** "Sunday 26 Oct": the end of this week's markdowns. */
function endOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
}

function Markdowns() {
  const { data } = useApi<Paged<Product>>("/products?offers=true&pageSize=4&sort=price_desc");
  return (
    <section>
      <SectionHeader title="This week's markdowns" sub={`A handful of things at a lower price until ${endOfWeek()}.`} to="/offers" link="All offers" />
      <ProductGrid products={data?.products} count={4} />
    </section>
  );
}

function ShopNote() {
  return (
    <section className="grid items-center gap-10 overflow-hidden rounded-xl bg-soft md:grid-cols-2">
      <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1100&h=800&fit=crop&auto=format&q=75" alt="Shelves in our Springfield showroom" loading="lazy" className="h-full min-h-72 w-full object-cover" />
      <div className="p-8 md:p-12 md:ps-0">
        <p className="mb-3 text-xs font-medium tracking-[0.18em] text-brand-600 uppercase dark:text-brand-400">How we choose</p>
        <h2 className="text-3xl leading-tight sm:text-4xl">We'd rather sell you one good thing than three average ones.</h2>
        <p className="mt-5 leading-relaxed text-ink-2">
          Every product here has been used by someone on our team before it went on sale. If it didn't hold up, it didn't make the cut. That keeps the range small, and it's why our return rate is low.
        </p>
        <Link to="/about/story" className="group mt-6 inline-flex items-center gap-2 border-b border-ink pb-0.5 font-medium">
          Read our story <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}

/** The original layout: one container per department, each with 3 product cards. */
function CategorySection({ category }: { category: Category }) {
  const { data } = useApi<Paged<Product>>(`/products?category=${category.slug}&pageSize=3&sort=rating`);
  return (
    <section>
      <SectionHeader title={category.name} to={`/category/${category.slug}`} sub={category.children.map((c) => c.name).join(", ")} />
      <ProductGrid products={data?.products} count={3} cols={3} />
    </section>
  );
}

function CustomerWords() {
  const { data } = useApi<{ reviews: Review[] }>("/reviews?limit=3");
  if (!data) return null;
  return (
    <section>
      <SectionHeader title="From our customers" to="/about/reviews" link="All reviews" />
      <div className="grid gap-10 md:grid-cols-3">
        {data.reviews.map((r) => (
          <figure key={r.id}>
            <Stars value={r.rating} size={14} />
            <blockquote className="mt-3 font-display text-xl leading-snug">“{r.comment}”</blockquote>
            <figcaption className="mt-3 text-sm text-ink-3">{r.authorName}{r.productName && <> on <span className="text-ink-2">{r.productName}</span></>}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function Home() {
  useTitle("Well-made everyday things");
  const { data } = useApi<{ categories: Category[] }>("/categories");
  const popular = useApi<Paged<Product>>("/products?sort=popular&pageSize=8");
  return (
    <div className="space-y-20">
      <Carousel />
      {data && (
        <section>
          <SectionHeader title="Shop by department" />
          <DepartmentTiles categories={data.categories} />
        </section>
      )}
      <Markdowns />
      <section>
        <SectionHeader title="Most popular" sub="What people have ordered most this month." to="/search?sort=popular" />
        <ProductGrid products={popular.data?.products} />
      </section>
      <ShopNote />
      {data?.categories.map((c) => <CategorySection key={c.id} category={c} />)}
      <CustomerWords />
    </div>
  );
}
