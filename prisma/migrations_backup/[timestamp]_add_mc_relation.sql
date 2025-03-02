-- AlterTable
ALTER TABLE `MC` ADD COLUMN `ranking` Int UNIQUE;

-- AlterTable
ALTER TABLE `mc_rank` ADD COLUMN `mcId` Int UNIQUE;

-- AddForeignKey
ALTER TABLE `mc_rank` ADD CONSTRAINT `mc_rank_mcId_fkey` FOREIGN KEY (`mcId`) REFERENCES `MC`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- UpdateData
INSERT INTO `MC` (`name`, `createdAt`, `updatedAt`)
SELECT `name`, `created_at`, `updated_at`
FROM `mc_rank`
ON DUPLICATE KEY UPDATE
  `updatedAt` = VALUES(`updatedAt`);

UPDATE `mc_rank` mr
JOIN `MC` m ON mr.`name` = m.`name`
SET mr.`mcId` = m.`id`; 