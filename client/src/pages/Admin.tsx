import { DollarSign, Package, ShoppingBag, Users } from "lucide-react";
import { Navigate } from "react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ErrorBox, Loading, PageTitle } from "../components/Layout";
import { api, formatPrice, type AdminStats, type Order } from "../lib/api";
import { useStore } from "../lib/store";
import { useApi } from "../lib/useApi";
import { STATUS_STYLES } from "./Orders";

const dollars = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;

export function AdminPage() {
  const { user, ready } = useStore();
  const isAdmin = user?.role === "admin";
  const stats = useApi<AdminStats>(isAdmin ? "/admin/stats" : null);
  const orders = useApi<{ orders: Order[] }>(isAdmin ? "/admin/orders" : null);

  if (!ready) return <Loading />;
  if (!isAdmin) return <Navigate to="/" replace />;
  if (stats.error) return <ErrorBox error={stats.error} />;
  if (!stats.data) return <Loading />;
  const s = stats.data;

  const setStatus = async (id: number, status: string) => {
    await api(`/admin/orders/${id}`, { method: "PATCH", body: { status } });
    orders.reload();
    stats.reload();
  };

  const tiles = [
    [DollarSign, "Revenue", formatPrice(s.totals.revenueCents)],
    [ShoppingBag, "Orders", s.totals.orders],
    [Users, "Customers", s.totals.customers],
    [Package, "Products", s.totals.products],
  ] as const;

  return (
    <div className="space-y-8">
      <PageTitle sub="Last 30 days">Dashboard</PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([Icon, label, value]) => (
          <div key={label} className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
            <span className="rounded-lg bg-brand-50 p-3 text-brand-600"><Icon className="size-6" /></span>
            <div>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="text-2xl font-bold" data-testid={`stat-${label.toLowerCase()}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 font-semibold">Daily revenue</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={s.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} fontSize={12} />
              <YAxis tickFormatter={dollars} fontSize={12} width={60} />
              <Tooltip formatter={(v) => formatPrice(Number(v))} />
              <Line type="monotone" dataKey="revenueCents" name="Revenue" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Revenue by department</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={s.revenueByCategory} layout="vertical">
              <XAxis type="number" tickFormatter={dollars} fontSize={12} />
              <YAxis type="category" dataKey="category" width={100} fontSize={12} />
              <Tooltip formatter={(v) => formatPrice(Number(v))} />
              <Bar dataKey="revenueCents" name="Revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="overflow-x-auto rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 font-semibold">Recent orders</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 uppercase">
              <tr><th className="py-2 text-start">Order</th><th className="text-start">Date</th><th className="text-start">Items</th><th className="text-end">Total</th><th className="text-end">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.data?.orders.slice(0, 15).map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="py-2">#{o.id}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td className="text-end">{formatPrice(o.totalCents)}</td>
                  <td className="text-end">
                    <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className={`cursor-pointer rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[o.status]}`}>
                      {Object.keys(STATUS_STYLES).map((st) => <option key={st}>{st}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Low stock</h2>
          <ul className="space-y-2 text-sm">
            {s.lowStock.map((p) => (
              <li key={p.id} className="flex justify-between"><span>{p.name}</span><span className="font-semibold text-amber-600">{p.stock} left</span></li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
