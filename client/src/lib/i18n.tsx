import { createContext, useContext, useState, type ReactNode } from "react";

export const LANGUAGES = { en: "English", de: "Deutsch", ur: "اردو" } as const;
export type Lang = keyof typeof LANGUAGES;

const STRINGS = {
  search: { en: "Search products…", de: "Produkte suchen…", ur: "مصنوعات تلاش کریں…" },
  login: { en: "Log in", de: "Anmelden", ur: "لاگ ان" },
  signup: { en: "Sign up", de: "Registrieren", ur: "سائن اپ" },
  logout: { en: "Log out", de: "Abmelden", ur: "لاگ آؤٹ" },
  cart: { en: "Cart", de: "Warenkorb", ur: "ٹوکری" },
  deliverTo: { en: "Deliver to", de: "Liefern nach", ur: "ترسیل" },
  locate: { en: "Detect location", de: "Standort ermitteln", ur: "مقام معلوم کریں" },
  addToCart: { en: "Add to cart", de: "In den Warenkorb", ur: "ٹوکری میں ڈالیں" },
  home: { en: "Home", de: "Start", ur: "ہوم" },
  about: { en: "About", de: "Über uns", ur: "ہمارے بارے میں" },
  offers: { en: "Special Offers", de: "Angebote", ur: "خصوصی پیشکش" },
  viewAll: { en: "View all", de: "Alle ansehen", ur: "سب دیکھیں" },
} satisfies Record<string, Record<Lang, string>>;

type Key = keyof typeof STRINGS;

const I18nContext = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (k: Key) => string } | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("shopsphere.lang") as Lang) || "en");
  const setLang = (l: Lang) => {
    localStorage.setItem("shopsphere.lang", l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ur" ? "rtl" : "ltr";
    setLangState(l);
  };
  return <I18nContext value={{ lang, setLang, t: (k) => STRINGS[k][lang] }}>{children}</I18nContext>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
