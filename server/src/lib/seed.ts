import bcrypt from "bcrypt";
import pg from "pg";
import { DETAILS } from "./product-details.js";
import { CATALOG, COUPONS, photo, REVIEW_LINES, REVIEWERS, REVIEWS, SAMPLE_VIDEO } from "./seed-data.js";

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
      "TRUNCATE order_events, order_items, orders, cart_items, wishlist_items, reviews, products, categories, users, contact_messages, newsletter_subscribers, coupons RESTART IDENTITY CASCADE",
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
        for (const [name, price, photoId] of sub.products) {
          n++;
          const slug = slugify(name);
          const [description, ...highlights] = DETAILS[slug] ?? [`${name} from our ${sub.name.toLowerCase()} range.`];
          const discount = n % 4 === 0 ? [10, 15, 20, 25][n % 3]! : 0;
          const { rows: p } = await client.query<{ id: number }>(
            `INSERT INTO products (slug, name, description, price_cents, discount_percent, image_url, video_url, stock, featured, highlights, category_id, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now() - make_interval(hours => $12)) RETURNING id`,
            [
              slug,
              name,
              description,
              price,
              discount,
              photo(photoId),
              discount >= 20 ? SAMPLE_VIDEO : null,
              n % 9 === 0 ? 3 : 25 + (n % 5) * 10,
              n % 3 === 0,
              highlights,
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

    // A few older product reviews per product, so ratings look lived-in. Deterministic for tests.
    for (const [i, { id }] of productIds.entries()) {
      const count = i % 4; // 0–3 reviews
      for (let k = 0; k < count; k++) {
        const rating = [5, 4, 5, 3, 5, 4][(i + k) % 6]!;
        const lines = REVIEW_LINES[rating]!;
        await client.query(
          `INSERT INTO reviews (author_name, rating, comment, product_id, created_at)
           VALUES ($1, $2, $3, $4, now() - make_interval(days => $5))`,
          [REVIEWERS[(i * 3 + k) % REVIEWERS.length], rating, lines[(i + k) % lines.length], id, 10 + ((i * 7 + k * 5) % 80)],
        );
      }
    }

    for (const c of COUPONS) {
      await client.query(
        "INSERT INTO coupons (code, description, percent_off, min_subtotal_cents, active, expires_at) VALUES ($1,$2,$3,$4,$5,$6)",
        [c.code, c.description, c.percentOff, c.minSubtotalCents, c.active, c.expired ? new Date(Date.now() - 86_400_000) : null],
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
          const subtotal = picks.reduce((t, p) => t + p.price, 0);
          const shipping = subtotal >= 5000 ? 0 : 499;
          const status = day > 5 ? "delivered" : day > 2 ? "shipped" : "paid";
          const { rows } = await client.query<{ id: number }>(
            `INSERT INTO orders (user_id, status, recipient_name, subtotal_cents, shipping_cents, total_cents, shipping_address, created_at)
             VALUES (2, $1, 'Demo Customer', $2, $3, $4, '12 Market Street, Springfield 49007', now() - make_interval(days => $5, hours => $6)) RETURNING id`,
            [status, subtotal, shipping, subtotal + shipping, day, k],
          );
          // Timeline: paid at order time, then shipped/delivered a day or two later.
          const timeline = ["paid", ...(status !== "paid" ? ["shipped"] : []), ...(status === "delivered" ? ["delivered"] : [])];
          for (const [step, st] of timeline.entries()) {
            await client.query(
              "INSERT INTO order_events (order_id, status, created_at) VALUES ($1, $2, now() - make_interval(days => $3, hours => $4))",
              [rows[0]!.id, st, Math.max(day - step * 2, 0), k],
            );
          }
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
