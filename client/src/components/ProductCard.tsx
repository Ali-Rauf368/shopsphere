import { Link } from "react-router";
import { formatPrice, type Product } from "../lib/api";
import { AddToCartButton } from "./AddToCartButton";
import { Stars } from "./Stars";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-shadow hover:shadow-lg" data-testid="product-card">
      <Link to={`/product/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        <img src={product.imageUrl} alt={product.name} loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
        {product.discountPercent > 0 && (
          <span className="absolute start-3 top-3 rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">−{product.discountPercent}%</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium tracking-wide text-brand-600 uppercase">{product.category.name}</p>
        <h3 className="font-semibold text-slate-900">
          <Link to={`/product/${product.slug}`} className="hover:text-brand-600">{product.name}</Link>
        </h3>
        {product.rating !== null && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Stars value={product.rating} size={14} /> ({product.reviewCount})
          </div>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-lg font-bold">{formatPrice(product.finalPriceCents)}</span>
          {product.discountPercent > 0 && <span className="text-sm text-slate-400 line-through">{formatPrice(product.priceCents)}</span>}
        </div>
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}
