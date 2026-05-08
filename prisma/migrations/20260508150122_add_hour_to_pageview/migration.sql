-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PageView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "hour" INTEGER NOT NULL DEFAULT 0,
    "visitorId" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_PageView" ("createdAt", "date", "id", "path", "visitorId") SELECT "createdAt", "date", "id", "path", "visitorId" FROM "PageView";
DROP TABLE "PageView";
ALTER TABLE "new_PageView" RENAME TO "PageView";
CREATE INDEX "PageView_date_idx" ON "PageView"("date");
CREATE INDEX "PageView_path_idx" ON "PageView"("path");
CREATE INDEX "PageView_visitorId_idx" ON "PageView"("visitorId");
CREATE INDEX "PageView_date_visitorId_path_idx" ON "PageView"("date", "visitorId", "path");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
