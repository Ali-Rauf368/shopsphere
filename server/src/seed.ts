import { config } from "./config.js";
import { seedDatabase } from "./lib/seed.js";

const { products } = await seedDatabase(config.databaseUrl, { orders: true });
console.log(`Seeded ${products} products. Admin: admin@shopsphere.dev / admin12345 · Customer: demo@shopsphere.dev / demo12345`);
