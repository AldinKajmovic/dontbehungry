/*
  Warnings:

  - You are about to drop the column `orderNumber` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `avgDeliveryTime` on the `Restaurant` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `UserAddress` table. All the data in the column will be lost.
  - You are about to drop the `Admin` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Comment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_reviewId_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_userId_fkey";

-- DropIndex
DROP INDEX "Order_orderNumber_idx";

-- DropIndex
DROP INDEX "Order_orderNumber_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "orderNumber";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "transactionId";

-- AlterTable
ALTER TABLE "Place" DROP COLUMN "latitude",
DROP COLUMN "longitude";

-- AlterTable
ALTER TABLE "Restaurant" DROP COLUMN "avgDeliveryTime";

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "isVerified";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserAddress" DROP COLUMN "label";

-- DropTable
DROP TABLE "Admin";

-- DropTable
DROP TABLE "Comment";
