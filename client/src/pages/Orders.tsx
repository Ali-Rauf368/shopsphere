import { CheckCircle2 } from "lucide-react";
import { Navigate, useSearchParams } from "react-router";
import { ErrorBox, Loading, PageTitle } from "../components/Layout";
import { api, formatPrice, type Order } from "../lib/api";
import { useStore } from "../lib/store";
import { useApi } from "../lib/useApi";

export const STATUS_STYLES: Record<Order["status"], string> = {
  pending: "bg-slate-100 text-slate-700",
  paid: "bg-blue-100 text-blue-700",
  shipped: "bg-amber-100 text-amber-800",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
};

export function OrdersPage() {
  const { user, ready } = useStore();
  const [params] = useSearchParams();
  const { data, error, loading, reload } = useApi<{ orders: Order[] }>(user ? "/orders" : null);

  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: "/orders" }} replace />;

  const cancel = async (id: number) => {
    if (!confirm("Cancel this order?")) return;
    await api(`/orders/${id}/cancel`, { method: "POST" });
    reload();
  };

  return (
    <>
      <PageTitle>My orders</PageTitle>
      {params.get("placed") && (
        <p className="mb-6 flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-emerald-800" role="status">
          <CheckCircle2 className="size-5" /> Thank you! Order #{params.get("placed")} has been placed.
        </p>
      )}
      {error && <ErrorBox error={error} />}
      {loading && !data ? <Loading /> : data?.orders.length === 0 ? <p className="text-slate-500">You haven't ordered anything yet.</p> : (
        <div className="space-y-4">
          {data?.orders.map((o) => (
            <article key={o.id} className="rounded-xl bg-white p-5 shadow-sm" data-testid="order">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">Order #{o.id}</p>
                  <p className="text-sm text-slate-500">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[o.status]}`}>{o.status}</span>
                  <span className="font-bold">{formatPrice(o.totalCents)}</span>
                </div>
              </div>
              <ul className="flex flex-wrap gap-3">
                {o.items.map((i) => (
                  <li key={i.productId} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-sm">
                    <img src={i.imageUrl} alt="" className="size-10 rounded object-cover" /> {i.quantity} × {i.name}
                  </li>
                ))}
              </ul>
              {(o.status === "paid" || o.status === "pending") && (
                <button onClick={() => cancel(o.id)} className="mt-3 cursor-pointer text-sm text-rose-600 hover:underline">Cancel order</button>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
