/** Demo catalog: 6 top-level categories (each a navbar dropdown) with subcategories and products. */
export const CATALOG: Record<string, { name: string; subs: Record<string, { name: string; products: [string, number][] }> }> = {
  electronics: {
    name: "Electronics",
    subs: {
      phones: { name: "Phones", products: [["Aurora X5 Smartphone", 69900], ["Pixelite Mini", 39900], ["Nova Fold 2", 129900]] },
      laptops: { name: "Laptops", products: [["Stratus 14 Ultrabook", 109900], ["Forge 16 Gaming Laptop", 179900], ["Breeze 13 Chromebook", 32900]] },
      audio: { name: "Audio", products: [["Echo Pro Wireless Earbuds", 14900], ["Studio Over-Ear Headphones", 24900], ["Pulse Bluetooth Speaker", 7900]] },
    },
  },
  fashion: {
    name: "Fashion",
    subs: {
      men: { name: "Men", products: [["Classic Oxford Shirt", 4900], ["Slim Chino Trousers", 5900], ["Wool Blend Overcoat", 18900]] },
      women: { name: "Women", products: [["Linen Wrap Dress", 7900], ["Cashmere Crew Sweater", 12900], ["High-Rise Denim", 6900]] },
      shoes: { name: "Shoes", products: [["Trail Runner Sneakers", 11900], ["Leather Chelsea Boots", 15900], ["Canvas Low-Tops", 4900]] },
    },
  },
  home: {
    name: "Home & Kitchen",
    subs: {
      kitchen: { name: "Kitchen", products: [["Cast Iron Skillet 28cm", 3900], ["Pour-Over Coffee Set", 4500], ["Chef's Knife 20cm", 8900]] },
      furniture: { name: "Furniture", products: [["Oak Side Table", 14900], ["Ergo Office Chair", 29900], ["Floating Wall Shelf", 3900]] },
      decor: { name: "Decor", products: [["Ceramic Vase Set", 3400], ["Linen Throw Blanket", 5900], ["Brass Table Lamp", 8900]] },
    },
  },
  beauty: {
    name: "Beauty",
    subs: {
      skincare: { name: "Skincare", products: [["Hydrating Face Serum", 2900], ["Daily SPF 50 Moisturiser", 2400], ["Gentle Foaming Cleanser", 1600]] },
      fragrance: { name: "Fragrance", products: [["Cedar & Amber Eau de Parfum", 8900], ["Citrus Bloom Eau de Toilette", 5900]] },
      haircare: { name: "Hair Care", products: [["Argan Repair Shampoo", 1800], ["Ionic Hair Dryer", 7900]] },
    },
  },
  sports: {
    name: "Sports",
    subs: {
      fitness: { name: "Fitness", products: [["Adjustable Dumbbells 24kg", 22900], ["Non-Slip Yoga Mat", 3900], ["Resistance Band Set", 2400]] },
      outdoor: { name: "Outdoor", products: [["2-Person Trekking Tent", 18900], ["Insulated Water Bottle", 2900], ["Hiking Daypack 25L", 6900]] },
      cycling: { name: "Cycling", products: [["Commuter Bike Helmet", 5900], ["Rechargeable Bike Lights", 3400]] },
    },
  },
  books: {
    name: "Books",
    subs: {
      fiction: { name: "Fiction", products: [["The Lighthouse Keeper", 1800], ["Echoes of the Salt Road", 2100], ["Midnight in Lisbon", 1600]] },
      nonfiction: { name: "Non-Fiction", products: [["The Habit Engine", 2200], ["A Short History of Maps", 2600]] },
      kids: { name: "Kids", products: [["The Moon Who Couldn't Sleep", 1200], ["Dinosaur Atlas", 1900]] },
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
