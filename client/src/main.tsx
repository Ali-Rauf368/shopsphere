import { lazy, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import "./index.css";
import { useTitle } from "./lib/hooks";
import { I18nProvider } from "./lib/i18n";
import { StoreProvider } from "./lib/store";
import { ToastProvider } from "./lib/toast";
import { Home } from "./pages/Home";

// Everything except the home page is code-split.
const named = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));
const about = () => import("./pages/About");
const browse = () => import("./pages/Browse");
const account = () => import("./pages/Account");
const auth = () => import("./pages/Auth");
const orders = () => import("./pages/Orders");

const StoryPage = named(about, "StoryPage");
const VisionPage = named(about, "VisionPage");
const ReviewsPage = named(about, "ReviewsPage");
const ContactPage = named(about, "ContactPage");
const CategoryPage = named(browse, "CategoryPage");
const SearchPage = named(browse, "SearchPage");
const OffersPage = named(browse, "OffersPage");
const ProductPage = named(() => import("./pages/ProductPage"), "ProductPage");
const CartPage = named(() => import("./pages/Cart"), "CartPage");
const CheckoutPage = named(() => import("./pages/Checkout"), "CheckoutPage");
const OrdersPage = named(orders, "OrdersPage");
const OrderDetailPage = named(orders, "OrderDetailPage");
const AccountPage = named(account, "AccountPage");
const WishlistPage = named(account, "WishlistPage");
const LoginPage = named(auth, "LoginPage");
const SignupPage = named(auth, "SignupPage");
const AdminPage = named(() => import("./pages/Admin"), "AdminPage");

function NotFound() {
  useTitle("Page not found");
  return (
    <div className="py-24 text-center">
      <p className="font-display text-8xl font-extrabold text-brand-600/20">404</p>
      <p className="mt-2 text-2xl font-bold">We couldn't find that page</p>
      <p className="mt-2 mb-8 text-ink-2">It may have moved, or the link might be broken.</p>
      <Link to="/" className="rounded-xl bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700">Back to the shop</Link>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <ToastProvider>
          <StoreProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="category/:slug" element={<CategoryPage />} />
                <Route path="product/:slug" element={<ProductPage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="offers" element={<OffersPage />} />
                <Route path="about/story" element={<StoryPage />} />
                <Route path="about/vision" element={<VisionPage />} />
                <Route path="about/reviews" element={<ReviewsPage />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="signup" element={<SignupPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="orders/:id" element={<OrderDetailPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="wishlist" element={<WishlistPage />} />
                <Route path="admin" element={<AdminPage />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </StoreProvider>
        </ToastProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
);
