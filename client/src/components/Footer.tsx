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
    <div className="grid items-end gap-6 border-y border-line py-12 md:grid-cols-2">
      <div>
        <h2 className="text-3xl">A short email, once a month.</h2>
        <p className="mt-2 max-w-md text-ink-2">New arrivals, the occasional markdown, and nothing else. You get 10% off your first order when you sign up.</p>
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" aria-label="Email for newsletter" className="min-w-0 flex-1 border-b border-ink bg-transparent px-1 py-3 outline-none placeholder:text-ink-3 focus:border-brand-600" />
        <button disabled={busy} className="flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-5 text-sm font-medium text-page hover:bg-ink/85 disabled:opacity-60">
          <Send className="size-4" /> <span className="hidden sm:inline">Subscribe</span>
        </button>
      </form>
    </div>
  );
}

const PERKS = [
  [Truck, "Free shipping over $50", "Otherwise a flat $4.99"],
  [RotateCcw, "30 days to change your mind", "We send the return label"],
  [ShieldCheck, "Two-year warranty", "On all electronics"],
  [Headphones, "Questions?", "hello@shopsphere.dev"],
] as const;

export function Footer() {
  return (
    <footer className="mt-20">
      <div className="mx-auto max-w-7xl px-4"><Newsletter /></div>
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
        {PERKS.map(([Icon, title, text]) => (
          <div key={title} className="flex items-center gap-3">
            <Icon className="size-5 shrink-0 text-ink-2" strokeWidth={1.5} />
            <div><p className="text-sm font-medium">{title}</p><p className="text-xs text-ink-3">{text}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-[#1f1b16] text-[#a39a8f]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-3 font-display text-2xl text-[#f2ede6]">ShopSphere<span className="ms-0.5 inline-block size-2 rounded-full bg-brand-500" /></p>
            <p className="max-w-60 text-sm leading-relaxed">A small online shop for well-made everyday things. Run from Springfield since 2019.</p>
            <div className="mt-4 flex items-center gap-2 text-xs"><CreditCard className="size-4" /> Visa · Mastercard · PayPal · Apple Pay</div>
          </div>
          <div>
            <h3 className="mb-3 font-medium text-[#f2ede6]">Shop</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/category/electronics" className="hover:text-[#f2ede6]">Electronics</Link></li>
              <li><Link to="/category/fashion" className="hover:text-[#f2ede6]">Fashion</Link></li>
              <li><Link to="/category/home" className="hover:text-[#f2ede6]">Home &amp; Kitchen</Link></li>
              <li><Link to="/offers" className="hover:text-[#f2ede6]">Special Offers</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-medium text-[#f2ede6]">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about/story" className="hover:text-[#f2ede6]">Our Story</Link></li>
              <li><Link to="/about/vision" className="hover:text-[#f2ede6]">Vision</Link></li>
              <li><Link to="/about/reviews" className="hover:text-[#f2ede6]">Customer Reviews</Link></li>
              <li><Link to="/contact" className="hover:text-[#f2ede6]">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-medium text-[#f2ede6]">Get in touch</h3>
            <ul className="icon-list space-y-2 text-sm">
              <li className="icon"><a href="mailto:hello@shopsphere.dev" className="flex items-center gap-2 hover:text-[#f2ede6]"><Mail className="size-4" /> hello@shopsphere.dev</a></li>
              <li className="icon"><a href="tel:+10000000000" className="flex items-center gap-2 hover:text-[#f2ede6]"><Phone className="size-4" /> +1 (000) 000-0000</a></li>
              <li className="icon"><a href="https://maps.google.com/?q=Springfield" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-[#f2ede6]"><MapPin className="size-4" /> 12 Market Street, Springfield</a></li>
            </ul>
          </div>
        </div>
        <p className="border-t border-white/10 py-5 text-center text-xs">© {new Date().getFullYear()} ShopSphere. All rights reserved. · <a href="/api/docs" className="hover:text-[#f2ede6]">API docs</a></p>
      </div>
    </footer>
  );
}
