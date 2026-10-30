/** Demo catalog: 6 top-level categories (each a navbar dropdown) with subcategories and products. */
export const CATALOG: Record<string, { name: string; subs: Record<string, { name: string; products: [name: string, priceCents: number, unsplashPhotoId: string][] }> }> = {
  electronics: {
    name: "Electronics",
    subs: {
      phones: { name: "Phones", products: [["Aurora X5 Smartphone", 69900, "1511707171634-5f897ff02aa9"], ["Pixelite Mini", 39900, "1592750475338-74b7b21085ab"], ["Nova Fold 2", 129900, "1598327105666-5b89351aff97"]] },
      laptops: { name: "Laptops", products: [["Stratus 14 Ultrabook", 109900, "1496181133206-80ce9b88a853"], ["Forge 16 Gaming Laptop", 179900, "1603302576837-37561b2e2302"], ["Breeze 13 Chromebook", 32900, "1525547719571-a2d4ac8945e2"]] },
      audio: { name: "Audio", products: [["Echo Pro Wireless Earbuds", 14900, "1590658268037-6bf12165a8df"], ["Studio Over-Ear Headphones", 24900, "1505740420928-5e560c06d30e"], ["Pulse Bluetooth Speaker", 7900, "1608043152269-423dbba4e7e1"]] },
    },
  },
  fashion: {
    name: "Fashion",
    subs: {
      men: { name: "Men", products: [["Classic Oxford Shirt", 4900, "1596755094514-f87e34085b2c"], ["Slim Chino Trousers", 5900, "1473966968600-fa801b869a1a"], ["Wool Blend Overcoat", 18900, "1539533018447-63fcce2678e3"]] },
      women: { name: "Women", products: [["Linen Wrap Dress", 7900, "1595777457583-95e059d581b8"], ["Cashmere Crew Sweater", 12900, "1620799140408-edc6dcb6d633"], ["High-Rise Denim", 6900, "1541099649105-f69ad21f3246"]] },
      shoes: { name: "Shoes", products: [["Trail Runner Sneakers", 11900, "1542291026-7eec264c27ff"], ["Leather Chelsea Boots", 15900, "1608256246200-53e635b5b65f"], ["Canvas Low-Tops", 4900, "1525966222134-fcfa99b8ae77"]] },
    },
  },
  home: {
    name: "Home & Kitchen",
    subs: {
      kitchen: { name: "Kitchen", products: [["Cast Iron Skillet 28cm", 3900, "1604908176997-125f25cc6f3d"], ["Pour-Over Coffee Set", 4500, "1495474472287-4d71bcdd2085"], ["Chef's Knife 20cm", 8900, "1593618998160-e34014e67546"]] },
      furniture: { name: "Furniture", products: [["Oak Side Table", 14900, "1532372320572-cda25653a26d"], ["Ergo Office Chair", 29900, "1580480055273-228ff5388ef8"], ["Floating Wall Shelf", 3900, "1594620302200-9a762244a156"]] },
      decor: { name: "Decor", products: [["Ceramic Vase Set", 3400, "1578500494198-246f612d3b3d"], ["Linen Throw Blanket", 5900, "1522771739844-6a9f6d5f14af"], ["Brass Table Lamp", 8900, "1507473885765-e6ed057f782c"]] },
    },
  },
  beauty: {
    name: "Beauty",
    subs: {
      skincare: { name: "Skincare", products: [["Hydrating Face Serum", 2900, "1620916566398-39f1143ab7be"], ["Daily SPF 50 Moisturiser", 2400, "1556228578-8c89e6adf883"], ["Gentle Foaming Cleanser", 1600, "1608248543803-ba4f8c70ae0b"]] },
      fragrance: { name: "Fragrance", products: [["Cedar & Amber Eau de Parfum", 8900, "1541643600914-78b084683601"], ["Citrus Bloom Eau de Toilette", 5900, "1592945403244-b3fbafd7f539"]] },
      haircare: { name: "Hair Care", products: [["Argan Repair Shampoo", 1800, "1535585209827-a15fcdbc4c2d"], ["Ionic Hair Dryer", 7900, "1522338140262-f46f5913618a"]] },
    },
  },
  sports: {
    name: "Sports",
    subs: {
      fitness: { name: "Fitness", products: [["Adjustable Dumbbells 24kg", 22900, "1638536532686-d610adfc8e5c"], ["Non-Slip Yoga Mat", 3900, "1544367567-0f2fcb009e0b"], ["Battle Rope 12m", 5900, "1599058917765-a780eda07a3e"]] },
      outdoor: { name: "Outdoor", products: [["2-Person Trekking Tent", 18900, "1504280390367-361c6d9f38f4"], ["Insulated Water Bottle", 2900, "1602143407151-7111542de6e8"], ["Hiking Daypack 25L", 6900, "1553062407-98eeb64c6a62"]] },
      cycling: { name: "Cycling", products: [["Single-Speed City Bike", 49900, "1505705694340-019e1e335916"], ["Rechargeable Bike Lights", 3400, "1485965120184-e220f721d03e"]] },
    },
  },
  books: {
    name: "Books",
    subs: {
      fiction: { name: "Fiction", products: [["The Lighthouse Keeper", 1800, "1512820790803-83ca734da794"], ["Echoes of the Salt Road", 2100, "1544947950-fa07a98d237f"], ["Midnight in Lisbon", 1600, "1495446815901-a7297e633e8d"]] },
      nonfiction: { name: "Non-Fiction", products: [["The Habit Engine", 2200, "1589998059171-988d887df646"], ["A Short History of Maps", 2600, "1524661135-423995f22d0b"]] },
      kids: { name: "Kids", products: [["The Moon Who Couldn't Sleep", 1200, "1503676260728-1c00da094a0b"], ["Dinosaur Atlas", 1900, "1525877442103-5ddb2089b2bb"]] },
    },
  },
};

/** [author, rating, comment, product slug or null for a store-wide review] */
export const REVIEWS: [string, number, string, string | null][] = [
  ["Ayesha Khan", 5, "Fast delivery and the earbuds sound amazing. Will order again!", "echo-pro-wireless-earbuds"],
  ["Lukas Meyer", 4, "Great prices. Packaging could be a little more eco-friendly.", null],
  ["Sofia Rossi", 5, "Customer support sorted out my size exchange in a day.", "high-rise-denim"],
  ["Omar Farooq", 4, "Huge selection, everything really is under one roof.", null],
  ["Mei Chen", 5, "The cast iron skillet is fantastic quality for the price.", "cast-iron-skillet-28cm"],
  ["Daniel Okafor", 3, "Good products but my order took a week to arrive.", null],
  ["Hannah Schmidt", 5, "Love the special offers page — got a laptop at 20% off.", "stratus-14-ultrabook"],
];

export const SAMPLE_VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

/** Unsplash photo URL, cropped to the given size. */
export const photo = (id: string, w = 800, h = 600) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;

export const COUPONS = [
  { code: "WELCOME10", description: "10% off your first order", percentOff: 10, minSubtotalCents: 0, active: true, expired: false },
  { code: "BIG20", description: "20% off orders over $150", percentOff: 20, minSubtotalCents: 15000, active: true, expired: false },
  { code: "SUMMER24", description: "Last summer's sale", percentOff: 25, minSubtotalCents: 0, active: true, expired: true },
  { code: "PAUSED", description: "Disabled campaign", percentOff: 15, minSubtotalCents: 0, active: false, expired: false },
];

export const REVIEWERS = [
  "Priya Nair", "Jonas Berg", "Fatima Zahra", "Tom Becker", "Aisha Rahman", "Leo Martins", "Yuki Tanaka", "Grace Liu",
  "Bilal Ahmed", "Emma Clarke", "Carlos Ruiz", "Nina Petrova", "Hamza Iqbal", "Chloe Dubois", "Arjun Mehta", "Sara Lindqvist",
];

/** Generic but natural-sounding product feedback, grouped by star rating. */
export const REVIEW_LINES: Record<number, string[]> = {
  5: [
    "Exactly as described and arrived two days early. Really happy with it.",
    "Excellent quality for the price. I've already recommended it to friends.",
    "Love it! Feels premium and works perfectly.",
    "Second time buying this. It's that good.",
    "Beautifully made. The photos don't do it justice.",
  ],
  4: [
    "Very good overall. Took a little getting used to, but I'd buy it again.",
    "Solid quality and quick delivery. Packaging could be smaller.",
    "Great value. Only knocked off a star because the colour is slightly darker in person.",
    "Does the job well. Happy with the purchase.",
  ],
  3: [
    "It's fine. Does what it says, nothing more.",
    "Decent, but I expected slightly better finishing at this price.",
  ],
};
