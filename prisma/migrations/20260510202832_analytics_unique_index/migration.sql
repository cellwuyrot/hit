-- Remove duplicate PageView records before adding unique constraint
DELETE FROM "PageView"
WHERE "id" NOT IN (
  SELECT MIN("id") FROM "PageView"
  GROUP BY "date", "visitorId", "path"
);

-- DropIndex
DROP INDEX IF EXISTS "PageView_date_visitorId_path_idx";

-- CreateIndex
CREATE UNIQUE INDEX "PageView_date_visitorId_path_key" ON "PageView"("date", "visitorId", "path");
