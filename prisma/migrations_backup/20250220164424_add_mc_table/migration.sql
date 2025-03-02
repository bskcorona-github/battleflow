/*
  Warnings:

  - Added the required column `duration` to the `video_adrenaline` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `video_batou` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `video_battlesummit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `video_fsl` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `video_gaisen` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `video_kok` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `video_kuchigenka` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `video_ng` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `video_sengoku` table without a default value. This is not possible if the table is not empty.
  - Added the required column `duration` to the `video_umb` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `video_adrenaline` ADD COLUMN `duration` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `video_batou` ADD COLUMN `duration` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `video_battlesummit` ADD COLUMN `duration` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `video_fsl` ADD COLUMN `duration` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `video_gaisen` ADD COLUMN `duration` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `video_kok` ADD COLUMN `duration` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `video_kuchigenka` ADD COLUMN `duration` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `video_ng` ADD COLUMN `duration` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `video_sengoku` ADD COLUMN `duration` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `video_umb` ADD COLUMN `duration` VARCHAR(191) NOT NULL;
