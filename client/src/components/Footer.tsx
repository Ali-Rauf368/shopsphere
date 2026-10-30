import { CreditCard, Headphones, Mail, MapPin, Phone, RotateCcw, Send, ShieldCheck, Truck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { api } from "../lib/api";
import { useToast } from "../lib/toast";

function Newsletter() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ message: string }>("/newsletter", { method: "POST", body: { email } });
      toast({ kind: "success", title: "Subscribed", body: res.message });
      setEmail("");
    } catch (err) {
      toast({ kind: "error", title: "Couldn't subscribe", body: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-indigo-900 p-8 text-white sm:p-10">
      <div className="absolute -end-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl" />
      <div className="relative grid items-center gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-extrabold sm:text-3xl">Get 10% off your first order</h2>
          <p className="mt-2 text-brand-100">Join 40,000+ shoppers getting early access to deals and new arrivals. No spam, ever.</p>
        </div>
        <form onSubmit={submit} className="flex gap-2">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email for newsletter" className="min-w-0 flex-1 rounded-xl border-0 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-4 focus:ring-white/30" />
          <button disabled={busy} className="flex cursor-pointer items-center gap-2 rounded-xl bg-slate-900 px-5 font-semibold hover:bg-black disabled:opacity-60">
            <Send className="size-4" /> <span className="hidden sm:inline">Subscribe</span>
          </button>
        </form>
      </div>
    </div>
  );
}

const PERKS = [
  [Truck, "Free shipping", "On orders over $50"],
  [RotateCcw, "30-day returns", "Free and easy"],
  [ShieldCheck, "Secure checkout", "Encrypted end-to-end"],
  [Headphones, "Real humans", "Support 7 days a week"],
] as const;

export function Footer() {
  return (
    <footer className="mt-20">
      <div className="mx-auto max-w-7xl px-4"><Newsletter /></div>
      <div className="mx-auto mt-12 grid max-w-7xl grid-cols-2 gap-6 px-4 md:grid-cols-4">
        {PERKS.map(([Icon, title, text]) => (
          <div key={title} className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-soft dark:text-brand-400"><Icon className="size-5" /></span>
            <div><p className="text-sm font-semibold">{title}</p><p className="text-xs text-ink-2">{text}</p></div>
          </div>
        ))}
      </div>
      <div className="mt-12 bg-slate-900 text-slate-400">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-3 text-lg font-bold text-white">ShopSphere</h3>
            <p className="text-sm">Everything you need, under one roof: quality products at amazing prices.</p>
            <div className="mt-4 flex items-center gap-2 text-xs"><CreditCard className="size-4" /> Visa · Mastercard · PayPal · Apple Pay</div>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-white">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/category/electronics" className="hover:text-white">Electronics</Link></li>
              <li><Link to="/category/fashion" className="hover:text-white">Fashion</Link></li>
              <li><Link to="/category/home" className="hover:text-white">Home &amp; Kitchen</Link></li>
              <li><Link to="/offers" className="hover:text-white">Special Offers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-white">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about/story" className="hover:text-white">Our Story</Link></li>
              <li><Link to="/about/vision" className="hover:text-white">Vision</Link></li>
              <li><Link to="/about/reviews" className="hover:text-white">Customer Reviews</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-white">Get in touch</h3>
            <ul className="icon-list space-y-2 text-sm">
              <li className="icon"><a href="mailto:hello@shopsphere.dev" className="flex items-center gap-2 hover:text-white"><Mail className="size-4" /> hello@shopsphere.dev</a></li>
              <li className="icon"><a href="tel:+10000000000" className="flex items-center gap-2 hover:text-white"><Phone className="size-4" /> +1 (000) 000-0000</a></li>
              <li className="icon"><a href="https://maps.google.com/?q=Springfield" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-white"><MapPin className="size-4" /> 12 Market Street, Springfield</a></li>
            </ul>
          </div>
        </div>
        <p className="border-t border-slate-800 py-5 text-center text-xs">© {new Date().getFullYear()} ShopSphere. All rights reserved. · <a href="/api/docs" className="hover:text-white">API docs</a></p>
      </div>
    </footer>
  );
}
