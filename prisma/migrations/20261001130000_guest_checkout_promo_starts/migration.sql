-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN "startsAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "total" REAL NOT NULL,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "email" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "comment" TEXT NOT NULL DEFAULT '',
    "trackNumber" TEXT NOT NULL DEFAULT '',
    "trackUrl" TEXT NOT NULL DEFAULT '',
    "promoCode" TEXT NOT NULL DEFAULT '',
    "discount" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("address", "comment", "createdAt", "discount", "id", "name", "phone", "promoCode", "status", "total", "trackNumber", "trackUrl", "updatedAt", "userId") SELECT "address", "comment", "createdAt", "discount", "id", "name", "phone", "promoCode", "status", "total", "trackNumber", "trackUrl", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;


-- Backfill snapshot fields for existing orders without touching their totals.
UPDATE "Order" SET "subtotal" = "total" + "discount";
UPDATE "Order" SET "email" = COALESCE((SELECT "email" FROM "User" WHERE "User"."id" = "Order"."userId"), '');
