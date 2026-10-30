import { AlertTriangle, DollarSign, Package, Pencil, Plus, Receipt, Search, ShoppingBag, Trash2, Users, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useSearchParams } from "react-router";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart } from "recharts";
import { Button, Card, ErrorBox, Field, Loading, PageTitle } from "../components/ui";
import { api, formatPrice, img, type AdminStats, type Category, type Order, type Paged, type Product } from "../lib/api";
import { useDebounced, useTitle } from "../lib/hooks";
import { useStore } from "../lib/store";
import { useToast } from "../lib/toast";
import { useApi } from "../lib/useApi";
import { STATUS_STYLES } from "./Orders";

const dollars = (cents: number) => `$${Math.round(cents / 100).toLocaleString()}`;
const tooltipStyle = { background: "var(--card)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink)" };
const BAR_COLORS = ["#8a4122", "#a9532c", "#c46a3f", "#d98a62", "#e7b192", "#f1d3bf"];

function Overview() {
  const stats = useApi<AdminStats>("/admin/stats");
  if (stats.error) return <ErrorBox error={stats.error} />;
  if (!stats.data) return <Loading />;
  const s = stats.data;
  const last7 = s.daily.slice(-7).reduce((n, d) => n + d.revenueCents, 0);
  const prev7 = s.daily.slice(-14, -7).reduce((n, d) => n + d.revenueCents, 0);
  const trend = prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : 0;

  const tiles = [
    [DollarSign, "Revenue", formatPrice(s.totals.revenueCents), `All time · ${trend >= 0 ? "+" : ""}${trend}% vs prior week`],
    [ShoppingBag, "Orders", s.totals.orders, "All time"],
    [Receipt, "Avg. order", formatPrice(s.totals.orders ? Math.round(s.totals.revenueCents / s.totals.orders) : 0), "Excl. cancelled"],
    [Users, "Customers", s.totals.customers, `${s.totals.products} products listed`],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([Icon, label, value, sub]) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-2">{label}</p>
              <span className="rounded-lg bg-brand-50 p-2 text-brand-600 dark:bg-soft dark:text-brand-400"><Icon className="size-4" /></span>
            </div>
            <p className="mt-2 text-3xl" data-testid={`stat-${label.toLowerCase()}`}>{value}</p>
            <p className="mt-1 text-xs text-ink-3">{sub}</p>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Daily revenue <span className="text-sm font-normal text-ink-3">· last 30 days</span></h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={s.daily}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#c46a3f" stopOpacity={0.35} /><stop offset="100%" stopColor="#c46a3f" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="day" tickFormatter={(d: string) => d.slice(5)} fontSize={12} stroke="var(--ink-3)" tickLine={false} />
              <YAxis tickFormatter={dollars} fontSize={12} width={60} stroke="var(--ink-3)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatPrice(Number(v))} />
              <Area type="monotone" dataKey="revenueCents" name="Revenue" stroke="#a9532c" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 font-semibold">Revenue by department</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={s.revenueByCategory} layout="vertical" margin={{ left: 0 }}>
              <XAxis type="number" tickFormatter={dollars} fontSize={11} stroke="var(--ink-3)" tickLine={false} />
              <YAxis type="category" dataKey="category" width={105} fontSize={12} stroke="var(--ink-3)" tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatPrice(Number(v))} cursor={{ fill: "var(--soft)" }} />
              <Bar dataKey="revenueCents" name="Revenue" radius={[0, 6, 6, 0]}>
                {s.revenueByCategory.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold"><AlertTriangle className="size-4 text-amber-500" /> Low stock</h2>
        {s.lowStock.length === 0 ? <p className="text-sm text-ink-3">Everything is well stocked.</p> : (
          <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {s.lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-xl bg-soft px-3 py-2"><span className="truncate">{p.name}</span><span className={`font-semibold ${p.stock === 0 ? "text-rose-600" : "text-amber-600"}`}>{p.stock === 0 ? "Sold out" : `${p.stock} left`}</span></li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

type Draft = { id?: number; slug: string; name: string; description: string; price: string; discountPercent: string; stock: string; imageUrl: string; featured: boolean; highlights: string; categoryId: string };

const toDraft = (p?: Product): Draft => ({
  id: p?.id,
  slug: p?.slug ?? "",
  name: p?.name ?? "",
  description: p?.description ?? "",
  price: p ? (p.priceCents / 100).toFixed(2) : "",
  discountPercent: String(p?.discountPercent ?? 0),
  stock: String(p?.stock ?? 10),
  imageUrl: p?.imageUrl ?? "",
  featured: p?.featured ?? false,
  highlights: p?.highlights.join("\n") ?? "",
  categoryId: p ? String(p.category.id) : "",
});

function ProductEditor({ draft, onClose, onSaved }: { draft: Draft; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const cats = useApi<{ categories: Category[] }>("/categories");
  const [d, setD] = useState(draft);
  const [busy, setBusy] = useState(false);
  const bind = (k: keyof Draft) => ({ value: d[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setD({ ...d, [k]: e.target.value }) });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const body = {
      slug: d.slug || d.name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name: d.name,
      description: d.description,
      priceCents: Math.round(Number(d.price) * 100),
      discountPercent: Number(d.discountPercent),
      stock: Number(d.stock),
      imageUrl: d.imageUrl,
      featured: d.featured,
      highlights: d.highlights.split("\n").map((h) => h.trim()).filter(Boolean),
      categoryId: Number(d.categoryId),
    };
    try {
      await api(d.id ? `/products/${d.id}` : "/products", { method: d.id ? "PATCH" : "POST", body });
      toast({ kind: "success", title: d.id ? "Product updated" : "Product created", body: d.name });
      onSaved();
    } catch (err) {
      toast({ kind: "error", title: "Not saved", body: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full rounded-xl border border-line bg-card px-3.5 py-2.5 outline-none focus:border-brand-500";
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-label={d.id ? "Edit product" : "New product"}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={submit} className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">{d.id ? "Edit product" : "New product"}</h2>
          <button type="button" onClick={onClose} className="cursor-pointer rounded-lg p-1.5 hover:bg-soft" aria-label="Close"><X className="size-5" /></button>
        </div>
        <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
          <div className="aspect-square overflow-hidden rounded-xl bg-soft">{d.imageUrl && <img src={img(d.imageUrl, 300, 300)} alt="" className="size-full object-cover" />}</div>
          <div className="space-y-4">
            <Field label="Name" required minLength={2} {...bind("name")} />
            <Field label="Image URL" type="url" required {...bind("imageUrl")} />
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <Field label="Price ($)" type="number" step="0.01" min="0" required {...bind("price")} />
          <Field label="Discount %" type="number" min="0" max="90" {...bind("discountPercent")} />
          <Field label="Stock" type="number" min="0" required {...bind("stock")} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Collection</span>
            <select required {...bind("categoryId")} className={input}>
              <option value="">Choose…</option>
              {cats.data?.categories.map((c) => (
                <optgroup key={c.id} label={c.name}>{c.children.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-medium">Description</span>
          <textarea rows={3} {...bind("description")} className={input} />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-medium">Highlights <span className="font-normal text-ink-3">(one per line)</span></span>
          <textarea rows={3} {...bind("highlights")} className={input} />
        </label>
        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={d.featured} onChange={(e) => setD({ ...d, featured: e.target.checked })} className="size-4 accent-brand-600" /> Featured product
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button busy={busy}>{d.id ? "Save changes" : "Create product"}</Button>
        </div>
      </form>
    </div>
  );
}

function ProductsTab() {
  const toast = useToast();
  const [q, setQ] = useState("");
  const debounced = useDebounced(q, 250);
  const [editing, setEditing] = useState<Draft | null>(null);
  const list = useApi<Paged<Product>>(`/products?pageSize=60&sort=name${debounced ? `&q=${encodeURIComponent(debounced)}` : ""}`);

  const remove = async (p: Product) => {
    if (!confirm(`Delete “${p.name}”? This cannot be undone.`)) return;
    try {
      await api(`/products/${p.id}`, { method: "DELETE" });
      toast({ kind: "success", title: "Product deleted", body: p.name });
      list.reload();
    } catch (e) {
      toast({ kind: "error", title: "Not deleted", body: (e as Error).message });
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" aria-label="Search products" className="w-full rounded-xl border border-line bg-card py-2 ps-9 pe-3 text-sm outline-none focus:border-brand-500" />
        </div>
        <Button icon={Plus} onClick={() => setEditing(toDraft())}>New product</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-soft text-xs text-ink-2 uppercase">
            <tr><th className="px-4 py-3 text-start">Product</th><th className="px-4 text-start">Collection</th><th className="px-4 text-end">Price</th><th className="px-4 text-end">Stock</th><th className="px-4 text-end">Sold</th><th className="px-4" /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.data?.products.map((p) => (
              <tr key={p.id} className="hover:bg-soft/60">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <img src={img(p.imageUrl, 80)} alt="" className="size-10 rounded-lg object-cover" />
                    <span className="font-medium">{p.name}{p.featured && <span className="ms-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase">Featured</span>}</span>
                  </div>
                </td>
                <td className="px-4 text-ink-2">{p.category.name}</td>
                <td className="px-4 text-end whitespace-nowrap">{formatPrice(p.finalPriceCents)}{p.discountPercent > 0 && <span className="ms-1 text-xs text-rose-600">−{p.discountPercent}%</span>}</td>
                <td className={`px-4 text-end font-semibold ${p.stock === 0 ? "text-rose-600" : p.stock < 10 ? "text-amber-600" : ""}`}>{p.stock}</td>
                <td className="px-4 text-end text-ink-2">{p.soldCount}</td>
                <td className="px-4 text-end whitespace-nowrap">
                  <button onClick={() => setEditing(toDraft(p))} className="cursor-pointer rounded-lg p-2 text-ink-2 hover:bg-soft hover:text-ink" aria-label={`Edit ${p.name}`}><Pencil className="size-4" /></button>
                  <button onClick={() => remove(p)} className="cursor-pointer rounded-lg p-2 text-ink-2 hover:bg-rose-50 hover:text-rose-600" aria-label={`Delete ${p.name}`}><Trash2 className="size-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.loading && !list.data && <Loading />}
      </div>
      {editing && <ProductEditor draft={editing} onClose={() => setEditing(null)} onSaved={() => (setEditing(null), list.reload())} />}
    </Card>
  );
}

function OrdersTab() {
  const toast = useToast();
  const orders = useApi<{ orders: Order[] }>("/admin/orders");
  const [filter, setFilter] = useState<string>("all");
  const setStatus = async (id: number, status: string) => {
    try {
      await api(`/admin/orders/${id}`, { method: "PATCH", body: { status } });
      toast({ kind: "success", title: `Order #${id} marked ${status}` });
      orders.reload();
    } catch (e) {
      toast({ kind: "error", title: "Not updated", body: (e as Error).message });
    }
  };
  const rows = (orders.data?.orders ?? []).filter((o) => filter === "all" || o.status === filter);
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap gap-2 border-b border-line p-4">
        {["all", ...Object.keys(STATUS_STYLES)].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`cursor-pointer rounded-full px-3 py-1 text-sm font-medium capitalize ${filter === s ? "bg-brand-600 text-white" : "bg-soft text-ink-2 hover:text-ink"}`}>
            {s} {s !== "all" && <span className="opacity-70">({orders.data?.orders.filter((o) => o.status === s).length ?? 0})</span>}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-soft text-xs text-ink-2 uppercase">
            <tr><th className="px-4 py-3 text-start">Order</th><th className="px-4 text-start">Customer</th><th className="px-4 text-start">Date</th><th className="px-4 text-end">Items</th><th className="px-4 text-end">Total</th><th className="px-4 text-end">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-soft/60">
                <td className="px-4 py-2.5 font-medium">#{o.id}</td>
                <td className="px-4">{o.recipientName ?? "—"}</td>
                <td className="px-4 whitespace-nowrap text-ink-2">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 text-end">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                <td className="px-4 text-end font-semibold">{formatPrice(o.totalCents)}</td>
                <td className="px-4 text-end">
                  <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} aria-label={`Status of order ${o.id}`} className={`cursor-pointer rounded-full border-0 px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[o.status]}`}>
                    {Object.keys(STATUS_STYLES).map((st) => <option key={st}>{st}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.loading && !orders.data && <Loading />}
      </div>
    </Card>
  );
}

const TABS = { overview: ["Overview", Overview], products: ["Products", ProductsTab], orders: ["Orders", OrdersTab] } as const;

export function AdminPage() {
  useTitle("Admin dashboard");
  const { user, ready } = useStore();
  const [params, setParams] = useSearchParams();
  const tab = (params.get("tab") ?? "overview") as keyof typeof TABS;
  if (!ready) return <Loading />;
  if (user?.role !== "admin") return <Navigate to="/" replace />;
  const [, Tab] = TABS[tab] ?? TABS.overview;
  return (
    <>
      <PageTitle eyebrow="Admin" sub="Store performance at a glance">Dashboard</PageTitle>
      <div className="mb-6 flex gap-1 rounded-2xl bg-soft p-1 sm:w-fit" role="tablist">
        {Object.entries(TABS).map(([key, [label]]) => (
          <button key={key} role="tab" aria-selected={tab === key} onClick={() => setParams({ tab: key })} className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold transition sm:flex-none ${tab === key ? "bg-card text-ink shadow" : "text-ink-2 hover:text-ink"}`}>
            {key === "products" && <Package className="size-4" />}{label}
          </button>
        ))}
      </div>
      <Tab />
    </>
  );
}
