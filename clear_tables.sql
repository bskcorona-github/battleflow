-- 外部キー制約を一時的に無効化
SET FOREIGN_KEY_CHECKS = 0;

-- mc_rankテーブルを空にする
TRUNCATE TABLE `mc_rank`;

-- MCテーブルを空にする
TRUNCATE TABLE `MC`;

-- 外部キー制約を再度有効化
SET FOREIGN_KEY_CHECKS = 1; 