/*
  Warnings:

  - Added the required column `priceConfig` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PricingScheme" AS ENUM ('FLAT', 'FLAT_SIZE', 'PROGRESSIVE_DAY', 'PROGRESSIVE_PACKAGE');

-- CreateEnum
CREATE TYPE "PackageSize" AS ENUM ('S', 'M', 'L', 'XL');

-- CreateEnum
CREATE TYPE "PenaltyMode" AS ENUM ('FIRST_PACKAGE', 'ADDITIONAL_PACKAGE');

-- AlterTable: Add new columns with defaults for existing data
ALTER TABLE "Location" ADD COLUMN     "deliveryEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deliveryPriceConfig" JSONB DEFAULT '{"S": 5000, "M": 7000, "L": 10000, "XL": 15000}',
ADD COLUMN     "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "priceConfig" JSONB DEFAULT '{"basePrice": 5000, "penaltyPer24h": 3000}',
ADD COLUMN     "pricingScheme" "PricingScheme" NOT NULL DEFAULT 'FLAT';

-- Update existing locations with their current price as basePrice
UPDATE "Location" SET "priceConfig" = jsonb_build_object('basePrice', price::int, 'penaltyPer24h', 3000);

-- Now make priceConfig NOT NULL
ALTER TABLE "Location" ALTER COLUMN "priceConfig" SET NOT NULL;

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "deliveryFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "needsDelivery" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "size" "PackageSize";
