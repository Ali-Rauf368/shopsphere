import { Router } from "express";
import { query } from "../db.js";
import { notFound } from "../lib/http-error.js";

const router = Router();

interface CategoryRow {
  id: number;
  slug: string;
  name: string;
  parent_id: number | null;
}

/** Returns the navigation tree: top-level categories with their subcategories. */
router.get("/", async (_req, res) => {
  const rows = await query<CategoryRow>("SELECT id, slug, name, parent_id FROM categories ORDER BY position, id");
  const top = rows.filter((c) => c.parent_id === null);
  res.json({
    categories: top.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      children: rows.filter((s) => s.parent_id === c.id).map(({ id, slug, name }) => ({ id, slug, name })),
    })),
  });
});

router.get("/:slug", async (req, res) => {
  const [cat] = await query<CategoryRow>("SELECT id, slug, name, parent_id FROM categories WHERE slug = $1", [
    req.params.slug,
  ]);
  if (!cat) throw notFound("Category");
  const children = await query<CategoryRow>("SELECT id, slug, name FROM categories WHERE parent_id = $1 ORDER BY position", [
    cat.id,
  ]);
  res.json({ category: { id: cat.id, slug: cat.slug, name: cat.name, parentId: cat.parent_id, children } });
});

export default router;
