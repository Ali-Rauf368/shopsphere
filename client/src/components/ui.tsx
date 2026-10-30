import { Loader2, type LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";
import { formatPrice } from "../lib/api";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-page hover:bg-ink/85",
  secondary: "border border-line bg-card text-ink hover:bg-soft",
  ghost: "text-ink-2 hover:bg-soft hover:text-ink",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

export function Button({
  variant = "primary",
  busy,
  icon: Icon,
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; busy?: boolean; icon?: LucideIcon }) {
  return (
    <button
      {...props}
      disabled={props.disabled || busy}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : Icon && <Icon className="size-4" />}
      {children}
    </button>
  );
}

export function Field({ label, hint, error, ...props }: { label: string; hint?: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <input
        {...props}
        aria-invalid={!!error}
        className="w-full rounded-xl border border-line bg-card px-3.5 py-2.5 text-ink outline-none transition placeholder:text-ink-3 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 aria-[invalid=true]:border-rose-500"
      />
      {error ? <span className="mt-1 block text-xs text-rose-600">{error}</span> : hint && <span className="mt-1 block text-xs text-ink-3">{hint}</span>}
    </label>
  );
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-line bg-card ${className}`}>{children}</div>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-soft ${className}`} />;
}

export function ProductCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/5] rounded-lg" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: string; action?: { label: string; to: string } }) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <span className="mb-5 grid size-16 place-items-center rounded-full bg-soft text-ink-2">
        <Icon className="size-7" strokeWidth={1.5} />
      </span>
      <p className="font-display text-2xl">{title}</p>
      {body && <p className="mt-1 max-w-sm text-ink-2">{body}</p>}
      {action && (
        <Link to={action.to} className="mt-6 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-page hover:bg-ink/85">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function PageTitle({ children, sub, eyebrow }: { children: ReactNode; sub?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="mb-2 text-xs font-medium tracking-[0.18em] text-brand-600 uppercase dark:text-brand-400">{eyebrow}</p>}
      <h1 className="text-4xl sm:text-5xl">{children}</h1>
      {sub && <p className="mt-2 text-ink-2">{sub}</p>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex justify-center py-24 text-ink-3">
      <Loader2 className="size-8 animate-spin" />
    </div>
  );
}

export function ErrorBox({ error }: { error: Error }) {
  return <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error.message}</p>;
}

export function Price({ cents, was, size = "md" }: { cents: number; was?: number; size?: "md" | "lg" }) {
  return (
    <span className={`inline-flex items-baseline gap-1.5 ${size === "lg" ? "" : "flex-col-reverse items-end gap-0 sm:flex-row sm:items-baseline sm:gap-1.5"}`}>
      <span className={`tabular-nums ${size === "lg" ? "font-display text-3xl" : "text-[15px] font-medium"}`}>{formatPrice(cents)}</span>
      {was !== undefined && was > cents && <span className={`text-ink-3 line-through tabular-nums ${size === "lg" ? "text-lg" : "text-sm"}`}>{formatPrice(was)}</span>}
    </span>
  );
}
