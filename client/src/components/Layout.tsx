import { Outlet } from "react-router";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { NavBar } from "./NavBar";

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />
      <NavBar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function PageTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight">{children}</h1>
      {sub && <p className="mt-1 text-slate-500">{sub}</p>}
    </div>
  );
}

export function Loading() {
  return <p className="py-16 text-center text-slate-500">Loading…</p>;
}

export function ErrorBox({ error }: { error: Error }) {
  return <p className="rounded-lg bg-red-50 p-4 text-red-700">{error.message}</p>;
}
