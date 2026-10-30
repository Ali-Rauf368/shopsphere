import { ChevronDown, ChevronRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import type { Category } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useApi } from "../lib/useApi";

interface NavItem {
  label: string;
  to: string;
  children?: { label: string; to: string }[];
}

/** 9 entries: Home, 6 department dropdowns, About dropdown, Special Offers. Dropdowns open on hover; a drawer on mobile. */
export function NavBar() {
  const { t } = useI18n();
  const { data } = useApi<{ categories: Category[] }>("/categories");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const location = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const items: NavItem[] = [
    { label: t("home"), to: "/" },
    ...(data?.categories ?? []).map((c) => ({
      label: c.name,
      to: `/category/${c.slug}`,
      children: [{ label: `All ${c.name}`, to: `/category/${c.slug}` }, ...c.children.map((s) => ({ label: s.name, to: `/category/${s.slug}` }))],
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
    `relative flex items-center gap-1 px-3 py-3.5 text-sm font-medium whitespace-nowrap transition-colors hover:text-ink ${isActive ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-px after:bg-ink" : "text-ink-2"}`;

  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-card/90 backdrop-blur" aria-label="Main">
      <div className="mx-auto max-w-7xl px-4">
        <button className="flex cursor-pointer items-center gap-2 py-3 text-sm font-semibold md:hidden" onClick={() => setOpen(true)} aria-expanded={open}>
          <Menu className="size-5" /> Browse departments
        </button>
        <ul className="hidden md:flex md:items-center md:justify-between">
          {items.map((item) => (
            <li key={item.to + item.label} className="group relative">
              <NavLink to={item.to} end={item.to === "/"} className={linkClass}>
                {item.label}
                {item.children && <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180" />}
              </NavLink>
              {item.children && (
                <ul className="invisible absolute start-0 top-full z-50 min-w-52 translate-y-2 rounded-xl border border-line bg-card p-1.5 opacity-0 shadow-xl transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  {item.children.map((child) => (
                    <li key={child.to + child.label}>
                      <Link to={child.to} className="block rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-soft hover:text-ink">
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

      {/* Mobile drawer */}
      <div className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <div className={`absolute inset-y-0 start-0 flex w-80 max-w-[85vw] flex-col bg-card shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"}`}>
          <div className="flex items-center justify-between border-b border-line p-4">
            <p className="font-display text-lg font-bold">Browse</p>
            <button onClick={() => setOpen(false)} className="cursor-pointer rounded-lg p-1.5 hover:bg-soft" aria-label="Close menu"><X className="size-5" /></button>
          </div>
          <ul className="flex-1 overflow-y-auto p-2">
            {items.map((item) => (
              <li key={item.label}>
                {item.children ? (
                  <>
                    <button onClick={() => setExpanded(expanded === item.label ? null : item.label)} className="flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-3 text-start font-medium hover:bg-soft" aria-expanded={expanded === item.label}>
                      {item.label} <ChevronRight className={`size-4 transition-transform ${expanded === item.label ? "rotate-90" : ""}`} />
                    </button>
                    {expanded === item.label && (
                      <ul className="mb-2 ms-3 border-s border-line ps-2">
                        {item.children.map((c) => (
                          <li key={c.to + c.label}><Link to={c.to} className="block rounded-lg px-3 py-2 text-sm text-ink-2 hover:bg-soft">{c.label}</Link></li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link to={item.to} className="block rounded-lg px-3 py-3 font-medium hover:bg-soft">{item.label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
