import { Banknote, Check, CreditCard, Lock, Tag, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { Button, Card, Field, Loading, PageTitle } from "../components/ui";
import { api, ApiError, formatPrice, img, type Order, type Quote } from "../lib/api";
import { useTitle } from "../lib/hooks";
import { useStore } from "../lib/store";
import { useToast } from "../lib/toast";

const ADDRESS_KEY = "shopsphere.address";
interface Address { name: string; phone: string; street: string; city: string; postcode: string; country: string }

function savedAddress(fallbackName: string): Address {
  try {
    const a = JSON.parse(localStorage.getItem(ADDRESS_KEY) ?? "null");
    if (a) return a;
  } catch {
    // fall through to an empty form
  }
  return { name: fallbackName, phone: "", street: "", city: "", postcode: "", country: "" };
}

function Steps({ step }: { step: 1 | 2 }) {
  return (
    <ol className="mb-8 flex items-center gap-3 text-sm font-semibold">
      {["Shipping", "Review & pay"].map((label, i) => {
        const n = i + 1;
        const done = step > n;
        return (
          <li key={label} className="flex items-center gap-3">
            {i > 0 && <span className={`h-0.5 w-10 rounded ${step >= n ? "bg-brand-600" : "bg-line"}`} />}
            <span className={`grid size-8 place-items-center rounded-full ${done ? "bg-emerald-500 text-white" : step === n ? "bg-brand-600 text-white" : "bg-soft text-ink-3"}`}>{done ? <Check className="size-4" /> : n}</span>
            <span className={step === n ? "text-ink" : "text-ink-3"}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function CheckoutPage() {
  useTitle("Checkout");
  const { user, ready, cart, refreshCart } = useStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [address, setAddress] = useState<Address>(() => savedAddress(user?.name ?? ""));
  const [payment, setPayment] = useState<"card" | "cod">("card");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [placing, setPlacing] = useState(false);
  // Set once the order exists, so the empty-cart redirect below can't win the race to the confirmation page.
  const [placedId, setPlacedId] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    api<Quote>(`/cart/quote${coupon ? `?coupon=${encodeURIComponent(coupon)}` : ""}`)
      .then(setQuote)
      .catch((e: Error) => {
        setCouponError(e.message);
        setCoupon(null);
      });
  }, [user, coupon, cart?.subtotalCents]);

  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: "/checkout" }} replace />;
  if (!cart || !quote) return <Loading />;
  if (placedId) return <Navigate to={`/orders/${placedId}?placed=1`} replace />;
  if (cart.items.length === 0) return <Navigate to="/cart" replace />;

  const bind = (k: keyof Address) => ({ value: address[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setAddress({ ...address, [k]: e.target.value }) });

  const toReview = (e: FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem(ADDRESS_KEY, JSON.stringify(address));
    } catch {
      // Remembering the address is optional.
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const { order } = await api<{ order: Order }>("/orders", {
        method: "POST",
        body: {
          recipientName: address.name,
          ...(address.phone ? { phone: address.phone } : {}),
          shippingAddress: `${address.street}, ${address.postcode} ${address.city}, ${address.country}`,
          ...(coupon ? { couponCode: coupon } : {}),
        },
      });
      setPlacedId(order.id);
      navigate(`/orders/${order.id}?placed=1`, { replace: true });
      await refreshCart();
    } catch (e) {
      const err = e as ApiError;
      toast({ kind: "error", title: "Order not placed", body: err.message });
      if (err.status === 409) await refreshCart();
    } finally {
      setPlacing(false);
    }
  };

  const summary = (
    <Card className="h-fit space-y-4 p-6 lg:sticky lg:top-20">
      <h2 className="text-lg font-bold">Order summary</h2>
      <ul className="max-h-64 space-y-3 overflow-y-auto">
        {cart.items.map(({ product: p, quantity, lineTotalCents }) => (
          <li key={p.id} className="flex items-center gap-3 text-sm">
            <span className="relative">
              <img src={img(p.imageUrl, 120)} alt="" className="size-14 rounded-lg object-cover" />
              <span className="absolute -end-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-slate-700 text-[10px] font-bold text-white">{quantity}</span>
            </span>
            <span className="min-w-0 flex-1 truncate">{p.name}</span>
            <span className="font-medium">{formatPrice(lineTotalCents)}</span>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!couponInput.trim()) return;
          setCouponError(null);
          setCoupon(couponInput.trim().toUpperCase());
        }}
        className="flex gap-2 border-t border-line pt-4"
      >
        <div className="relative flex-1">
          <Tag className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" className="w-full rounded-xl border border-line bg-card py-2.5 ps-9 pe-3 text-sm uppercase outline-none placeholder:normal-case focus:border-brand-500" />
        </div>
        <Button variant="secondary">Apply</Button>
      </form>
      {couponError && <p className="text-sm text-rose-600" role="alert">{couponError}</p>}
      {quote.coupon && (
        <p className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          <span><b>{quote.coupon.code}</b> · {quote.coupon.description}</span>
          <button onClick={() => (setCoupon(null), setCouponInput(""))} className="cursor-pointer p-1" aria-label="Remove coupon"><X className="size-4" /></button>
        </p>
      )}
      <dl className="space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between"><dt className="text-ink-2">Subtotal</dt><dd>{formatPrice(quote.subtotalCents)}</dd></div>
        {quote.discountCents > 0 && <div className="flex justify-between text-emerald-600"><dt>Discount</dt><dd>−{formatPrice(quote.discountCents)}</dd></div>}
        <div className="flex justify-between"><dt className="text-ink-2">Shipping</dt><dd>{quote.shippingCents ? formatPrice(quote.shippingCents) : <span className="font-semibold text-emerald-600">Free</span>}</dd></div>
        <div className="flex justify-between border-t border-line pt-3 text-lg font-bold"><dt>Total</dt><dd data-testid="checkout-total">{formatPrice(quote.totalCents)}</dd></div>
      </dl>
    </Card>
  );

  return (
    <>
      <PageTitle>Checkout</PageTitle>
      <Steps step={step} />
      <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
        {step === 1 ? (
          <Card className="p-6 sm:p-8">
            <form onSubmit={toReview} className="space-y-5">
              <h2 className="text-lg font-bold">Where should we send it?</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" autoComplete="name" required minLength={2} {...bind("name")} />
                <Field label="Phone (optional)" type="tel" autoComplete="tel" pattern="[+0-9 ()\-]{6,20}" hint="For delivery updates" {...bind("phone")} />
              </div>
              <Field label="Street address" autoComplete="street-address" required minLength={4} {...bind("street")} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="City" autoComplete="address-level2" required {...bind("city")} />
                <Field label="Postcode" autoComplete="postal-code" required {...bind("postcode")} />
                <Field label="Country" autoComplete="country-name" required {...bind("country")} />
              </div>
              <Button className="w-full py-3 sm:w-auto">Continue to review</Button>
            </form>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="flex items-start justify-between gap-4 p-6">
              <div>
                <p className="text-sm font-semibold text-ink-3">Shipping to</p>
                <p className="mt-1 font-semibold">{address.name}</p>
                <p className="text-ink-2">{address.street}, {address.postcode} {address.city}, {address.country}</p>
                {address.phone && <p className="text-ink-2">{address.phone}</p>}
              </div>
              <button onClick={() => setStep(1)} className="cursor-pointer text-sm font-semibold text-brand-600 hover:underline">Edit</button>
            </Card>
            <Card className="p-6">
              <p className="mb-4 font-bold">Payment method</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {([["card", CreditCard, "Card", "Demo mode: no card is charged"], ["cod", Banknote, "Cash on delivery", "Pay when it arrives"]] as const).map(([v, Icon, label, hint]) => (
                  <label key={v} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition ${payment === v ? "border-brand-600 bg-brand-50/50 dark:bg-soft" : "border-line hover:border-ink-3"}`}>
                    <input type="radio" name="payment" checked={payment === v} onChange={() => setPayment(v)} className="sr-only" />
                    <Icon className="size-6 text-brand-600 dark:text-brand-400" />
                    <span><span className="block font-semibold">{label}</span><span className="text-xs text-ink-3">{hint}</span></span>
                  </label>
                ))}
              </div>
            </Card>
            <Button onClick={placeOrder} busy={placing} icon={Lock} className="w-full py-3.5 text-base">Place order · {formatPrice(quote.totalCents)}</Button>
            <p className="text-center text-xs text-ink-3">By placing your order you agree to our terms. This is a demo store: no payment is taken.</p>
          </div>
        )}
        {summary}
      </div>
    </>
  );
}
