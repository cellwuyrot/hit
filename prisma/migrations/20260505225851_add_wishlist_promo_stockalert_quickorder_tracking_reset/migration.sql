-- AlterTable
ALTER TABLE "User" ADD COLUMN "resetExpires" DATETIME;
ALTER TABLE "User" ADD COLUMN "resetToken" TEXT;

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL DEFAULT 'percent',
    "discountValue" REAL NOT NULL DEFAULT 0,
    "minOrder" REAL NOT NULL DEFAULT 0,
    "maxUses" INTEGER NOT NULL DEFAULT 0,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StockAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuickOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL DEFAULT '',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "total" REAL NOT NULL,
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
INSERT INTO "new_Order" ("address", "comment", "createdAt", "id", "name", "phone", "status", "total", "updatedAt", "userId") SELECT "address", "comment", "createdAt", "id", "name", "phone", "status", "total", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WishlistItem_userId_idx" ON "WishlistItem"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistItem_userId_productId_key" ON "WishlistItem"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_code_key" ON "PromoCode"("code");

-- CreateIndex
CREATE INDEX "StockAlert_productId_idx" ON "StockAlert"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "StockAlert_userId_productId_key" ON "StockAlert"("userId", "productId");
