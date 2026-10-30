import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useI18n } from "../lib/i18n";
import { useStore } from "../lib/store";

/** Centered form on a background image; fields stacked vertically with labels. */
function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="-mx-4 -my-8 grid min-h-[70vh] place-items-center bg-cover bg-center px-4 py-12" style={{ backgroundImage: "url(https://picsum.photos/seed/auth-bg/1600/900)" }}>
      <div className="w-full max-w-md rounded-2xl bg-white/95 p-8 shadow-2xl backdrop-blur">
        <h1 className="mb-6 text-center text-2xl font-bold">{title}</h1>
        {children}
      </div>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input required {...props} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
    </label>
  );
}

function useAuthSubmit(action: () => Promise<void>) {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await action();
      navigate((location.state as { from?: string } | null)?.from ?? "/", { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { onSubmit, error, busy };
}

const submitClass = "w-full cursor-pointer rounded-lg bg-brand-600 py-2.5 font-medium text-white hover:bg-brand-700 disabled:opacity-60";

export function LoginPage() {
  const { login } = useStore();
  const { t } = useI18n();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { onSubmit, error, busy } = useAuthSubmit(() => login(email, password));
  return (
    <AuthShell title={t("login")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className={submitClass}>{t("login")}</button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        New here? <Link to="/signup" state={location.state} className="font-medium text-brand-600 hover:underline">{t("signup")}</Link>
      </p>
      <p className="mt-4 rounded-lg bg-slate-100 p-3 text-xs text-slate-600">Demo: demo@shopsphere.dev / demo12345 · Admin: admin@shopsphere.dev / admin12345</p>
    </AuthShell>
  );
}

export function SignupPage() {
  const { signup } = useStore();
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const { onSubmit, error, busy } = useAuthSubmit(async () => {
    if (form.password !== form.confirm) throw new Error("Passwords do not match");
    await signup(form.name, form.email, form.password);
  });
  const bind = (k: keyof typeof form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }) });
  return (
    <AuthShell title={t("signup")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name" autoComplete="name" minLength={2} {...bind("name")} />
        <Field label="Email" type="email" autoComplete="email" {...bind("email")} />
        <Field label="Password" type="password" autoComplete="new-password" minLength={8} {...bind("password")} />
        <Field label="Confirm password" type="password" autoComplete="new-password" minLength={8} {...bind("confirm")} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className={submitClass}>{t("signup")}</button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account? <Link to="/login" className="font-medium text-brand-600 hover:underline">{t("login")}</Link>
      </p>
    </AuthShell>
  );
}
