/*
  Warnings:

  - You are about to drop the `pageview` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `pageview`;

-- CreateTable
CREATE TABLE `page_views` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `path` VARCHAR(191) NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `page_views_path_key`(`path`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
