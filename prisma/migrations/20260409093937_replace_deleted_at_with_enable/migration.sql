/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Table` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Table" DROP COLUMN "deletedAt",
ADD COLUMN     "enable" BOOLEAN NOT NULL DEFAULT true;
