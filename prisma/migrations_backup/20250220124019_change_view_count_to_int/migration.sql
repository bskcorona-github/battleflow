/*
  Warnings:

  - You are about to alter the column `viewCount` on the `video` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `video` MODIFY `viewCount` INTEGER NOT NULL;
