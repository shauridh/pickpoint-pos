-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "deliveryPriceConfig" DROP DEFAULT,
ALTER COLUMN "priceConfig" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
