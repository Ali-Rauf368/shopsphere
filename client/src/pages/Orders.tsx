import { CheckCircle2, ChevronRight, CircleDot, Package, PackageCheck, Truck, XCircle } from "lucide-react";
import { Link, Navigate, useParams, useSearchParams } from "react-router";
import { Button, Card, EmptyState, ErrorBox, Loading, PageTitle } from "../components/ui";
import { api, formatPrice, img, type Order, type OrderStatus } from "../lib/api";
import { useTitle } from "../lib/hooks";
import { useStore } from "../lib/store";
import { useToast } from "../lib/toast";
import { useApi } from "../lib/useApi";

export const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  paid: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  shipped: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}>{status}</span>;
}

const STEPS: { status: OrderStatus; label: string; icon: typeof Package }[] = [
  { status: "paid", label: "Order placed", icon: CircleDot },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Delivered", icon: PackageCheck },
];

function Timeline({ order }: { order: Order }) {
  if (order.status === "cancelled") {
    const at = order.events.find((e) => e.status === "cancelled")?.at;
    return <p className="flex items-center gap-2 rounded-xl bg-rose-50 p-4 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"><XCircle className="size-5" /> Cancelled{at && ` on ${new Date(at).toLocaleDateString()}`}. Any payment has been refunded.</p>;
  }
  const reached = STEPS.findIndex((s) => s.status === order.status);
  return (
    <ol className="grid grid-cols-3" aria-label="Order progress">
      {STEPS.map((s, i) => {
        const done = i <= reached;
        const at = order.events.find((e) => e.status === s.status)?.at;
        return (
          <li key={s.status} className="relative flex flex-col items-center text-center">
            {i > 0 && <span className={`absolute end-1/2 top-5 h-1 w-full -translate-y-1/2 ${done ? "bg-brand-600" : "bg-line"}`} />}
            <span className={`relative grid size-10 place-items-center rounded-full ${done ? "bg-brand-600 text-white" : "bg-soft text-ink-3"}`}><s.icon className="size-5" /></span>
            <span className={`mt-2 text-sm font-semibold ${done ? "" : "text-ink-3"}`}>{s.label}</span>
            <span className="text-xs text-ink-3">{at ? new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : i === reached + 1 ? "Up next" : " "}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function OrdersPage() {
  useTitle("My orders");
  const { user, ready } = useStore();
  const { data, error, loading } = useApi<{ orders: Order[] }>(user ? "/orders" : null);

  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: "/orders" }} replace />;
  if (error) return <ErrorBox error={error} />;
  if (loading && !data) return <Loading />;
  if (data?.orders.length === 0) return <EmptyState icon={Package} title="No orders yet" body="When you place an order, you'll be able to track it here." action={{ label: "Start shopping", to: "/" }} />;

  return (
    <>
      <PageTitle sub={`${data?.orders.length} orders`}>My orders</PageTitle>
      <div className="space-y-4">
        {data?.orders.map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`} className="block" data-testid="order">
            <Card className="flex flex-wrap items-center gap-4 p-5 transition hover:border-brand-500/50 hover:shadow-lg">
              <div className="flex -space-x-3">
                {o.items.slice(0, 3).map((i) => <img key={i.productId} src={img(i.imageUrl, 120)} alt="" className="size-14 rounded-xl border-2 border-card object-cover" />)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold">Order #{o.id} <StatusBadge status={o.status} /></p>
                <p className="truncate text-sm text-ink-2">{o.items.map((i) => i.name).join(", ")}</p>
                <p className="text-xs text-ink-3">{new Date(o.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</p>
              </div>
              <p className="font-bold">{formatPrice(o.totalCents)}</p>
              <ChevronRight className="size-5 text-ink-3" />
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}

export function OrderDetailPage() {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const { user, ready } = useStore();
  const toast = useToast();
  const { data, error, reload } = useApi<{ order: Order }>(user ? `/orders/${id}` : null);
  useTitle(`Order #${id}`);

  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: `/orders/${id}` }} replace />;
  if (error) return <ErrorBox error={error} />;
  if (!data) return <Loading />;
  const o = data.order;

  const cancel = async () => {
    if (!confirm("Cancel this order? Items will be returned to stock.")) return;
    try {
      await api(`/orders/${o.id}/cancel`, { method: "POST" });
      toast({ kind: "success", title: "Order cancelled" });
      reload();
    } catch (e) {
      toast({ kind: "error", title: "Couldn't cancel", body: (e as Error).message });
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {params.get("placed") && (
        <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center text-white" role="status">
          <CheckCircle2 className="mx-auto mb-3 size-14" />
          <h1 className="text-3xl font-extrabold">Thank you, {o.recipientName?.split(" ")[0]}!</h1>
          <p className="mt-2 text-emerald-50">Order #{o.id} has been placed. We'll email you when it ships.</p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/orders" className="text-sm text-ink-3 hover:text-ink">← All orders</Link>
          <h2 className="mt-1 flex items-center gap-3 text-2xl font-extrabold">Order #{o.id} <StatusBadge status={o.status} /></h2>
          <p className="text-sm text-ink-3">Placed {new Date(o.createdAt).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })}</p>
        </div>
        {(o.status === "paid" || o.status === "pending") && <Button variant="secondary" onClick={cancel} className="text-rose-600">Cancel order</Button>}
      </div>
      <Card className="p-6"><Timeline order={o} /></Card>
      <div className="grid gap-6 md:grid-cols-[1fr_18rem]">
        <Card className="divide-y divide-line">
          {o.items.map((i) => (
            <Link key={i.productId} to={`/product/${i.slug}`} className="flex items-center gap-4 p-4 hover:bg-soft">
              <img src={img(i.imageUrl, 120)} alt="" className="size-16 rounded-xl object-cover" />
              <div className="flex-1"><p className="font-medium">{i.name}</p><p className="text-sm text-ink-3">{i.quantity} × {formatPrice(i.unitPriceCents)}</p></div>
              <p className="font-semibold">{formatPrice(i.quantity * i.unitPriceCents)}</p>
            </Link>
          ))}
        </Card>
        <div className="space-y-6">
          <Card className="p-5 text-sm">
            <p className="mb-2 font-semibold">Delivery address</p>
            <p>{o.recipientName}</p>
            <p className="text-ink-2">{o.shippingAddress}</p>
            {o.phone && <p className="text-ink-2">{o.phone}</p>}
          </Card>
          <Card className="space-y-2 p-5 text-sm">
            <div className="flex justify-between"><span className="text-ink-2">Subtotal</span><span>{formatPrice(o.subtotalCents)}</span></div>
            {o.discountCents > 0 && <div className="flex justify-between text-emerald-600"><span>Discount {o.couponCode && `(${o.couponCode})`}</span><span>−{formatPrice(o.discountCents)}</span></div>}
            <div className="flex justify-between"><span className="text-ink-2">Shipping</span><span>{o.shippingCents ? formatPrice(o.shippingCents) : "Free"}</span></div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><span>Total</span><span>{formatPrice(o.totalCents)}</span></div>
          </Card>
        </div>
      </div>
    </div>
  );
}
