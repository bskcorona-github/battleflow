/*
  Warnings:

  - You are about to drop the column `losses` on the `mc` table. All the data in the column will be lost.
  - You are about to drop the column `winRate` on the `mc` table. All the data in the column will be lost.
  - You are about to drop the column `wins` on the `mc` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `mc` DROP COLUMN `losses`,
    DROP COLUMN `winRate`,
    DROP COLUMN `wins`,
    MODIFY `description` VARCHAR(191) NULL;
