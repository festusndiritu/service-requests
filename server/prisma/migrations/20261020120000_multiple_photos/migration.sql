-- A request can now carry up to 3 photos. Keep the existing single photo as the first entry.
ALTER TABLE "ServiceRequest" ADD COLUMN "imageKeys" TEXT[] DEFAULT ARRAY[]::TEXT[];
UPDATE "ServiceRequest" SET "imageKeys" = ARRAY["imageKey"] WHERE "imageKey" IS NOT NULL;
ALTER TABLE "ServiceRequest" DROP COLUMN "imageKey";
