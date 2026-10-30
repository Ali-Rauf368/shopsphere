const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema: object) => ({ "application/json": { schema } });
const ok = (description: string, schema?: object) => ({ description, ...(schema ? { content: json(schema) } : {}) });
const body = (schema: object) => ({ required: true, content: json(schema) });
const idParam = (name = "id") => ({ name, in: "path", required: true, schema: { type: "integer" } });
const secured = [{ bearerAuth: [] }];
const errors = { "400": ok("Validation failed", ref("Error")), "401": ok("Not authenticated", ref("Error")) };

export const openapi = {
  openapi: "3.1.0",
  info: { title: "ShopSphere API", version: "0.1.0", description: "E-commerce backend: catalog, cart, checkout, reviews, admin." },
  servers: [{ url: "/" }],
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    schemas: {
      Error: { type: "object", properties: { error: { type: "string" }, details: {} }, required: ["error"] },
      User: {
        type: "object",
        properties: { id: { type: "integer" }, email: { type: "string" }, name: { type: "string" }, role: { enum: ["customer", "admin"] } },
      },
      AuthResponse: { type: "object", properties: { token: { type: "string" }, user: ref("User") } },
      Category: {
        type: "object",
        properties: { id: { type: "integer" }, slug: { type: "string" }, name: { type: "string" }, children: { type: "array", items: { type: "object" } } },
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "integer" }, slug: { type: "string" }, name: { type: "string" }, description: { type: "string" },
          priceCents: { type: "integer" }, discountPercent: { type: "integer" }, finalPriceCents: { type: "integer" },
          imageUrl: { type: "string" }, videoUrl: { type: ["string", "null"] }, stock: { type: "integer" }, featured: { type: "boolean" },
          category: { type: "object", properties: { id: { type: "integer" }, slug: { type: "string" }, name: { type: "string" } } },
          rating: { type: ["number", "null"] }, reviewCount: { type: "integer" },
        },
      },
      ProductInput: {
        type: "object",
        required: ["slug", "name", "priceCents", "imageUrl", "categoryId"],
        properties: {
          slug: { type: "string" }, name: { type: "string" }, description: { type: "string" }, priceCents: { type: "integer" },
          discountPercent: { type: "integer" }, imageUrl: { type: "string" }, videoUrl: { type: ["string", "null"] },
          stock: { type: "integer" }, featured: { type: "boolean" }, categoryId: { type: "integer" },
        },
      },
      Cart: {
        type: "object",
        properties: {
          items: { type: "array", items: { type: "object", properties: { product: ref("Product"), quantity: { type: "integer" }, lineTotalCents: { type: "integer" } } } },
          itemCount: { type: "integer" }, subtotalCents: { type: "integer" },
        },
      },
      Order: {
        type: "object",
        properties: {
          id: { type: "integer" }, status: { enum: ["pending", "paid", "shipped", "delivered", "cancelled"] }, totalCents: { type: "integer" },
          shippingAddress: { type: "string" }, createdAt: { type: "string", format: "date-time" }, items: { type: "array", items: { type: "object" } },
        },
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "integer" }, authorName: { type: "string" }, rating: { type: "integer" }, comment: { type: "string" },
          productId: { type: ["integer", "null"] }, productName: { type: ["string", "null"] }, avatarUrl: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/api/health": { get: { tags: ["System"], summary: "Health check", responses: { "200": ok("OK") } } },
    "/api/auth/signup": {
      post: {
        tags: ["Auth"], summary: "Create an account",
        requestBody: body({ type: "object", required: ["name", "email", "password"], properties: { name: { type: "string" }, email: { type: "string" }, password: { type: "string", minLength: 8 } } }),
        responses: { "201": ok("Created", ref("AuthResponse")), "409": ok("Email taken", ref("Error")), ...errors },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"], summary: "Log in",
        requestBody: body({ type: "object", required: ["email", "password"], properties: { email: { type: "string" }, password: { type: "string" } } }),
        responses: { "200": ok("Logged in", ref("AuthResponse")), ...errors },
      },
    },
    "/api/auth/me": { get: { tags: ["Auth"], summary: "Current user", security: secured, responses: { "200": ok("User"), ...errors } } },
    "/api/categories": { get: { tags: ["Catalog"], summary: "Navigation tree", responses: { "200": ok("Categories") } } },
    "/api/categories/{slug}": {
      get: { tags: ["Catalog"], summary: "One category", parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Category"), "404": ok("Not found", ref("Error")) } },
    },
    "/api/products": {
      get: {
        tags: ["Catalog"], summary: "Search and filter products",
        parameters: ["q", "category", "featured", "offers", "minPrice", "maxPrice", "sort", "page", "pageSize"].map((name) => ({ name, in: "query", schema: { type: "string" } })),
        responses: { "200": ok("Paged products", { type: "object", properties: { products: { type: "array", items: ref("Product") }, total: { type: "integer" }, page: { type: "integer" }, pageSize: { type: "integer" } } }) },
      },
      post: { tags: ["Admin"], summary: "Create product", security: secured, requestBody: body(ref("ProductInput")), responses: { "201": ok("Created"), "403": ok("Forbidden", ref("Error")), ...errors } },
    },
    "/api/products/{slug}": {
      get: { tags: ["Catalog"], summary: "Product by slug", parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }], responses: { "200": ok("Product"), "404": ok("Not found", ref("Error")) } },
    },
    "/api/products/{id}": {
      patch: { tags: ["Admin"], summary: "Update product", security: secured, parameters: [idParam()], requestBody: body(ref("ProductInput")), responses: { "200": ok("Updated"), "404": ok("Not found", ref("Error")), ...errors } },
      delete: { tags: ["Admin"], summary: "Delete product", security: secured, parameters: [idParam()], responses: { "204": ok("Deleted"), "404": ok("Not found", ref("Error")), ...errors } },
    },
    "/api/cart": {
      get: { tags: ["Cart"], summary: "Get cart", security: secured, responses: { "200": ok("Cart", ref("Cart")), ...errors } },
      delete: { tags: ["Cart"], summary: "Empty cart", security: secured, responses: { "204": ok("Emptied"), ...errors } },
    },
    "/api/cart/items": {
      post: {
        tags: ["Cart"], summary: "Add to cart", security: secured,
        requestBody: body({ type: "object", required: ["productId"], properties: { productId: { type: "integer" }, quantity: { type: "integer" } } }),
        responses: { "201": ok("Cart", ref("Cart")), "409": ok("Insufficient stock", ref("Error")), ...errors },
      },
    },
    "/api/cart/items/{productId}": {
      put: { tags: ["Cart"], summary: "Set quantity", security: secured, parameters: [idParam("productId")], requestBody: body({ type: "object", properties: { quantity: { type: "integer" } } }), responses: { "200": ok("Cart", ref("Cart")), ...errors } },
      delete: { tags: ["Cart"], summary: "Remove item", security: secured, parameters: [idParam("productId")], responses: { "200": ok("Cart", ref("Cart")), ...errors } },
    },
    "/api/orders": {
      get: { tags: ["Orders"], summary: "My orders", security: secured, responses: { "200": ok("Orders"), ...errors } },
      post: {
        tags: ["Orders"], summary: "Check out the cart", security: secured,
        requestBody: body({ type: "object", required: ["shippingAddress"], properties: { shippingAddress: { type: "string" } } }),
        responses: { "201": ok("Order", { type: "object", properties: { order: ref("Order") } }), "409": ok("Out of stock", ref("Error")), ...errors },
      },
    },
    "/api/orders/{id}": { get: { tags: ["Orders"], summary: "One order", security: secured, parameters: [idParam()], responses: { "200": ok("Order"), "404": ok("Not found", ref("Error")) } } },
    "/api/orders/{id}/cancel": { post: { tags: ["Orders"], summary: "Cancel order and restock", security: secured, parameters: [idParam()], responses: { "200": ok("Cancelled"), "409": ok("Not cancellable", ref("Error")) } } },
    "/api/reviews": {
      get: { tags: ["Reviews"], summary: "List reviews", parameters: [{ name: "productId", in: "query", schema: { type: "integer" } }, { name: "limit", in: "query", schema: { type: "integer" } }], responses: { "200": ok("Reviews") } },
      post: {
        tags: ["Reviews"], summary: "Write a review", security: secured,
        requestBody: body({ type: "object", required: ["rating", "comment"], properties: { productId: { type: ["integer", "null"] }, rating: { type: "integer" }, comment: { type: "string" } } }),
        responses: { "201": ok("Created", { type: "object", properties: { review: ref("Review") } }), ...errors },
      },
    },
    "/api/contact": {
      post: {
        tags: ["Contact"], summary: "Send a contact message",
        requestBody: body({ type: "object", required: ["name", "email", "message"], properties: { name: { type: "string" }, email: { type: "string" }, message: { type: "string" } } }),
        responses: { "201": ok("Received"), ...errors },
      },
    },
    "/api/admin/stats": { get: { tags: ["Admin"], summary: "Dashboard stats", security: secured, responses: { "200": ok("Stats"), "403": ok("Forbidden", ref("Error")) } } },
    "/api/admin/orders": { get: { tags: ["Admin"], summary: "All orders", security: secured, responses: { "200": ok("Orders") } } },
    "/api/admin/orders/{id}": {
      patch: { tags: ["Admin"], summary: "Update order status", security: secured, parameters: [idParam()], requestBody: body({ type: "object", properties: { status: { type: "string" } } }), responses: { "200": ok("Updated") } },
    },
  },
};
