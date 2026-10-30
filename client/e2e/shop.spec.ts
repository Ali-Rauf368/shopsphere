import { expect, test, type Page } from "@playwright/test";

const DEMO = { email: "demo@shopsphere.dev", password: "demo12345" };
const ADMIN = { email: "admin@shopsphere.dev", password: "admin12345" };

async function login(page: Page, creds = DEMO) {
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(creds.email);
  await page.getByLabel("Password", { exact: true }).fill(creds.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("button", { name: /Hello,/ })).toBeVisible();
}

async function signup(page: Page) {
  await page.goto("/signup");
  await page.getByLabel("Full name").fill("E2E Shopper");
  await page.getByLabel("Email", { exact: true }).fill(`shopper-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("Password123!");
  await page.getByLabel("Confirm password").fill("Password123!");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL("/");
}

const toast = (page: Page, text: string | RegExp) => page.getByRole("status").filter({ hasText: text });

test.describe("browsing", () => {
  test("home page shows hero, departments, deals and category sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Tech that keeps up with you" })).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("listitem").filter({ has: page.locator(":scope > a") })).toHaveCount(9);
    await expect(page.getByRole("heading", { name: "Today's flash deals" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Best sellers" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Electronics", level: 2 })).toBeVisible();
    await expect(page.getByTestId("product-card").first()).toBeVisible();
  });

  test("navbar dropdown opens on hover and links to a collection", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("link", { name: "Electronics" }).hover();
    await nav.getByRole("link", { name: "Laptops" }).click();
    await expect(page).toHaveURL(/\/category\/electronics-laptops/);
    await expect(page.getByRole("heading", { name: "Laptops", level: 1 })).toBeVisible();
    await expect(page.getByTestId("product-card")).toHaveCount(3);
  });

  test("live search suggests products and opens one with the keyboard", async ({ page }) => {
    await page.goto("/");
    const box = page.getByRole("combobox", { name: "Search products…" });
    await box.fill("skillet");
    await expect(page.getByRole("option", { name: /Cast Iron Skillet/ })).toBeVisible();
    await box.press("ArrowDown");
    await box.press("Enter");
    await expect(page).toHaveURL(/\/product\/cast-iron-skillet-28cm/);
    await expect(page.getByRole("heading", { name: "Cast Iron Skillet 28cm" })).toBeVisible();
  });

  test("full search results page", async ({ page }) => {
    await page.goto("/");
    const box = page.getByRole("combobox", { name: "Search products…" });
    await box.fill("headphones");
    await expect(page.getByRole("option", { name: /Headphones/ })).toBeVisible();
    await box.press("Enter");
    await expect(page).toHaveURL(/\/search\?q=headphones/);
    await expect(page.getByTestId("product-card")).toHaveCount(1);
  });

  test("filters narrow results and can be cleared", async ({ page }) => {
    await page.goto("/category/electronics");
    await expect(page.getByText("9 products")).toBeVisible();
    await page.getByLabel("Audio").click();
    await expect(page.getByText("3 products")).toBeVisible();
    await page.getByLabel("Under $25").click();
    await expect(page.getByText("No products match these filters")).toBeVisible();
    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(page.getByText("9 products")).toBeVisible();
  });

  test("product page shows highlights, reviews and related products", async ({ page }) => {
    await page.goto("/product/echo-pro-wireless-earbuds");
    await expect(page.getByText("Adaptive noise cancelling", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Customer reviews" })).toBeVisible();
    await expect(page.getByText("Fast delivery and the earbuds sound amazing")).toBeVisible();
    await expect(page.getByRole("heading", { name: "You might also like" })).toBeVisible();
  });

  test("dark mode toggle persists across reloads", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to dark mode" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("button", { name: "Switch to light mode" }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("language switcher translates the header", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Language").selectOption("de");
    await expect(page.getByRole("link", { name: "Anmelden" })).toBeVisible();
    await expect(page.getByPlaceholder("Produkte suchen…")).toBeVisible();
  });

  test("about → customer reviews is a searchable 7-column table with robohash avatars", async ({ page }) => {
    await page.goto("/about/reviews");
    await expect(page.getByRole("columnheader")).toHaveCount(7);
    await expect(page.locator("tbody tr").first().locator("img")).toHaveAttribute("src", /robohash\.org/);
    await page.getByLabel("Search reviews").fill("Ayesha");
    await expect(page.locator("tbody tr")).toHaveCount(1);
  });

  test("unknown pages show a friendly 404", async ({ page }) => {
    await page.goto("/this/does/not/exist");
    await expect(page.getByText("We couldn't find that page")).toBeVisible();
  });
});

test.describe("mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("menu drawer navigates to a collection", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Browse departments" }).click();
    await page.getByRole("button", { name: "Books" }).click();
    await page.getByRole("link", { name: "Kids" }).click();
    await expect(page).toHaveURL(/\/category\/books-kids/);
    await expect(page.getByTestId("product-card")).toHaveCount(2);
  });
});

test.describe("accounts", () => {
  test("adding to cart while logged out redirects to login and back", async ({ page }) => {
    await page.goto("/product/dinosaur-atlas");
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page).toHaveURL(/\/login/);
    await page.getByRole("button", { name: "Customer" }).click();
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/product\/dinosaur-atlas/);
  });

  test("signup with mismatched passwords shows an error", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("Test User");
    await page.getByLabel("Email", { exact: true }).fill("mismatch@example.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm password").fill("password999");
    await page.getByRole("button", { name: "Sign up" }).click();
    await expect(page.getByRole("alert")).toHaveText("Passwords do not match");
  });

  test("account page updates the display name", async ({ page }) => {
    await signup(page);
    await page.goto("/account");
    await page.getByLabel("Display name").fill("Renamed Shopper");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(toast(page, "Profile updated")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Hi, Renamed/ })).toBeVisible();
  });
});

test.describe("shopping", () => {
  test("full purchase: cart drawer, checkout with coupon, order tracking, cancel", async ({ page }) => {
    await signup(page);
    await page.goto("/product/dinosaur-atlas");
    await page.getByRole("button", { name: "Increase" }).click();
    await expect(page.getByTestId("qty")).toHaveText("2");
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(toast(page, "Added to cart")).toBeVisible();
    await expect(page.getByTestId("cart-count")).toHaveText("2");

    await page.getByRole("button", { name: "Cart", exact: true }).click();
    const drawer = page.getByRole("dialog", { name: "Shopping cart" });
    await expect(drawer.getByTestId("drawer-item")).toHaveCount(1);
    await expect(drawer.getByText(/more for free shipping/)).toBeVisible();
    await drawer.getByRole("link", { name: "Checkout" }).click();

    await expect(page).toHaveURL(/\/checkout/);
    await page.getByLabel("Street address").fill("1 Test Lane");
    await page.getByLabel("City").fill("Testville");
    await page.getByLabel("Postcode").fill("12345");
    await page.getByLabel("Country").fill("Germany");
    await page.getByRole("button", { name: "Continue to review" }).click();

    // $19.00 × 2 = $38.00, plus $4.99 shipping.
    await expect(page.getByTestId("checkout-total")).toHaveText("$42.99");
    await page.getByLabel("Coupon code").fill("welcome10");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByRole("button", { name: "Remove coupon" })).toBeVisible();
    await expect(page.getByTestId("checkout-total")).toHaveText("$39.19");

    await page.getByRole("button", { name: /Place order/ }).click();
    await expect(page).toHaveURL(/\/orders\/\d+\?placed=1/);
    await expect(page.getByRole("heading", { name: "Thank you, E2E!" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Order progress" })).toContainText("Order placed");
    await expect(page.getByTestId("cart-count")).toHaveCount(0);

    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Cancel order" }).click();
    await expect(toast(page, "Order cancelled")).toBeVisible();
    await expect(page.getByText(/Cancelled on/)).toBeVisible();
  });

  test("invalid coupon shows the reason", async ({ page }) => {
    await signup(page);
    await page.goto("/product/dinosaur-atlas");
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByTestId("cart-count")).toHaveText("1");
    await page.goto("/checkout");
    await page.getByLabel("Coupon code").fill("BIG20");
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByRole("alert")).toContainText("needs a subtotal of at least $150.00");
  });

  test("wishlist: save from a card, see it on the wishlist page, remove it", async ({ page }) => {
    await signup(page);
    await page.goto("/category/books-kids");
    await page.getByRole("button", { name: "Save Dinosaur Atlas to wishlist" }).click();
    await expect(toast(page, "Saved to wishlist")).toBeVisible();
    await page.getByRole("link", { name: "Wishlist" }).click();
    await expect(page.getByTestId("product-card")).toHaveCount(1);
    await page.getByRole("button", { name: "Remove Dinosaur Atlas from wishlist" }).click();
    await expect(page.getByText("Your wishlist is empty")).toBeVisible();
  });

  test("customer can post a product review", async ({ page }) => {
    await login(page);
    await page.goto("/product/the-habit-engine");
    await page.getByRole("button", { name: "4 stars" }).click();
    await page.getByPlaceholder("What did you think?").fill("Changed my mornings.");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(toast(page, "Thanks for your review!")).toBeVisible();
    await expect(page.getByText("Changed my mornings.")).toBeVisible();
  });

  test("contact form and newsletter submit", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel("Name").fill("Ali");
    await page.getByLabel("Email", { exact: true }).fill("ali@example.com");
    await page.getByLabel("Message").fill("Do you ship internationally?");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(toast(page, "Message sent")).toBeVisible();

    await page.getByLabel("Email for newsletter").fill("fan@example.com");
    await page.getByRole("button", { name: "Subscribe" }).click();
    await expect(toast(page, "Subscribed")).toBeVisible();
  });
});

test.describe("admin", () => {
  test("dashboard, product editing and order status", async ({ page }) => {
    await login(page, ADMIN);
    await page.getByRole("button", { name: /Hello,/ }).click();
    await page.getByRole("menuitem", { name: "Admin dashboard" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.locator(".recharts-surface").first()).toBeVisible();

    await page.getByRole("tab", { name: "Products" }).click();
    await page.getByLabel("Search products").fill("Dinosaur");
    await page.getByRole("button", { name: "Edit Dinosaur Atlas" }).click();
    const dialog = page.getByRole("dialog", { name: "Edit product" });
    await dialog.getByLabel("Stock").fill("7");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(toast(page, "Product updated")).toBeVisible();
    await expect(page.getByRole("row", { name: /Dinosaur Atlas/ })).toContainText("7");

    await page.getByRole("tab", { name: "Orders" }).click();
    const firstStatus = page.getByLabel(/Status of order/).first();
    await firstStatus.selectOption("delivered");
    await expect(toast(page, /marked delivered/)).toBeVisible();
  });

  test("customers are kept out of the dashboard", async ({ page }) => {
    await login(page);
    await page.goto("/admin");
    await expect(page).toHaveURL("/");
  });
});
