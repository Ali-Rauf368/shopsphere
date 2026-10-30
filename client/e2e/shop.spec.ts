import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, email = "demo@shopsphere.dev", password = "demo12345") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("link", { name: "Log in" })).toHaveCount(0);
}

test("home page shows carousel, navbar and category sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Tech that keeps up with you" })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("listitem").filter({ has: page.locator(":scope > a") })).toHaveCount(9);
  await expect(page.getByRole("heading", { name: "Electronics", level: 2 })).toBeVisible();
  await expect(page.getByTestId("product-card").first()).toBeVisible();
});

test("navbar dropdown opens on hover and links to a subcategory", async ({ page }) => {
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  await nav.getByRole("link", { name: "Electronics" }).hover();
  await nav.getByRole("link", { name: "Laptops" }).click();
  await expect(page).toHaveURL(/\/category\/electronics-laptops/);
  await expect(page.getByRole("heading", { name: "Laptops" })).toBeVisible();
  await expect(page.getByTestId("product-card")).toHaveCount(3);
});

test("search finds products", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox").or(page.getByPlaceholder("Search products…")).fill("skillet");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/search\?q=skillet/);
  await expect(page.getByTestId("product-card")).toHaveCount(1);
  await expect(page.getByText("Cast Iron Skillet 28cm")).toBeVisible();
});

test("adding to cart while logged out redirects to login", async ({ page }) => {
  await page.goto("/product/dinosaur-atlas");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("signup with mismatched passwords shows an error", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Full name").fill("Test User");
  await page.getByLabel("Email").fill("mismatch@example.com");
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password").fill("password999");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page.getByRole("alert")).toHaveText("Passwords do not match");
});

test("full purchase: sign up, add to cart, check out, cancel", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Full name").fill("E2E Shopper");
  await page.getByLabel("Email").fill(`shopper-${Date.now()}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password").fill("password123");
  await page.getByRole("button", { name: "Sign up" }).click();
  await expect(page).toHaveURL("/");

  await page.goto("/product/dinosaur-atlas");
  await page.getByRole("button", { name: "Increase" }).click();
  await expect(page.getByTestId("qty")).toHaveText("2");
  await page.getByRole("button", { name: "Add to cart" }).click();
  await expect(page.getByTestId("cart-count")).toHaveText("2");

  await page.getByRole("link", { name: "Cart" }).click();
  await expect(page.getByTestId("cart-item")).toHaveCount(1);
  await expect(page.getByTestId("cart-total")).toHaveText("$38.00");

  await page.getByLabel("Shipping address").fill("1 Test Lane, Testville 12345");
  await page.getByRole("button", { name: "Place order" }).click();
  await expect(page).toHaveURL(/\/orders\?placed=\d+/);
  await expect(page.getByRole("status")).toContainText("has been placed");
  await expect(page.getByTestId("order")).toHaveCount(1);
  await expect(page.getByTestId("cart-count")).toHaveCount(0);

  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Cancel order" }).click();
  await expect(page.getByTestId("order").getByText("cancelled")).toBeVisible();
});

test("customer can post a product review", async ({ page }) => {
  await login(page);
  await page.goto("/product/the-habit-engine");
  await page.getByRole("button", { name: "4 stars" }).click();
  await page.getByPlaceholder("What did you think?").fill("Changed my mornings.");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Changed my mornings.")).toBeVisible();
  await expect(page.getByText("1 reviews")).toBeVisible();
});

test("about → customer reviews shows a 7-column table with robohash avatars", async ({ page }) => {
  await page.goto("/about/reviews");
  await expect(page.getByRole("columnheader")).toHaveCount(7);
  await expect(page.locator("tbody tr").first().locator("img")).toHaveAttribute("src", /robohash\.org/);
});

test("contact form submits", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Name").fill("Ali");
  await page.getByLabel("Email").fill("ali@example.com");
  await page.getByLabel("Message").fill("Do you ship internationally?");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Thanks! We'll get back to you soon.")).toBeVisible();
});

test("language switcher translates the header", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Language").selectOption("de");
  await expect(page.getByRole("link", { name: "Anmelden" })).toBeVisible();
  await expect(page.getByPlaceholder("Produkte suchen…")).toBeVisible();
});

test("admin sees the dashboard; customers are redirected", async ({ page }) => {
  await login(page, "admin@shopsphere.dev", "admin12345");
  await page.getByTitle("Dashboard").click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByTestId("stat-products")).toHaveText("49");
  await expect(page.locator(".recharts-surface").first()).toBeVisible();

  await page.getByTitle("Log out").click();
  await login(page);
  await page.goto("/admin");
  await expect(page).toHaveURL("/");
});
