import { Globe, Heart, LayoutDashboard, LogOut, MapPin, Moon, Package, ShoppingBag, Sun, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { LANGUAGES, useI18n, type Lang } from "../lib/i18n";
import { useStore } from "../lib/store";
import { useTheme } from "../lib/theme";
import { Logo } from "./Logo";
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
      <button onClick={() => setOpen(!open)} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-soft" aria-expanded={open} aria-haspopup="menu" aria-label={`Hello, ${user.name.split(" ")[0]}`}>
        <span className="grid size-8 place-items-center rounded-full bg-ink text-sm font-medium text-page">{user.name[0]?.toUpperCase()}</span>
        <span className="hidden text-sm font-medium lg:block">{user.name.split(" ")[0]}</span>
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

  const icon = "rounded-lg p-2 text-ink-2 hover:bg-soft hover:text-ink";
  return (
    <header className="border-b border-line bg-card">
      <div className="bg-ink px-4 py-2 text-center text-xs text-page/85">
        Free shipping on orders over $50. New here? <span className="font-medium text-page">WELCOME10</span> takes 10% off your first order.
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4">
        <Logo />

        <button onClick={detect} className="hidden cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-start text-xs leading-tight text-ink-2 hover:bg-soft md:flex" title={t("locate")}>
          <MapPin className="size-4" />
          <span>
            <span className="block text-ink-3">{t("deliverTo")}</span>
            <span className="font-medium text-ink">{busy ? "Locating…" : (place ?? t("locate"))}</span>
          </span>
        </button>

        <SearchBox />

        <div className="ms-auto flex items-center gap-0.5 text-sm md:ms-0">
          <label className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-2 text-ink-2 hover:bg-soft">
            <Globe className="size-4" />
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="cursor-pointer bg-transparent outline-none" aria-label="Language">
              {Object.entries(LANGUAGES).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
            </select>
          </label>
          <button onClick={toggle} className={`cursor-pointer ${icon}`} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}>
            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
          {user ? (
            <>
              <Link to="/wishlist" className={`relative ${icon}`} aria-label="Wishlist">
                <Heart className="size-5" />
                {wishlist.size > 0 && <span className="absolute end-1 top-1 size-2 rounded-full bg-brand-500" />}
              </Link>
              <AccountMenu />
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 font-medium text-ink-2 hover:text-ink">{t("login")}</Link>
              <Link to="/signup" className="rounded-lg border border-ink px-3 py-1.5 font-medium hover:bg-ink hover:text-page">{t("signup")}</Link>
            </>
          )}
          {user ? (
            <button onClick={() => setCartOpen(true)} className={`relative cursor-pointer ${icon}`} aria-label={t("cart")}>
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span key={count} data-testid="cart-count" className="animate-pop absolute end-0 top-0 grid size-[18px] place-items-center rounded-full bg-brand-600 text-[10px] font-semibold text-white">
                  {count}
                </span>
              )}
            </button>
          ) : (
            <Link to="/login" state={{ from: "/cart" }} className={icon} aria-label={t("cart")}>
              <ShoppingBag className="size-5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
