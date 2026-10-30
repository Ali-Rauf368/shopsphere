import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="mt-16 bg-slate-900 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="mb-3 text-lg font-bold text-white">ShopSphere</h3>
          <p className="text-sm">Everything you need, under one roof — quality products at amazing prices.</p>
        </div>
        <div>
          <h3 className="mb-3 font-semibold text-white">Shop</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/category/electronics" className="hover:text-white">Electronics</Link></li>
            <li><Link to="/category/fashion" className="hover:text-white">Fashion</Link></li>
            <li><Link to="/offers" className="hover:text-white">Special Offers</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 font-semibold text-white">Company</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about/story" className="hover:text-white">Our Story</Link></li>
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
      <p className="border-t border-slate-800 py-4 text-center text-xs">© {new Date().getFullYear()} ShopSphere. All rights reserved.</p>
    </footer>
  );
}
