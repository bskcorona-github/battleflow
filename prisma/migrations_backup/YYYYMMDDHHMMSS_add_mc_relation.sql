-- CreateTable
ALTER TABLE `mc_rank` ADD COLUMN `temp_mc_id` INT;

-- AddMCData
INSERT INTO `MC` (`name`, `createdAt`, `updatedAt`)
SELECT `name`, `created_at`, `updated_at`
FROM `mc_rank`
ON DUPLICATE KEY UPDATE
  `updatedAt` = `mc_rank`.`updated_at`;

-- UpdateTempMcId
UPDATE `mc_rank`
JOIN `MC` ON `mc_rank`.`name` = `MC`.`name`
SET `mc_rank`.`temp_mc_id` = `MC`.`id`;

-- AddMcIdColumn
ALTER TABLE `mc_rank` ADD COLUMN `mcId` INT UNIQUE;
UPDATE `mc_rank` SET `mcId` = `temp_mc_id`;

-- AddForeignKey
ALTER TABLE `mc_rank` ADD CONSTRAINT `fk_mc_rank_mc` FOREIGN KEY (`mcId`) REFERENCES `MC`(`id`);

-- DropTempColumn
ALTER TABLE `mc_rank` DROP COLUMN `temp_mc_id`; 