import { Search, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { api, formatPrice, img, type Paged, type Product } from "../lib/api";
import { useDebounced } from "../lib/hooks";
import { useI18n } from "../lib/i18n";

/** Header search with live suggestions (keyboard navigable). Enter without a selection opens full results. */
export function SearchBox() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [results, setResults] = useState<Product[]>([]);
  const debounced = useDebounced(q.trim(), 180);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    api<Paged<Product>>(`/products?q=${encodeURIComponent(debounced)}&pageSize=6&sort=popular`)
      .then((r) => !cancelled && (setResults(r.products), setActive(-1)))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  useEffect(() => {
    const close = (e: MouseEvent) => !boxRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const picked = results[active];
    go(picked ? `/product/${picked.slug}` : `/search?q=${encodeURIComponent(q.trim())}`);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(a + 1, results.length - 1)));
    if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(a - 1, -1)));
    if (e.key === "Escape") setOpen(false);
  };

  const showPanel = open && debounced.length >= 2;
  return (
    <div ref={boxRef} className="relative order-last w-full flex-1 md:order-none md:w-auto">
      <form onSubmit={submit} role="search" className="flex">
        <div className="relative flex-1">
          <input
            value={q}
            onChange={(e) => (setQ(e.target.value), setOpen(true))}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            placeholder={t("search")}
            aria-label={t("search")}
            role="combobox"
            aria-expanded={showPanel}
            aria-controls="search-suggestions"
            aria-autocomplete="list"
            className="w-full min-w-0 rounded-s-lg border border-e-0 border-line bg-page px-4 py-2.5 pe-9 text-ink outline-none placeholder:text-ink-3 focus:border-ink-3"
          />
          {q && (
            <button type="button" onClick={() => (setQ(""), setResults([]))} className="absolute end-2 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-ink-3 hover:text-ink" aria-label="Clear search">
              <X className="size-4" />
            </button>
          )}
        </div>
        <button className="cursor-pointer rounded-e-lg bg-ink px-4 text-page hover:bg-ink/85" aria-label="Search">
          <Search className="size-4" />
        </button>
      </form>
      {showPanel && (
        <div id="search-suggestions" role="listbox" className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-line bg-card text-ink shadow-2xl">
          {results.length === 0 ? (
            <p className="p-4 text-sm text-ink-2">No matches for “{debounced}”</p>
          ) : (
            <>
              {results.map((p, i) => (
                <button
                  key={p.id}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(`/product/${p.slug}`)}
                  className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-start ${i === active ? "bg-soft" : ""}`}
                >
                  <img src={img(p.imageUrl, 96)} alt="" className="size-11 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="block text-xs text-ink-3">{p.category.name}</span>
                  </span>
                  <span className="text-sm font-semibold">{formatPrice(p.finalPriceCents)}</span>
                </button>
              ))}
              <button onClick={() => go(`/search?q=${encodeURIComponent(debounced)}`)} className="block w-full cursor-pointer border-t border-line px-4 py-2.5 text-start text-sm font-semibold text-brand-600 hover:bg-soft dark:text-brand-400">
                See all results for “{debounced}” →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
