import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { Loading, PageTitle } from "../components/Layout";
import { api, formatPrice, type Order } from "../lib/api";
import { useStore } from "../lib/store";

const FREE_SHIPPING_CENTS = 5000;
const SHIPPING_CENTS = 499;

export function CartPage() {
  const { user, ready, cart, setQuantity, removeFromCart, refreshCart } = useStore();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: "/cart" }} replace />;
  if (!cart) return <Loading />;

  if (cart.items.length === 0) {
    return (
      <div className="py-20 text-center">
        <ShoppingBag className="mx-auto mb-4 size-16 text-slate-300" />
        <p className="mb-4 text-lg text-slate-600">Your cart is empty.</p>
        <Link to="/" className="rounded-lg bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700">Start shopping</Link>
      </div>
    );
  }

  // Shipping is shown for information; the server charges item totals only.
  const shipping = cart.subtotalCents >= FREE_SHIPPING_CENTS ? 0 : SHIPPING_CENTS;

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const checkout = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    await run(async () => {
      const { order } = await api<{ order: Order }>("/orders", { method: "POST", body: { shippingAddress: address } });
      await refreshCart();
      navigate(`/orders?placed=${order.id}`);
    });
    setBusy(false);
  };

  return (
    <>
      <PageTitle>Shopping cart</PageTitle>
      <div className="grid gap-8 lg:grid-cols-3">
        <ul className="divide-y divide-slate-200 rounded-xl bg-white shadow-sm lg:col-span-2">
          {cart.items.map(({ product: p, quantity, lineTotalCents }) => (
            <li key={p.id} className="flex gap-4 p-4" data-testid="cart-item">
              <img src={p.imageUrl} alt={p.name} className="size-24 rounded-lg object-cover" />
              <div className="flex flex-1 flex-col">
                <Link to={`/product/${p.slug}`} className="font-semibold hover:text-brand-600">{p.name}</Link>
                <p className="text-sm text-slate-500">{formatPrice(p.finalPriceCents)} each</p>
                <div className="mt-auto flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-slate-300">
                    <button disabled={quantity <= 1} onClick={() => run(() => setQuantity(p.id, quantity - 1))} className="cursor-pointer p-1.5 disabled:opacity-30" aria-label="Decrease"><Minus className="size-4" /></button>
                    <span className="w-8 text-center text-sm">{quantity}</span>
                    <button onClick={() => run(() => setQuantity(p.id, quantity + 1))} className="cursor-pointer p-1.5" aria-label="Increase"><Plus className="size-4" /></button>
                  </div>
                  <button onClick={() => run(() => removeFromCart(p.id))} className="cursor-pointer text-slate-400 hover:text-red-600" aria-label="Remove"><Trash2 className="size-4" /></button>
                </div>
              </div>
              <p className="font-semibold">{formatPrice(lineTotalCents)}</p>
            </li>
          ))}
        </ul>
        <form onSubmit={checkout} className="h-fit space-y-4 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Items ({cart.itemCount})</dt><dd>{formatPrice(cart.subtotalCents)}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping ? formatPrice(shipping) : "Free"}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold"><dt>Total</dt><dd data-testid="cart-total">{formatPrice(cart.subtotalCents)}</dd></div>
          </dl>
          <p className="text-xs text-slate-500">Shipping is free during launch week.</p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Shipping address</span>
            <textarea required minLength={10} rows={3} value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2 text-sm" placeholder="Street, city, postcode, country" />
          </label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="w-full cursor-pointer rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-60">Place order</button>
        </form>
      </div>
    </>
  );
}
