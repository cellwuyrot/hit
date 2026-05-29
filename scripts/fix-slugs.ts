/**
 * Fix product/category slugs that contain residual Cyrillic characters (ь, ъ, etc.)
 * due to a bug in the slugify function where empty-string transliterations
 * were treated as falsy and the original character was kept.
 *
 * Usage: npx tsx scripts/fix-slugs.ts
 */
import Database from "better-sqlite3";
import path from "path";
import { slugify } from "../src/lib/slugify";

const dbPath = path.join(process.cwd(), process.env.DATABASE_URL?.replace("file:", "") || "dev.db");
const db = new Database(dbPath);
const cyrillicRe = /[а-яёА-ЯЁ]/;
let fixed = 0;

// Fix products
const products = db.prepare("SELECT id, name, slug FROM Product").all() as { id: string; name: string; slug: string }[];
for (const p of products) {
  if (cyrillicRe.test(p.slug)) {
    const newSlug = slugify(p.name);
    if (newSlug !== p.slug) {
      const exists = db.prepare("SELECT id FROM Product WHERE slug = ? AND id != ?").get(newSlug, p.id);
      const finalSlug = exists ? `${newSlug}-${p.id.slice(0, 6)}` : newSlug;
      db.prepare("UPDATE Product SET slug = ? WHERE id = ?").run(finalSlug, p.id);
      console.log(`  ${p.slug} → ${finalSlug}`);
      fixed++;
    }
  }
}

// Fix categories
const categories = db.prepare("SELECT id, name, slug FROM Category").all() as { id: string; name: string; slug: string }[];
for (const c of categories) {
  if (cyrillicRe.test(c.slug)) {
    const newSlug = slugify(c.name);
    if (newSlug !== c.slug) {
      const exists = db.prepare("SELECT id FROM Category WHERE slug = ? AND id != ?").get(newSlug, c.id);
      const finalSlug = exists ? `${newSlug}-${c.id.slice(0, 6)}` : newSlug;
      db.prepare("UPDATE Category SET slug = ? WHERE id = ?").run(finalSlug, c.id);
      console.log(`  [cat] ${c.slug} → ${finalSlug}`);
      fixed++;
    }
  }
}

console.log(`\nFixed ${fixed} slugs.`);
db.close();
