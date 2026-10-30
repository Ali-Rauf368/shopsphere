import { Eye, EyeOff } from "lucide-react";
import { Logo } from "../components/Logo";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { Button, Field } from "../components/ui";
import { useTitle } from "../lib/hooks";
import { useI18n } from "../lib/i18n";
import { useStore } from "../lib/store";
import { useToast } from "../lib/toast";

/** Centered form on a background image (original design); fields stacked vertically with labels. */
function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="-mx-4 -my-8 grid min-h-[78vh] place-items-center bg-cover bg-center px-4 py-12" style={{ backgroundImage: "linear-gradient(rgba(31,27,22,.45),rgba(31,27,22,.45)), url(https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&h=900&fit=crop&auto=format&q=60)" }}>
      <div className="w-full max-w-md rounded-xl bg-card p-8 shadow-xl sm:p-10">
        <div className="mb-6 text-center"><Logo /></div>
        <h1 className="text-center text-3xl">{title}</h1>
        <p className="mt-1 mb-7 text-center text-sm text-ink-2">{sub}</p>
        {children}
      </div>
    </div>
  );
}

function PasswordField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Field label={label} type={show ? "text" : "password"} {...props} />
      <button type="button" onClick={() => setShow(!show)} className="absolute end-3 top-[2.35rem] cursor-pointer text-ink-3 hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function useAuthSubmit(action: () => Promise<void>, welcome: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await action();
      toast({ kind: "success", title: welcome });
      navigate((location.state as { from?: string } | null)?.from ?? "/", { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { onSubmit, error, busy };
}

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

export function LoginPage() {
  useTitle("Log in");
  const { login, user } = useStore();
  const { t } = useI18n();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { onSubmit, error, busy } = useAuthSubmit(() => login(email, password), "Welcome back!");
  // Already signed in (e.g. pressed Back): continue to where they were headed.
  if (user && !busy) return <Navigate to={(location.state as { from?: string } | null)?.from ?? "/"} replace />;
  const fill = (e: string, p: string) => (setEmail(e), setPassword(p));
  return (
    <AuthShell title="Welcome back" sub="Log in to see your orders and saved items.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <PasswordField label="Password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">{error}</p>}
        <Button busy={busy} className="w-full py-3">{t("login")}</Button>
      </form>
      <p className="mt-5 text-center text-sm text-ink-2">
        New here? <Link to="/signup" state={location.state} className="font-semibold text-brand-600 hover:underline">Create an account</Link>
      </p>
      <div className="mt-6 rounded-xl bg-soft p-3 text-xs text-ink-2">
        <p className="mb-2 font-medium">Just looking around? Use a demo account:</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => fill("demo@shopsphere.dev", "demo12345")} className="flex-1 cursor-pointer rounded-lg border border-line bg-card py-1.5 font-medium hover:border-brand-500">Customer</button>
          <button type="button" onClick={() => fill("admin@shopsphere.dev", "admin12345")} className="flex-1 cursor-pointer rounded-lg border border-line bg-card py-1.5 font-medium hover:border-brand-500">Admin</button>
        </div>
      </div>
    </AuthShell>
  );
}

export function SignupPage() {
  useTitle("Sign up");
  const { signup } = useStore();
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const { onSubmit, error, busy } = useAuthSubmit(async () => {
    if (form.password !== form.confirm) throw new Error("Passwords do not match");
    await signup(form.name, form.email, form.password);
  }, "Account created. Welcome to ShopSphere!");
  const bind = (k: keyof typeof form) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value }) });
  const s = strength(form.password);
  return (
    <AuthShell title="Create your account" sub="It takes a minute, and your first order is 10% off.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name" autoComplete="name" required minLength={2} {...bind("name")} />
        <Field label="Email" type="email" autoComplete="email" required {...bind("email")} />
        <div>
          <PasswordField label="Password" autoComplete="new-password" required minLength={8} {...bind("password")} />
          {form.password && (
            <div className="mt-2 flex items-center gap-2" aria-live="polite">
              <div className="flex flex-1 gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={`h-1 flex-1 rounded-full ${i < s ? ["bg-rose-500", "bg-amber-500", "bg-lime-500", "bg-emerald-500"][s - 1] : "bg-line"}`} />)}</div>
              <span className="w-14 text-end text-xs text-ink-3">{["Too weak", "Weak", "Good", "Strong", "Excellent"][s]}</span>
            </div>
          )}
        </div>
        <PasswordField label="Confirm password" autoComplete="new-password" required minLength={8} {...bind("confirm")} />
        {error && <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">{error}</p>}
        <Button busy={busy} className="w-full py-3">{t("signup")}</Button>
      </form>
      <p className="mt-5 text-center text-sm text-ink-2">
        Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:underline">{t("login")}</Link>
      </p>
    </AuthShell>
  );
}
