import { Check, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import type { Product } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useStore } from "../lib/store";

export function AddToCartButton({ product, quantity = 1, className = "" }: { product: Product; quantity?: number; className?: string }) {
  const { user, addToCart } = useStore();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, setState] = useState<"idle" | "busy" | "done" | string>("idle");

  const onClick = async () => {
    if (!user) return navigate("/login", { state: { from: location.pathname } });
    setState("busy");
    try {
      await addToCart(product.id, quantity);
      setState("done");
      setTimeout(() => setState("idle"), 1500);
    } catch (e) {
      setState((e as Error).message);
    }
  };

  if (product.stock === 0) {
    return <button disabled className={`rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500 ${className}`}>Out of stock</button>;
  }
  return (
    <div className={className}>
      <button
        onClick={onClick}
        disabled={state === "busy"}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {state === "done" ? <Check className="size-4" /> : <ShoppingCart className="size-4" />}
        {state === "done" ? "Added" : t("addToCart")}
      </button>
      {!["idle", "busy", "done"].includes(state) && <p className="mt-1 text-xs text-red-600">{state}</p>}
    </div>
  );
}
