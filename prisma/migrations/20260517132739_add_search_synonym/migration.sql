-- CreateTable
CREATE TABLE "SearchSynonym" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "word" TEXT NOT NULL,
    "synonym" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "SearchSynonym_word_idx" ON "SearchSynonym"("word");

-- CreateIndex
CREATE INDEX "SearchSynonym_synonym_idx" ON "SearchSynonym"("synonym");

-- FTS5 virtual table for full-text search on products
CREATE VIRTUAL TABLE IF NOT EXISTS product_fts USING fts5(
    product_id,
    name,
    brand,
    description,
    tags,
    product_type
);

-- Populate FTS5 table with existing products
INSERT INTO product_fts(product_id, name, brand, description, tags, product_type)
SELECT id, COALESCE(name,''), COALESCE(brand,''), COALESCE(description,''), COALESCE(tags,''), COALESCE("productType",'')
FROM Product;

-- Triggers to keep FTS5 in sync with Product table
CREATE TRIGGER product_fts_insert AFTER INSERT ON Product BEGIN
    INSERT INTO product_fts(product_id, name, brand, description, tags, product_type)
    VALUES (NEW.id, COALESCE(NEW.name,''), COALESCE(NEW.brand,''), COALESCE(NEW.description,''), COALESCE(NEW.tags,''), COALESCE(NEW."productType",''));
END;

CREATE TRIGGER product_fts_update AFTER UPDATE ON Product BEGIN
    DELETE FROM product_fts WHERE product_id = OLD.id;
    INSERT INTO product_fts(product_id, name, brand, description, tags, product_type)
    VALUES (NEW.id, COALESCE(NEW.name,''), COALESCE(NEW.brand,''), COALESCE(NEW.description,''), COALESCE(NEW.tags,''), COALESCE(NEW."productType",''));
END;

CREATE TRIGGER product_fts_delete AFTER DELETE ON Product BEGIN
    DELETE FROM product_fts WHERE product_id = OLD.id;
END;
