import { Globe, LayoutDashboard, LogOut, MapPin, Package, Search, ShoppingCart, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { LANGUAGES, useI18n, type Lang } from "../lib/i18n";
import { useStore } from "../lib/store";

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

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { user, cart, logout } = useStore();
  const { place, busy, detect } = useLocation();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const navigate = useNavigate();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="bg-slate-900 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <span className="grid size-9 place-items-center rounded-lg bg-brand-600">
            <ShoppingCart className="size-5" />
          </span>
          Shop<span className="text-brand-500">Sphere</span>
        </Link>

        <button onClick={detect} className="hidden cursor-pointer items-center gap-1.5 text-left text-xs leading-tight md:flex" title={t("locate")}>
          <MapPin className="size-5 text-brand-500" />
          <span>
            <span className="block text-slate-400">{t("deliverTo")}</span>
            <span className="font-semibold">{busy ? "Locating…" : (place ?? t("locate"))}</span>
          </span>
        </button>

        <form onSubmit={submit} role="search" className="order-last flex w-full flex-1 md:order-none md:w-auto">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="w-full min-w-0 rounded-s-lg bg-white px-4 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button className="cursor-pointer rounded-e-lg bg-brand-600 px-4 hover:bg-brand-700" aria-label="Search">
            <Search className="size-5" />
          </button>
        </form>

        <label className="flex cursor-pointer items-center gap-1 text-sm">
          <Globe className="size-4" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="cursor-pointer bg-transparent outline-none [&>option]:text-slate-900"
            aria-label="Language"
          >
            {Object.entries(LANGUAGES).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </label>

        <div className="ms-auto flex items-center gap-4 text-sm md:ms-0">
          {user ? (
            <>
              {user.role === "admin" && (
                <Link to="/admin" className="flex items-center gap-1 hover:text-brand-500" title="Dashboard">
                  <LayoutDashboard className="size-5" />
                </Link>
              )}
              <Link to="/orders" className="flex items-center gap-1 hover:text-brand-500" title="My orders">
                <Package className="size-5" />
              </Link>
              <span className="hidden items-center gap-1 lg:flex">
                <User className="size-4" /> {user.name.split(" ")[0]}
              </span>
              <button onClick={logout} className="flex cursor-pointer items-center gap-1 hover:text-brand-500" title={t("logout")}>
                <LogOut className="size-5" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-brand-500">{t("login")}</Link>
              <Link to="/signup" className="rounded-lg bg-brand-600 px-3 py-1.5 font-medium hover:bg-brand-700">{t("signup")}</Link>
            </>
          )}
          <Link to="/cart" className="relative hover:text-brand-500" aria-label={t("cart")}>
            <ShoppingCart className="size-6" />
            {!!cart?.itemCount && (
              <span data-testid="cart-count" className="absolute -end-2 -top-2 grid size-5 place-items-center rounded-full bg-amber-400 text-xs font-bold text-slate-900">
                {cart.itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
