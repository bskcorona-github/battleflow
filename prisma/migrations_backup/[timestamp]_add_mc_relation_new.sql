-- CreateMCTable
CREATE TABLE IF NOT EXISTS `MC` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `affiliation` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `hood` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `likesCount` INTEGER NOT NULL DEFAULT 0,
    `commentsCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MC_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CopyData
INSERT IGNORE INTO `MC` (`name`, `createdAt`, `updatedAt`)
SELECT `name`, `created_at`, `updated_at`
FROM `mc_rank`
WHERE `name` NOT IN (SELECT `name` FROM `MC`);

-- AddMcIdToRank
ALTER TABLE `mc_rank` ADD COLUMN IF NOT EXISTS `mcId` INTEGER UNIQUE;

-- UpdateMcIdInRank
UPDATE `mc_rank` mr
JOIN `MC` m ON mr.`name` = m.`name`
SET mr.`mcId` = m.`id`
WHERE mr.`mcId` IS NULL;

-- AddForeignKey
ALTER TABLE `mc_rank` ADD CONSTRAINT `mc_rank_mcId_fkey`
FOREIGN KEY (`mcId`) REFERENCES `MC`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE; 