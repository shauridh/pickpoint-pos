/*
  Warnings:

  - You are about to drop the column `unitNumber` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "unitNumber",
ADD COLUMN     "apartmentName" TEXT,
ADD COLUMN     "unit" TEXT;
