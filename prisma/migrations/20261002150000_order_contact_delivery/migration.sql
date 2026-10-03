ALTER TABLE "Order" ADD COLUMN "contactMethod" TEXT NOT NULL DEFAULT 'phone';
ALTER TABLE "Order" ADD COLUMN "contactDetails" TEXT NOT NULL DEFAULT '';
-- Do not pretend a legacy shipping order selected a carrier.
ALTER TABLE "Order" ADD COLUMN "deliveryMethod" TEXT NOT NULL DEFAULT '';
UPDATE "Order" SET "deliveryMethod" = 'pickup' WHERE "address" LIKE 'Самовывоз:%';
