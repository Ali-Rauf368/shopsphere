import { Eye, Heart, Leaf, Mail, MapPin, MessageSquare, Phone, Search, Target, Users } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { Stars } from "../components/Stars";
import { Button, Card, ErrorBox, Field, Loading, PageTitle } from "../components/ui";
import { api, type Review } from "../lib/api";
import { useTitle } from "../lib/hooks";
import { useToast } from "../lib/toast";
import { useApi } from "../lib/useApi";

export function StoryPage() {
  useTitle("Our story");
  const stats = [["2019", "Founded"], ["49k+", "Happy customers"], ["6", "Departments"], ["4.6★", "Average rating"]];
  return (
    <div className="space-y-16">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <PageTitle eyebrow="About us" sub="How ShopSphere started">Our story</PageTitle>
          <div className="space-y-4 text-lg leading-relaxed text-ink-2">
            <p>E-commerce lets people buy and sell over the internet, saving time and effort for customers and businesses alike, and especially for busy people who would rather not spend their evenings in traffic.</p>
            <p>ShopSphere began with a simple idea: everything you need under one roof, in a range of quality levels, at amazing prices. From phones to frying pans, novels to running shoes, it's all here with a checkout that takes seconds.</p>
            <p>Today we work with hundreds of suppliers and ship to customers every day, and we still read every review.</p>
          </div>
        </div>
        <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&h=800&fit=crop&auto=format&q=80" alt="Inside one of our showrooms" className="rounded-3xl shadow-2xl" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(([v, l]) => (
          <Card key={l} className="p-6 text-center">
            <p className="font-display text-4xl font-extrabold text-brand-600 dark:text-brand-400">{v}</p>
            <p className="mt-1 text-sm text-ink-2">{l}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function VisionPage() {
  useTitle("Our vision");
  const pillars = [
    [Target, "Choice", "A wide catalog across every department, with options for every budget."],
    [Heart, "Care", "Friendly support, fast delivery and 30-day returns on everything."],
    [Leaf, "Responsibility", "Recyclable packaging and carbon-neutral shipping by 2028."],
    [Users, "Community", "Real reviews from real customers shape what we stock."],
  ] as const;
  return (
    <>
      <PageTitle eyebrow="About us" sub="Where we're headed">Our vision</PageTitle>
      <Card className="mb-10 flex items-start gap-4 bg-gradient-to-br from-brand-50 to-transparent p-8 dark:from-soft">
        <Eye className="size-8 shrink-0 text-brand-600 dark:text-brand-400" />
        <p className="font-display text-2xl leading-snug font-bold">To be the simplest, most trusted place to shop online, where quality and value are never a trade-off.</p>
      </Card>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map(([Icon, title, text]) => (
          <Card key={title} className="p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <span className="mb-4 grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-soft dark:text-brand-400"><Icon className="size-6" /></span>
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="mt-1 text-sm text-ink-2">{text}</p>
          </Card>
        ))}
      </div>
    </>
  );
}

/** Customer review dashboard: 7-column table with hover rows and robohash avatars. */
export function ReviewsPage() {
  useTitle("Customer reviews");
  const { data, error, loading } = useApi<{ reviews: Review[] }>("/reviews?limit=100");
  const [q, setQ] = useState("");
  const [minStars, setMinStars] = useState(0);
  const rows = useMemo(
    () => (data?.reviews ?? []).filter((r) => r.rating >= minStars && `${r.authorName} ${r.comment} ${r.productName ?? ""}`.toLowerCase().includes(q.toLowerCase())),
    [data, q, minStars],
  );
  const avg = data?.reviews.length ? data.reviews.reduce((n, r) => n + r.rating, 0) / data.reviews.length : 0;

  return (
    <>
      <PageTitle eyebrow="About us" sub={data ? <span className="flex items-center gap-2"><Stars value={avg} size={15} /> {avg.toFixed(1)} average from {data.reviews.length} reviews</span> : undefined}>Customer reviews</PageTitle>
      {error && <ErrorBox error={error} />}
      {loading ? <Loading /> : (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap gap-3 border-b border-line p-4">
            <div className="relative min-w-48 flex-1">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reviews…" aria-label="Search reviews" className="w-full rounded-xl border border-line bg-card py-2 ps-9 pe-3 text-sm outline-none focus:border-brand-500" />
            </div>
            <select value={minStars} onChange={(e) => setMinStars(Number(e.target.value))} className="rounded-xl border border-line bg-card px-3 py-2 text-sm" aria-label="Minimum rating">
              <option value={0}>All ratings</option>
              {[5, 4, 3].map((n) => <option key={n} value={n}>{n}★ &amp; up</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-soft text-xs tracking-wide text-ink-2 uppercase">
                <tr>{["#", "Avatar", "Customer", "Rating", "Product", "Comment", "Date"].map((h) => <th key={h} className="px-4 py-3 text-start font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r, i) => (
                  <tr key={r.id} className="transition-colors hover:bg-brand-50/60 dark:hover:bg-soft">
                    <td className="px-4 py-3 text-ink-3">{i + 1}</td>
                    <td className="px-4 py-3"><img src={r.avatarUrl} alt="" className="size-10 rounded-full bg-soft" /></td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{r.authorName}</td>
                    <td className="px-4 py-3"><Stars value={r.rating} size={14} /></td>
                    <td className="px-4 py-3 text-ink-2">{r.productName ?? <span className="text-ink-3">Store review</span>}</td>
                    <td className="min-w-64 px-4 py-3 text-ink-2">{r.comment}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-3">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-ink-3">No reviews match.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}

export function ContactPage() {
  useTitle("Contact us");
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ message: string }>("/contact", { method: "POST", body: form });
      toast({ kind: "success", title: "Message sent", body: res.message });
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      toast({ kind: "error", title: "Message not sent", body: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };
  const channels = [
    [Mail, "Email", "hello@shopsphere.dev", "mailto:hello@shopsphere.dev"],
    [Phone, "Phone", "+1 (000) 000-0000", "tel:+10000000000"],
    [MapPin, "Visit", "12 Market Street, Springfield", "https://maps.google.com/?q=Springfield"],
  ] as const;
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
      <div>
        <PageTitle eyebrow="Support" sub="We usually reply within one business day.">Contact us</PageTitle>
        <div className="space-y-3">
          {channels.map(([Icon, label, value, href]) => (
            <a key={label} href={href} className="flex items-center gap-4 rounded-2xl border border-line bg-card p-4 transition hover:border-brand-500/50">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-soft dark:text-brand-400"><Icon className="size-5" /></span>
              <span><span className="block text-xs text-ink-3">{label}</span><span className="font-medium">{value}</span></span>
            </a>
          ))}
        </div>
      </div>
      <Card className="p-6 sm:p-8">
        <form onSubmit={submit} className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-bold"><MessageSquare className="size-5" /> Send us a message</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Field label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Message</span>
            <textarea required minLength={10} rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15" />
          </label>
          <Button busy={busy} className="w-full py-3">Send message</Button>
        </form>
      </Card>
    </div>
  );
}
