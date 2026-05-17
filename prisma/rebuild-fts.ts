import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "dev.db");
const db = new Database(dbPath);

console.log("Rebuilding FTS5 index...");

// Check if product_fts table exists
const tableExists = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='product_fts'"
).get();

if (!tableExists) {
  console.log("Creating product_fts table...");
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS product_fts USING fts5(
      product_id,
      name,
      brand,
      description,
      tags,
      product_type
    );
  `);
}

// Clear and repopulate
db.exec("DELETE FROM product_fts;");

const count = db.prepare(`
  INSERT INTO product_fts(product_id, name, brand, description, tags, product_type)
  SELECT id, COALESCE(name,''), COALESCE(brand,''), COALESCE(description,''), COALESCE(tags,''), COALESCE("productType",'')
  FROM Product;
`).run();

console.log(`FTS5 index rebuilt with ${count.changes} products.`);

// Ensure triggers exist
const triggers = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'product_fts_%'"
).all();

if (triggers.length < 3) {
  console.log("Creating FTS5 sync triggers...");

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS product_fts_insert AFTER INSERT ON Product BEGIN
      INSERT INTO product_fts(product_id, name, brand, description, tags, product_type)
      VALUES (NEW.id, COALESCE(NEW.name,''), COALESCE(NEW.brand,''), COALESCE(NEW.description,''), COALESCE(NEW.tags,''), COALESCE(NEW."productType",''));
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS product_fts_update AFTER UPDATE ON Product BEGIN
      DELETE FROM product_fts WHERE product_id = OLD.id;
      INSERT INTO product_fts(product_id, name, brand, description, tags, product_type)
      VALUES (NEW.id, COALESCE(NEW.name,''), COALESCE(NEW.brand,''), COALESCE(NEW.description,''), COALESCE(NEW.tags,''), COALESCE(NEW."productType",''));
    END;
  `);

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS product_fts_delete AFTER DELETE ON Product BEGIN
      DELETE FROM product_fts WHERE product_id = OLD.id;
    END;
  `);
}

console.log("Done! Triggers:", triggers.length >= 3 ? "OK" : "Created");
db.close();
