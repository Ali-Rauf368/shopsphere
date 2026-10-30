import type pg from "pg";
import { HttpError } from "./http-error.js";

export const FREE_SHIPPING_THRESHOLD_CENTS = 5000;
export const SHIPPING_CENTS = 499;

export interface Coupon {
  code: string;
  description: string;
  percentOff: number;
  minSubtotalCents: number;
}

export interface Quote {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  coupon: Coupon | null;
  freeShippingThresholdCents: number;
}

type Queryable = Pick<pg.PoolClient, "query">;

/** Looks up an active, unexpired coupon. Throws 400 with a customer-facing reason otherwise. */
export async function findCoupon(db: Queryable, rawCode: string, subtotalCents: number): Promise<Coupon> {
  const code = rawCode.trim().toUpperCase();
  const { rows } = await db.query<{ code: string; description: string; percent_off: number; min_subtotal_cents: number; active: boolean; expires_at: Date | null }>(
    "SELECT * FROM coupons WHERE code = $1",
    [code],
  );
  const c = rows[0];
  if (!c || !c.active || (c.expires_at && c.expires_at < new Date())) throw new HttpError(400, `Coupon ${code} is not valid`);
  if (subtotalCents < c.min_subtotal_cents) {
    throw new HttpError(400, `Coupon ${code} needs a subtotal of at least $${(c.min_subtotal_cents / 100).toFixed(2)}`);
  }
  return { code: c.code, description: c.description, percentOff: c.percent_off, minSubtotalCents: c.min_subtotal_cents };
}

export function quote(subtotalCents: number, coupon: Coupon | null): Quote {
  const discountCents = coupon ? Math.round((subtotalCents * coupon.percentOff) / 100) : 0;
  const afterDiscount = subtotalCents - discountCents;
  const shippingCents = subtotalCents === 0 || afterDiscount >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : SHIPPING_CENTS;
  return {
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: afterDiscount + shippingCents,
    coupon,
    freeShippingThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
  };
}
