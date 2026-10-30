import { Link } from "react-router";

/** Wordmark: serif name with a small clay dot, the same mark as the favicon. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`group inline-flex items-baseline font-display text-[1.6rem] leading-none font-medium tracking-tight text-ink ${className}`} aria-label="ShopSphere home">
      ShopSphere<span className="ms-0.5 inline-block size-2 rounded-full bg-brand-500 transition-transform group-hover:scale-125" />
    </Link>
  );
}
