import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type Kind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: Kind;
  title: string;
  body?: string;
  image?: string;
  action?: { label: string; onClick: () => void };
}

const ToastContext = createContext<((t: Omit<Toast, "id">) => void) | null>(null);

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const TINT = { success: "text-emerald-500", error: "text-rose-500", info: "text-brand-500" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = (id: number) => setToasts((ts) => ts.filter((t) => t.id !== id));
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((ts) => [...ts.slice(-2), { ...t, id }]);
    setTimeout(() => dismiss(id), t.kind === "error" ? 6000 : 3500);
  }, []);

  return (
    <ToastContext value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pe-6" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div key={t.id} role="status" className="animate-toast pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border border-line bg-card p-3 pe-2 shadow-xl shadow-black/10">
              {t.image ? <img src={t.image} alt="" className="size-12 rounded-lg object-cover" /> : <Icon className={`size-6 shrink-0 ${TINT[t.kind]}`} />}
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  {t.image && <Icon className={`size-4 ${TINT[t.kind]}`} />} {t.title}
                </p>
                {t.body && <p className="truncate text-sm text-ink-2">{t.body}</p>}
              </div>
              {t.action && (
                <button onClick={() => { t.action!.onClick(); dismiss(t.id); }} className="cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-soft">
                  {t.action.label}
                </button>
              )}
              <button onClick={() => dismiss(t.id)} className="cursor-pointer rounded p-1 text-ink-3 hover:text-ink" aria-label="Dismiss">
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
