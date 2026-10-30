import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { CartDrawer } from "./CartDrawer";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { NavBar } from "./NavBar";
import { Loading } from "./ui";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only z-[100] rounded-lg bg-brand-600 px-4 py-2 text-white focus:not-sr-only focus:fixed focus:start-4 focus:top-4">Skip to content</a>
      <ScrollToTop />
      <Header />
      <NavBar />
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
