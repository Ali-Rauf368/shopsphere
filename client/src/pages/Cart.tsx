import { ArrowRight, Lock, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link, Navigate } from "react-router";
import { FreeShippingMeter } from "../components/CartDrawer";
import { Card, EmptyState, Loading, PageTitle } from "../components/ui";
import { formatPrice, img } from "../lib/api";
import { useTitle } from "../lib/hooks";
import { useStore } from "../lib/store";
import { useToast } from "../lib/toast";

export function CartPage() {
  useTitle("Your bag");
  const { user, ready, cart, setQuantity, removeFromCart } = useStore();
  const toast = useToast();

  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: "/cart" }} replace />;
  if (!cart) return <Loading />;
  if (cart.items.length === 0) {
    return <EmptyState icon={ShoppingBag} title="Your bag is empty" body="Anything you add will wait here until you're ready." action={{ label: "Browse the shop", to: "/" }} />;
  }

  const run = (fn: () => Promise<void>) => fn().catch((e: Error) => toast({ kind: "error", title: "Couldn't update your bag", body: e.message }));

  return (
    <>
      <PageTitle sub={`${cart.itemCount} ${cart.itemCount === 1 ? "item" : "items"}`}>Your bag</PageTitle>
      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        <Card className="divide-y divide-line">
          {cart.items.map(({ product: p, quantity, lineTotalCents }) => (
            <div key={p.id} className="flex gap-4 p-4 sm:p-5" data-testid="cart-item">
              <Link to={`/product/${p.slug}`} className="shrink-0"><img src={img(p.imageUrl, 240)} alt={p.name} className="size-24 rounded-xl object-cover sm:size-28" /></Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs tracking-wide text-ink-3 uppercase">{p.category.name}</p>
                    <Link to={`/product/${p.slug}`} className="font-semibold hover:text-brand-600">{p.name}</Link>
                    <p className="text-sm text-ink-3">{formatPrice(p.finalPriceCents)} each{p.stock < 10 && <span className="text-amber-600"> · only {p.stock} left</span>}</p>
                  </div>
                  <p className="font-bold">{formatPrice(lineTotalCents)}</p>
                </div>
                <div className="mt-auto flex items-center gap-4 pt-3">
                  <div className="flex items-center rounded-xl border border-line">
                    <button disabled={quantity <= 1} onClick={() => run(() => setQuantity(p.id, quantity - 1))} className="cursor-pointer p-2 disabled:opacity-30" aria-label="Decrease"><Minus className="size-4" /></button>
                    <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                    <button disabled={quantity >= p.stock} onClick={() => run(() => setQuantity(p.id, quantity + 1))} className="cursor-pointer p-2 disabled:opacity-30" aria-label="Increase"><Plus className="size-4" /></button>
                  </div>
                  <button onClick={() => run(() => removeFromCart(p.id))} className="flex cursor-pointer items-center gap-1 text-sm text-ink-3 hover:text-rose-600" aria-label="Remove"><Trash2 className="size-4" /> Remove</button>
                </div>
              </div>
            </div>
          ))}
        </Card>
        <div className="space-y-4">
          <Card className="h-fit space-y-4 p-6 lg:sticky lg:top-20">
            <h2 className="text-lg font-bold">Order summary</h2>
            <FreeShippingMeter subtotalCents={cart.subtotalCents} />
            <div className="flex justify-between text-sm"><span className="text-ink-2">Subtotal</span><span className="font-semibold" data-testid="cart-total">{formatPrice(cart.subtotalCents)}</span></div>
            <p className="text-xs text-ink-3">Shipping and coupon codes are applied at checkout.</p>
            <Link to="/checkout" className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700">Proceed to checkout <ArrowRight className="size-4" /></Link>
            <p className="flex items-center justify-center gap-1.5 text-xs text-ink-3"><Lock className="size-3.5" /> Secure checkout</p>
          </Card>
        </div>
      </div>
    </>
  );
}
