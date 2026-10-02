-- Separate internal administrative notes from the customer's comment.
-- Existing orders receive an empty note; no order data is replaced.
ALTER TABLE "Order" ADD COLUMN "adminNote" TEXT NOT NULL DEFAULT '';
