-- MCRankテーブルに一時的なカラムを追加
ALTER TABLE mc_rank ADD COLUMN temp_mc_id INT;

-- 既存のMCデータをMCテーブルにコピー
INSERT INTO MC (name, createdAt, updatedAt)
SELECT name, created_at, updated_at
FROM mc_rank
ON DUPLICATE KEY UPDATE
  updatedAt = mc_rank.updated_at;

-- MCRankテーブルのtemp_mc_idを更新
UPDATE mc_rank
JOIN MC ON mc_rank.name = MC.name
SET mc_rank.temp_mc_id = MC.id;

-- mcIdカラムを追加し、temp_mc_idの値をコピー
ALTER TABLE mc_rank ADD COLUMN mcId INT UNIQUE;
UPDATE mc_rank SET mcId = temp_mc_id;

-- 外部キー制約を追加
ALTER TABLE mc_rank
ADD CONSTRAINT fk_mc_rank_mc
FOREIGN KEY (mcId) REFERENCES MC(id);

-- 一時的なカラムを削除
ALTER TABLE mc_rank DROP COLUMN temp_mc_id; 