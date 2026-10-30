import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router";
import type { Category } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useApi } from "../lib/useApi";

interface NavItem {
  label: string;
  to: string;
  children?: { label: string; to: string }[];
}

/** 9 entries: Home, 6 category dropdowns, About dropdown, Special Offers. Dropdowns open on hover (desktop). */
export function NavBar() {
  const { t } = useI18n();
  const { data } = useApi<{ categories: Category[] }>("/categories");
  const [open, setOpen] = useState(false);

  const items: NavItem[] = [
    { label: t("home"), to: "/" },
    ...(data?.categories ?? []).map((c) => ({
      label: c.name,
      to: `/category/${c.slug}`,
      children: c.children.map((s) => ({ label: s.name, to: `/category/${s.slug}` })),
    })),
    {
      label: t("about"),
      to: "/about/story",
      children: [
        { label: "Our Story", to: "/about/story" },
        { label: "Vision", to: "/about/vision" },
        { label: "Customer Reviews", to: "/about/reviews" },
        { label: "Contact", to: "/contact" },
      ],
    },
    { label: t("offers"), to: "/offers" },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors hover:text-brand-600 ${isActive ? "text-brand-600" : "text-slate-700"}`;

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur" aria-label="Main">
      <div className="mx-auto max-w-7xl px-4">
        <button className="flex cursor-pointer items-center gap-2 py-3 text-sm font-medium md:hidden" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />} Menu
        </button>
        <ul className={`${open ? "flex" : "hidden"} flex-col md:flex md:flex-row md:items-center md:justify-between`}>
          {items.map((item) => (
            <li key={item.to + item.label} className="group relative">
              <NavLink to={item.to} end={item.to === "/"} className={linkClass} onClick={() => setOpen(false)}>
                {item.label}
                {item.children && <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180" />}
              </NavLink>
              {item.children && (
                <ul className="invisible absolute start-0 top-full z-50 min-w-48 translate-y-1 rounded-lg border border-slate-200 bg-white py-2 opacity-0 shadow-lg transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  {item.children.map((child) => (
                    <li key={child.to}>
                      <Link to={child.to} onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700">
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
