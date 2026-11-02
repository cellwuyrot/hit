CREATE TABLE "Campaign" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "heading" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "metaTitle" TEXT NOT NULL DEFAULT '',
  "metaDescription" TEXT NOT NULL DEFAULT '',
  "image" TEXT NOT NULL DEFAULT '',
  "published" BOOLEAN NOT NULL DEFAULT false,
  "allowIndex" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");
CREATE TABLE "CampaignProduct" (
  "campaignId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  PRIMARY KEY ("campaignId", "productId"),
  CONSTRAINT "CampaignProduct_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CampaignProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "CampaignProduct_productId_idx" ON "CampaignProduct"("productId");

CREATE TABLE "CampaignAttribution" (
  "campaignId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "medium" TEXT NOT NULL,
  PRIMARY KEY ("campaignId", "date", "visitorId"),
  CONSTRAINT "CampaignAttribution_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "CampaignAttribution_date_idx" ON "CampaignAttribution"("date");
