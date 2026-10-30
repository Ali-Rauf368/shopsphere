import bcrypt from "bcrypt";
import pg from "pg";
import { CATALOG, REVIEWS, SAMPLE_VIDEO } from "./seed-data.js";

const slugify = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export interface SeedOptions {
  /** Also generate ~30 days of demo orders for the admin dashboard. */
  orders?: boolean;
  bcryptRounds?: number;
}

/** Wipes all data and loads the demo catalog, users and reviews. Deterministic so tests can rely on it. */
export async function seedDatabase(connectionString: string, opts: SeedOptions = {}) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  const rounds = opts.bcryptRounds ?? 10;
  try {
    await client.query("BEGIN");
    await client.query(
      "TRUNCATE order_items, orders, cart_items, reviews, products, categories, users, contact_messages RESTART IDENTITY CASCADE",
    );

    const insertUser = (email: string, name: string, password: string, role: string) =>
      bcrypt.hash(password, rounds).then((hash) =>
        client.query("INSERT INTO users (email, name, password_hash, role) VALUES ($1,$2,$3,$4)", [email, name, hash, role]),
      );
    await insertUser("admin@shopsphere.dev", "Store Admin", "admin12345", "admin");
    await insertUser("demo@shopsphere.dev", "Demo Customer", "demo12345", "customer");

    let position = 0;
    let n = 0;
    const productIds: { id: number; price: number }[] = [];
    for (const [topSlug, top] of Object.entries(CATALOG)) {
      const { rows } = await client.query<{ id: number }>(
        "INSERT INTO categories (slug, name, position) VALUES ($1,$2,$3) RETURNING id",
        [topSlug, top.name, position++],
      );
      const topId = rows[0]!.id;
      let subPos = 0;
      for (const [subSlug, sub] of Object.entries(top.subs)) {
        const { rows: subRows } = await client.query<{ id: number }>(
          "INSERT INTO categories (slug, name, parent_id, position) VALUES ($1,$2,$3,$4) RETURNING id",
          [`${topSlug}-${subSlug}`, sub.name, topId, subPos++],
        );
        for (const [name, price] of sub.products) {
          n++;
          const slug = slugify(name);
          const discount = n % 4 === 0 ? [10, 15, 20, 25][n % 3]! : 0;
          const { rows: p } = await client.query<{ id: number }>(
            `INSERT INTO products (slug, name, description, price_cents, discount_percent, image_url, video_url, stock, featured, category_id, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now() - make_interval(hours => $11)) RETURNING id`,
            [
              slug,
              name,
              `${name} — part of our ${sub.name.toLowerCase()} range in ${top.name}. Carefully selected for quality, backed by free returns within 30 days.`,
              price,
              discount,
              `https://picsum.photos/seed/${slug}/600/450`,
              discount >= 20 ? SAMPLE_VIDEO : null,
              n % 9 === 0 ? 3 : 25 + (n % 5) * 10,
              n % 3 === 0,
              subRows[0]!.id,
              n,
            ],
          );
          productIds.push({ id: p[0]!.id, price: Math.round((price * (100 - discount)) / 100) });
        }
      }
    }

    for (const [i, [author, rating, comment, productSlug]] of REVIEWS.entries()) {
      await client.query(
        `INSERT INTO reviews (author_name, rating, comment, product_id, created_at)
         VALUES ($1, $2, $3, (SELECT id FROM products WHERE slug = $4), now() - make_interval(days => $5))`,
        [author, rating, comment, productSlug, i],
      );
    }

    if (opts.orders) {
      // Simple deterministic pseudo-random sequence so the dashboard looks the same on every seed.
      let s = 42;
      const rand = () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
      for (let day = 29; day >= 0; day--) {
        const count = 1 + Math.floor(rand() * 4);
        for (let k = 0; k < count; k++) {
          const picks = [...new Set(Array.from({ length: 1 + Math.floor(rand() * 3) }, () => productIds[Math.floor(rand() * productIds.length)]!))];
          const total = picks.reduce((t, p) => t + p.price, 0);
          const status = day > 5 ? "delivered" : day > 2 ? "shipped" : "paid";
          const { rows } = await client.query<{ id: number }>(
            `INSERT INTO orders (user_id, status, total_cents, shipping_address, created_at)
             VALUES (2, $1, $2, '12 Market Street, Springfield', now() - make_interval(days => $3, hours => $4)) RETURNING id`,
            [status, total, day, k],
          );
          for (const p of picks) {
            await client.query("INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents) VALUES ($1,$2,1,$3)", [rows[0]!.id, p.id, p.price]);
          }
        }
      }
    }
    await client.query("COMMIT");
    return { products: productIds.length };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}
