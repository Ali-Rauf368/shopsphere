import { Minus, Plus, ShoppingBag, Trash2, Truck, X } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router";
import { formatPrice, img } from "../lib/api";
import { useStore } from "../lib/store";
import { useToast } from "../lib/toast";

export const FREE_SHIPPING_CENTS = 5000;

export function FreeShippingMeter({ subtotalCents }: { subtotalCents: number }) {
  const left = FREE_SHIPPING_CENTS - subtotalCents;
  const pct = Math.min(100, (subtotalCents / FREE_SHIPPING_CENTS) * 100);
  return (
    <div className="rounded-xl bg-soft p-3 text-sm">
      <p className="mb-2 flex items-center gap-2">
        <Truck className="size-4 text-brand-600 dark:text-brand-400" />
        {left > 0 ? <>You're <b>{formatPrice(left)}</b> away from free shipping</> : <span>This order ships <b>free</b>.</span>}
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-ink transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Slide-over cart, opened from the header or the "View cart" toast action. */
export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQuantity, removeFromCart } = useStore();
  const toast = useToast();
  const location = useLocation();
  useEffect(() => {
    setCartOpen(false);
  }, [location.pathname, setCartOpen]);
  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cartOpen, setCartOpen]);

  const run = (fn: () => Promise<void>) => fn().catch((e: Error) => toast({ kind: "error", title: "Couldn't update your bag", body: e.message }));

  return (
    <div className={`fixed inset-0 z-[60] ${cartOpen ? "" : "pointer-events-none"}`} aria-hidden={!cartOpen}>
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${cartOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setCartOpen(false)} />
      <aside
        role="dialog"
        aria-label="Your bag"
        className={`absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-card shadow-2xl transition-transform duration-300 ${cartOpen ? "translate-x-0" : "translate-x-full rtl:-translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-line p-5">
          <h2 className="text-lg font-bold">Your bag {cart?.itemCount ? <span className="text-ink-3">({cart.itemCount})</span> : null}</h2>
          <button onClick={() => setCartOpen(false)} className="cursor-pointer rounded-lg p-1.5 hover:bg-soft" aria-label="Close bag"><X className="size-5" /></button>
        </div>
        {!cart || cart.items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="mb-4 size-14 text-ink-3" />
            <p className="font-semibold">Your bag is empty</p>
            <p className="mt-1 text-sm text-ink-2">Have a look around. Anything you add will wait here.</p>
            <button onClick={() => setCartOpen(false)} className="mt-6 cursor-pointer rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Keep shopping</button>
          </div>
        ) : (
          <>
            <div className="p-5 pb-0"><FreeShippingMeter subtotalCents={cart.subtotalCents} /></div>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {cart.items.map(({ product: p, quantity, lineTotalCents }) => (
                <li key={p.id} className="flex gap-3 py-4" data-testid="drawer-item">
                  <Link to={`/product/${p.slug}`}><img src={img(p.imageUrl, 160)} alt={p.name} className="size-20 rounded-xl object-cover" /></Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link to={`/product/${p.slug}`} className="truncate font-medium hover:text-brand-600">{p.name}</Link>
                    <p className="text-xs text-ink-3">{formatPrice(p.finalPriceCents)} each</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center rounded-lg border border-line">
                        <button disabled={quantity <= 1} onClick={() => run(() => setQuantity(p.id, quantity - 1))} className="cursor-pointer p-1.5 disabled:opacity-30" aria-label={`Decrease ${p.name}`}><Minus className="size-3.5" /></button>
                        <span className="w-7 text-center text-sm">{quantity}</span>
                        <button disabled={quantity >= p.stock} onClick={() => run(() => setQuantity(p.id, quantity + 1))} className="cursor-pointer p-1.5 disabled:opacity-30" aria-label={`Increase ${p.name}`}><Plus className="size-3.5" /></button>
                      </div>
                      <span className="font-semibold">{formatPrice(lineTotalCents)}</span>
                    </div>
                  </div>
                  <button onClick={() => run(() => removeFromCart(p.id))} className="cursor-pointer self-start p-1 text-ink-3 hover:text-rose-600" aria-label={`Remove ${p.name}`}><Trash2 className="size-4" /></button>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-line p-5">
              <div className="flex justify-between text-base font-semibold"><span>Subtotal</span><span>{formatPrice(cart.subtotalCents)}</span></div>
              <p className="text-xs text-ink-3">Shipping and discounts are calculated at checkout.</p>
              <Link to="/checkout" className="block rounded-xl bg-brand-600 py-3 text-center font-semibold text-white hover:bg-brand-700">Checkout</Link>
              <Link to="/cart" className="block rounded-xl border border-line py-2.5 text-center text-sm font-semibold hover:bg-soft">View full bag</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
