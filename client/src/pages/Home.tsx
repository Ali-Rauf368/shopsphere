import { ArrowRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Link } from "react-router";
import { Carousel } from "../components/Carousel";
import { ProductCard } from "../components/ProductCard";
import type { Category, Product } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useApi } from "../lib/useApi";

/** One container per category, each showing 3 product cards. */
function CategorySection({ category }: { category: Category }) {
  const { t } = useI18n();
  const { data } = useApi<{ products: Product[] }>(`/products?category=${category.slug}&pageSize=3&sort=newest`);
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-bold">{category.name}</h2>
        <Link to={`/category/${category.slug}`} className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
          {t("viewAll")} <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data?.products.map((p) => <ProductCard key={p.id} product={p} />) ??
          [0, 1, 2].map((i) => <div key={i} className="h-96 animate-pulse rounded-xl bg-slate-200" />)}
      </div>
    </section>
  );
}

export function Home() {
  const { data } = useApi<{ categories: Category[] }>("/categories");
  return (
    <div className="space-y-14">
      <Carousel />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          [Truck, "Free shipping", "On orders over $50"],
          [RotateCcw, "30-day returns", "Hassle-free exchanges"],
          [ShieldCheck, "Secure checkout", "Your data stays protected"],
        ].map(([Icon, title, text]) => {
          const I = Icon as typeof Truck;
          return (
            <div key={title as string} className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
              <I className="size-8 text-brand-600" />
              <div>
                <p className="font-semibold">{title as string}</p>
                <p className="text-sm text-slate-500">{text as string}</p>
              </div>
            </div>
          );
        })}
      </div>
      {data?.categories.map((c) => <CategorySection key={c.id} category={c} />)}
    </div>
  );
}
