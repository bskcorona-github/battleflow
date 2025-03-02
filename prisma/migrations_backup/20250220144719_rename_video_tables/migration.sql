/*
  Warnings:

  - You are about to drop the `adrenalinevideo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `batouvideo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `battlesummitvideo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fslvideo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gaisenvideo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `kokvideo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `kuchigenkavideo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ngvideo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sengokuvideo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `umbvideo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `adrenalinevideo`;

-- DropTable
DROP TABLE `batouvideo`;

-- DropTable
DROP TABLE `battlesummitvideo`;

-- DropTable
DROP TABLE `fslvideo`;

-- DropTable
DROP TABLE `gaisenvideo`;

-- DropTable
DROP TABLE `kokvideo`;

-- DropTable
DROP TABLE `kuchigenkavideo`;

-- DropTable
DROP TABLE `ngvideo`;

-- DropTable
DROP TABLE `sengokuvideo`;

-- DropTable
DROP TABLE `umbvideo`;

-- CreateTable
CREATE TABLE `video_sengoku` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `thumbnail` VARCHAR(191) NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `channelTitle` VARCHAR(191) NOT NULL,
    `viewCount` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `video_umb` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `thumbnail` VARCHAR(191) NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `channelTitle` VARCHAR(191) NOT NULL,
    `viewCount` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `video_kok` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `thumbnail` VARCHAR(191) NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `channelTitle` VARCHAR(191) NOT NULL,
    `viewCount` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `video_ng` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `thumbnail` VARCHAR(191) NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `channelTitle` VARCHAR(191) NOT NULL,
    `viewCount` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `video_gaisen` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `thumbnail` VARCHAR(191) NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `channelTitle` VARCHAR(191) NOT NULL,
    `viewCount` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `video_adrenaline` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `thumbnail` VARCHAR(191) NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `channelTitle` VARCHAR(191) NOT NULL,
    `viewCount` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `video_fsl` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `thumbnail` VARCHAR(191) NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `channelTitle` VARCHAR(191) NOT NULL,
    `viewCount` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `video_batou` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `thumbnail` VARCHAR(191) NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `channelTitle` VARCHAR(191) NOT NULL,
    `viewCount` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `video_kuchigenka` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `thumbnail` VARCHAR(191) NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `channelTitle` VARCHAR(191) NOT NULL,
    `viewCount` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `video_battlesummit` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `thumbnail` VARCHAR(191) NOT NULL,
    `publishedAt` DATETIME(3) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,
    `channelTitle` VARCHAR(191) NOT NULL,
    `viewCount` INTEGER NOT NULL,
    `sourceChannel` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
