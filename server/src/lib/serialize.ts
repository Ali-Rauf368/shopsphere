export interface ProductRow {
  id: number;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  discount_percent: number;
  image_url: string;
  video_url: string | null;
  stock: number;
  featured: boolean;
  highlights: string[];
  category_id: number;
  category_slug: string;
  category_name: string;
  rating: string | null;
  review_count: string;
  sold_count: string;
}

export const PRODUCT_SELECT = `
  SELECT p.*, c.slug AS category_slug, c.name AS category_name,
         (SELECT round(avg(r.rating)::numeric, 1) FROM reviews r WHERE r.product_id = p.id) AS rating,
         (SELECT count(*) FROM reviews r WHERE r.product_id = p.id) AS review_count,
         (SELECT coalesce(sum(oi.quantity), 0) FROM order_items oi JOIN orders o ON o.id = oi.order_id
           WHERE oi.product_id = p.id AND o.status <> 'cancelled') AS sold_count
  FROM products p JOIN categories c ON c.id = p.category_id`;

export function finalPrice(priceCents: number, discountPercent: number): number {
  return Math.round((priceCents * (100 - discountPercent)) / 100);
}

export function serializeProduct(row: ProductRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    discountPercent: row.discount_percent,
    finalPriceCents: finalPrice(row.price_cents, row.discount_percent),
    imageUrl: row.image_url,
    videoUrl: row.video_url,
    stock: row.stock,
    featured: row.featured,
    highlights: row.highlights,
    category: { id: row.category_id, slug: row.category_slug, name: row.category_name },
    rating: row.rating === null ? null : Number(row.rating),
    reviewCount: Number(row.review_count),
    soldCount: Number(row.sold_count),
  };
}
