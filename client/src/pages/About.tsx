import { Eye, Heart, Leaf, Target, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ErrorBox, Loading, PageTitle } from "../components/Layout";
import { Stars } from "../components/Stars";
import { api, type Review } from "../lib/api";
import { useApi } from "../lib/useApi";

export function StoryPage() {
  return (
    <div className="grid items-center gap-10 md:grid-cols-2">
      <div>
        <PageTitle sub="How ShopSphere started">Our Story</PageTitle>
        <div className="space-y-4 leading-relaxed text-slate-600">
          <p>E-commerce lets people buy and sell over the internet, saving time and effort for customers and businesses alike — especially for busy people who would rather not spend their evenings in traffic.</p>
          <p>ShopSphere began with a simple idea: everything you need, under one roof, in a range of quality levels, at amazing prices. From phones to frying pans, novels to running shoes, we bring it all together with a checkout that takes seconds.</p>
          <p>Today we work with hundreds of suppliers and ship to customers every day — and we still read every review.</p>
        </div>
      </div>
      <img src="https://picsum.photos/seed/our-story/800/600" alt="Our warehouse team" className="rounded-2xl shadow" />
    </div>
  );
}

export function VisionPage() {
  const pillars = [
    [Target, "Choice", "A wide catalog across every department, with options for every budget."],
    [Heart, "Care", "Friendly support, fast delivery and 30-day returns on everything."],
    [Leaf, "Responsibility", "Recyclable packaging and carbon-neutral shipping by 2028."],
    [Users, "Community", "Real reviews from real customers shape what we stock."],
  ] as const;
  return (
    <>
      <PageTitle sub="Where we're headed">Our Vision</PageTitle>
      <p className="mb-10 max-w-2xl text-lg text-slate-600">
        <Eye className="me-2 inline size-6 text-brand-600" />
        To be the simplest, most trusted place to shop online — where quality and value are never a trade-off.
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {pillars.map(([Icon, title, text]) => (
          <div key={title} className="rounded-xl bg-white p-6 shadow-sm">
            <Icon className="mb-3 size-8 text-brand-600" />
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{text}</p>
          </div>
        ))}
      </div>
    </>
  );
}

/** Customer review dashboard: 7-column table with hover rows and robohash avatars. */
export function ReviewsPage() {
  const { data, error, loading } = useApi<{ reviews: Review[] }>("/reviews?limit=50");
  const avg = data?.reviews.length ? data.reviews.reduce((n, r) => n + r.rating, 0) / data.reviews.length : 0;
  return (
    <>
      <PageTitle sub={data ? `${data.reviews.length} reviews · average ${avg.toFixed(1)} / 5` : undefined}>Customer Reviews</PageTitle>
      {error && <ErrorBox error={error} />}
      {loading ? <Loading /> : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-100 text-xs tracking-wide text-slate-600 uppercase">
              <tr>
                {["#", "Avatar", "Customer", "Rating", "Product", "Comment", "Date"].map((h) => <th key={h} className="px-4 py-3 text-start">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.reviews.map((r, i) => (
                <tr key={r.id} className="transition-colors hover:bg-brand-50">
                  <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3"><img src={r.avatarUrl} alt="" className="size-10 rounded-full bg-slate-100" /></td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{r.authorName}</td>
                  <td className="px-4 py-3"><Stars value={r.rating} size={14} /></td>
                  <td className="px-4 py-3 text-slate-600">{r.productName ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.comment}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await api<{ message: string }>("/contact", { method: "POST", body: form });
      setStatus({ ok: true, text: res.message });
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus({ ok: false, text: (err as Error).message });
    }
  };
  return (
    <div className="mx-auto max-w-xl">
      <PageTitle sub="We usually reply within one business day">Contact us</PageTitle>
      <form onSubmit={submit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        {(["name", "email"] as const).map((f) => (
          <label key={f} className="block">
            <span className="mb-1 block text-sm font-medium capitalize">{f}</span>
            <input type={f === "email" ? "email" : "text"} required value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </label>
        ))}
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Message</span>
          <textarea required minLength={10} rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </label>
        {status && <p className={`text-sm ${status.ok ? "text-emerald-700" : "text-red-600"}`}>{status.text}</p>}
        <button className="w-full cursor-pointer rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700">Send message</button>
      </form>
    </div>
  );
}
