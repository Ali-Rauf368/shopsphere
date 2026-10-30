import { Heart, KeyRound, LayoutDashboard, Package, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router";
import { ProductGrid } from "../components/ProductCard";
import { Button, Card, EmptyState, Field, Loading, PageTitle } from "../components/ui";
import { api, type Product, type User } from "../lib/api";
import { useTitle } from "../lib/hooks";
import { useStore } from "../lib/store";
import { useToast } from "../lib/toast";
import { useApi } from "../lib/useApi";

export function WishlistPage() {
  useTitle("Wishlist");
  const { user, ready, wishlist } = useStore();
  // Re-fetch whenever the set of saved ids changes, so un-hearting a card removes it here.
  const key = [...wishlist].sort().join(",");
  const { data } = useApi<{ products: Product[] }>(user ? `/wishlist?v=${key}` : null);
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: "/wishlist" }} replace />;
  if (data && data.products.length === 0) {
    return <EmptyState icon={Heart} title="Your wishlist is empty" body="Tap the heart on any product to save it for later." action={{ label: "Discover products", to: "/" }} />;
  }
  return (
    <>
      <PageTitle sub={data ? `${data.products.length} saved items` : undefined}>Wishlist</PageTitle>
      <ProductGrid products={data?.products} count={4} />
    </>
  );
}

function ProfileForm() {
  const { user, setUser } = useStore();
  const toast = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ user: User }>("/auth/me", { method: "PATCH", body: { name } });
      setUser(res.user);
      toast({ kind: "success", title: "Profile updated" });
    } catch (err) {
      toast({ kind: "error", title: "Not saved", body: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="p-6">
      <form onSubmit={submit} className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold"><UserRound className="size-5" /> Profile</h2>
        <Field label="Display name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
        <Field label="Email" value={user?.email ?? ""} disabled hint="Contact support to change your email." />
        <Button busy={busy} disabled={name.trim() === user?.name}>Save changes</Button>
      </form>
    </Card>
  );
}

function PasswordForm() {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const mismatch = form.confirm.length > 0 && form.confirm !== form.newPassword;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (mismatch) return;
    setBusy(true);
    try {
      await api("/auth/password", { method: "POST", body: { currentPassword: form.currentPassword, newPassword: form.newPassword } });
      toast({ kind: "success", title: "Password changed" });
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast({ kind: "error", title: "Password not changed", body: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };
  const bind = (k: keyof typeof form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }) });
  return (
    <Card className="p-6">
      <form onSubmit={submit} className="space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-bold"><KeyRound className="size-5" /> Password</h2>
        <Field label="Current password" type="password" autoComplete="current-password" required {...bind("currentPassword")} />
        <Field label="New password" type="password" autoComplete="new-password" required minLength={8} hint="At least 8 characters" {...bind("newPassword")} />
        <Field label="Confirm new password" type="password" autoComplete="new-password" required error={mismatch ? "Passwords don't match" : undefined} {...bind("confirm")} />
        <Button busy={busy}>Update password</Button>
      </form>
    </Card>
  );
}

export function AccountPage() {
  useTitle("My account");
  const { user, ready, wishlist } = useStore();
  const orders = useApi<{ orders: unknown[] }>(user ? "/orders" : null);
  if (!ready) return <Loading />;
  if (!user) return <Navigate to="/login" state={{ from: "/account" }} replace />;

  const tiles = [
    { to: "/orders", icon: Package, label: "Orders", value: orders.data?.orders.length ?? "…" },
    { to: "/wishlist", icon: Heart, label: "Wishlist", value: wishlist.size },
    ...(user.role === "admin" ? [{ to: "/admin", icon: LayoutDashboard, label: "Admin", value: "Open" }] : []),
  ];
  return (
    <>
      <PageTitle eyebrow="Account" sub={user.email}>Hi, {user.name.split(" ")[0]}</PageTitle>
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to}>
            <Card className="flex items-center gap-4 p-5 transition hover:border-brand-500/50 hover:shadow-lg">
              <span className="grid size-12 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-soft dark:text-brand-400"><t.icon className="size-6" /></span>
              <div><p className="text-sm text-ink-2">{t.label}</p><p className="text-2xl font-bold">{t.value}</p></div>
            </Card>
          </Link>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm />
        <PasswordForm />
      </div>
    </>
  );
}
