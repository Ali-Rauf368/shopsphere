import { ChevronDown, Globe, Heart, LayoutDashboard, LogOut, MapPin, Moon, Package, ShoppingCart, Sun, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { LANGUAGES, useI18n, type Lang } from "../lib/i18n";
import { useStore } from "../lib/store";
import { useTheme } from "../lib/theme";
import { SearchBox } from "./SearchBox";

function useLocation() {
  const [place, setPlace] = useState<string | null>(() => sessionStorage.getItem("shopsphere.place"));
  const [busy, setBusy] = useState(false);

  // Browser Geolocation API, then a key-free reverse-geocoding service for a readable city name.
  const detect = () => {
    if (!navigator.geolocation) return setPlace("Unavailable");
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`,
          );
          const d = await res.json();
          const name = [d.city || d.locality, d.countryCode].filter(Boolean).join(", ") || "Your location";
          sessionStorage.setItem("shopsphere.place", name);
          setPlace(name);
        } catch {
          setPlace(`${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`);
        } finally {
          setBusy(false);
        }
      },
      () => {
        setPlace("Permission denied");
        setBusy(false);
      },
    );
  };
  return { place, busy, detect };
}

function AccountMenu() {
  const { user, logout } = useStore();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  if (!user) return null;

  const item = "flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-soft";
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/10" aria-expanded={open} aria-haspopup="menu">
        <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-sm font-bold">{user.name[0]?.toUpperCase()}</span>
        <span className="hidden text-start text-xs leading-tight lg:block">
          <span className="block text-slate-400">Hello,</span>
          <span className="font-semibold">{user.name.split(" ")[0]}</span>
        </span>
        <ChevronDown className="hidden size-4 lg:block" />
      </button>
      {open && (
        <div role="menu" onClick={() => setOpen(false)} className="absolute end-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-card py-1 text-ink shadow-2xl">
          <p className="border-b border-line px-4 py-2.5 text-xs text-ink-3">Signed in as<br /><span className="text-sm font-medium text-ink">{user.email}</span></p>
          <Link role="menuitem" to="/account" className={item}><User className="size-4" /> My account</Link>
          <Link role="menuitem" to="/orders" className={item}><Package className="size-4" /> My orders</Link>
          <Link role="menuitem" to="/wishlist" className={item}><Heart className="size-4" /> Wishlist</Link>
          {user.role === "admin" && <Link role="menuitem" to="/admin" className={item}><LayoutDashboard className="size-4" /> Admin dashboard</Link>}
          <button role="menuitem" onClick={logout} className={`${item} w-full cursor-pointer border-t border-line text-rose-600`}><LogOut className="size-4" /> {t("logout")}</button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { user, cart, wishlist, setCartOpen } = useStore();
  const { dark, toggle } = useTheme();
  const { place, busy, detect } = useLocation();
  const count = cart?.itemCount ?? 0;

  return (
    <header className="bg-slate-900 text-white">
      <div className="bg-brand-600 px-4 py-1.5 text-center text-xs font-medium sm:text-sm">
        Free shipping on orders over $50 · Use code <span className="rounded bg-white/20 px-1.5 font-bold">WELCOME10</span> for 10% off your first order
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight" aria-label="ShopSphere home">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-600/30">
            <ShoppingCart className="size-5" />
          </span>
          Shop<span className="text-brand-400">Sphere</span>
        </Link>

        <button onClick={detect} className="hidden cursor-pointer items-center gap-1.5 rounded-xl px-2 py-1 text-start text-xs leading-tight hover:bg-white/10 md:flex" title={t("locate")}>
          <MapPin className="size-5 text-brand-400" />
          <span>
            <span className="block text-slate-400">{t("deliverTo")}</span>
            <span className="font-semibold">{busy ? "Locating…" : (place ?? t("locate"))}</span>
          </span>
        </button>

        <SearchBox />

        <div className="ms-auto flex items-center gap-1 text-sm md:ms-0">
          <label className="flex cursor-pointer items-center gap-1 rounded-xl px-2 py-2 hover:bg-white/10">
            <Globe className="size-4" />
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="cursor-pointer bg-transparent outline-none [&>option]:text-slate-900" aria-label="Language">
              {Object.entries(LANGUAGES).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </label>
          <button onClick={toggle} className="cursor-pointer rounded-xl p-2 hover:bg-white/10" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
          {user ? (
            <>
              <Link to="/wishlist" className="relative rounded-xl p-2 hover:bg-white/10" aria-label="Wishlist">
                <Heart className="size-5" />
                {wishlist.size > 0 && <span className="absolute end-0.5 top-0.5 grid size-4 place-items-center rounded-full bg-rose-500 text-[10px] font-bold">{wishlist.size}</span>}
              </Link>
              <AccountMenu />
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-xl px-3 py-2 hover:bg-white/10">{t("login")}</Link>
              <Link to="/signup" className="rounded-xl bg-brand-600 px-3 py-2 font-semibold hover:bg-brand-700">{t("signup")}</Link>
            </>
          )}
          {user ? (
            <button onClick={() => setCartOpen(true)} className="relative cursor-pointer rounded-xl p-2 hover:bg-white/10" aria-label={t("cart")}>
              <ShoppingCart className="size-6" />
              {count > 0 && (
                <span key={count} data-testid="cart-count" className="animate-pop absolute end-0 top-0 grid size-5 place-items-center rounded-full bg-amber-400 text-xs font-bold text-slate-900">
                  {count}
                </span>
              )}
            </button>
          ) : (
            <Link to="/login" state={{ from: "/cart" }} className="rounded-xl p-2 hover:bg-white/10" aria-label={t("cart")}>
              <ShoppingCart className="size-6" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
