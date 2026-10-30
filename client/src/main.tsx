import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import "./index.css";
import { I18nProvider } from "./lib/i18n";
import { StoreProvider } from "./lib/store";
import { ContactPage, ReviewsPage, StoryPage, VisionPage } from "./pages/About";
import { AdminPage } from "./pages/Admin";
import { LoginPage, SignupPage } from "./pages/Auth";
import { CategoryPage, OffersPage, SearchPage } from "./pages/Browse";
import { CartPage } from "./pages/Cart";
import { Home } from "./pages/Home";
import { OrdersPage } from "./pages/Orders";
import { ProductPage } from "./pages/ProductPage";

function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-6xl font-bold text-slate-300">404</p>
      <p className="mt-2 mb-6 text-slate-600">That page doesn't exist.</p>
      <Link to="/" className="text-brand-600 hover:underline">Back to the shop</Link>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <I18nProvider>
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
              <Route path="orders" element={<OrdersPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </StoreProvider>
      </I18nProvider>
    </BrowserRouter>
  </StrictMode>,
);
