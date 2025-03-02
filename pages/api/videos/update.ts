import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { fetchChannelVideos } from "@/lib/youtube";
import { Prisma } from "@prisma/client";

const ADMIN_EMAILS = ["pochiness@gmail.com", "kanemasa.tatsuro@gmail.com"];

// チャンネルとテーブルの対応を定義
const CHANNEL_TABLES = {
  UC15ebOqdhmvl1eb0s0jk5aw: "video_sengoku",
  UCLn8FintdYEDCSK6HaX5Q4g: "video_umb",
  UCQbxh2ft3vw9M6Da_kuIa6A: "video_kok",
  UCyGlD1rZjYGs8IjEfA4Kf3A: "video_ng",
  UCe_EvY8GrvYgx8PbwRBc75g: "video_gaisen",
  UCj6aXG5H_fm_RAvxH38REXw: "video_adrenaline",
  UCXIaUFBW7TrZh_utWNILFDQ: "video_fsl",
  UCbuC7CWNCGwMT_lqRWvKbDQ: "video_batou",
  UCTGmN6Qt8TGs37BtLSCkinQ: "video_kuchigenka",
} as const;

// BATTLE SUMMIT関連の全チャンネル
const BATTLE_SUMMIT_CHANNELS = [
  "UC15ebOqdhmvl1eb0s0jk5aw",
  "UCLn8FintdYEDCSK6HaX5Q4g",
  "UCQbxh2ft3vw9M6Da_kuIa6A",
  "UCyGlD1rZjYGs8IjEfA4Kf3A",
  "UCe_EvY8GrvYgx8PbwRBc75g",
  "UCj6aXG5H_fm_RAvxH38REXw",
  "UCXIaUFBW7TrZh_utWNILFDQ",
  "UCbuC7CWNCGwMT_lqRWvKbDQ",
  "UCTGmN6Qt8TGs37BtLSCkinQ",
  "UCtHEdcBCOEiYxZYSNQ8-Z4g",
  "UCIgphXLgxlCYYpx2Py2bTjA",
  "UC2UCB_L3Kh6Kv5pL3pJZFlA",
];

// 動画の型定義
interface VideoData {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  viewCount: string;
  duration: string;
}

// BATTLE SUMMIT動画のフィルタリング関数
function isBattleSummitBattle(title: string): boolean {
  const lowerTitle = title.toLowerCase();
  return (
    lowerTitle.includes("battle summit") &&
    lowerTitle.includes("vs") &&
    !lowerTitle.includes("直前記念") &&
    !lowerTitle.includes("記者会見")
  );
}

// エラーログ用の型定義
interface ErrorLog {
  timestamp: Date;
  operation: string;
  channelId: string;
  videoId?: string;
  error: string;
  details?: unknown;
}

// エラーログを保存する関数
async function logError(errorLog: ErrorLog) {
  try {
    console.error(JSON.stringify(errorLog, null, 2));
    // TODO: 必要に応じてログをDBやファイルに保存する処理を追加
  } catch (e) {
    console.error("Failed to log error:", e);
  }
}

async function updateChannelVideos(
  channelId: string,
  tableName: string,
  videos: VideoData[]
) {
  if (!videos || videos.length === 0) {
    console.log(`No videos to update for ${tableName}`);
    return;
  }

  const processedVideos = videos.map((video) => ({
    id: video.id,
    title: video.title,
    thumbnail: video.thumbnail,
    publishedAt: new Date(video.publishedAt),
    channelId: video.channelId,
    channelTitle: video.channelTitle,
    viewCount: parseInt(video.viewCount, 10),
    duration: video.duration,
  }));

  // トランザクション開始
  try {
    await prisma.$transaction(
      async (tx) => {
        for (const video of processedVideos) {
          try {
            switch (tableName) {
              case "video_sengoku":
                await tx.video_sengoku.upsert({
                  where: { id: video.id },
                  update: {
                    viewCount: video.viewCount,
                    thumbnail: video.thumbnail,
                  },
                  create: video,
                });
                console.log(
                  `Updated/Created video ${video.id} in ${tableName}`
                );
                break;
              case "video_umb":
                await tx.video_umb.upsert({
                  where: { id: video.id },
                  update: {
                    viewCount: video.viewCount,
                    thumbnail: video.thumbnail,
                  },
                  create: video,
                });
                break;
              case "video_kok":
                await tx.video_kok.upsert({
                  where: { id: video.id },
                  update: {
                    viewCount: video.viewCount,
                    thumbnail: video.thumbnail,
                  },
                  create: video,
                });
                break;
              case "video_ng":
                await tx.video_ng.upsert({
                  where: { id: video.id },
                  update: {
                    viewCount: video.viewCount,
                    thumbnail: video.thumbnail,
                  },
                  create: video,
                });
                break;
              case "video_gaisen":
                await tx.video_gaisen.upsert({
                  where: { id: video.id },
                  update: {
                    viewCount: video.viewCount,
                    thumbnail: video.thumbnail,
                  },
                  create: video,
                });
                break;
              case "video_adrenaline":
                await tx.video_adrenaline.upsert({
                  where: { id: video.id },
                  update: {
                    viewCount: video.viewCount,
                    thumbnail: video.thumbnail,
                  },
                  create: video,
                });
                break;
              case "video_fsl":
                await tx.video_fsl.upsert({
                  where: { id: video.id },
                  update: {
                    viewCount: video.viewCount,
                    thumbnail: video.thumbnail,
                  },
                  create: video,
                });
                break;
              case "video_batou":
                await tx.video_batou.upsert({
                  where: { id: video.id },
                  update: {
                    viewCount: video.viewCount,
                    thumbnail: video.thumbnail,
                  },
                  create: video,
                });
                break;
              case "video_kuchigenka":
                await tx.video_kuchigenka.upsert({
                  where: { id: video.id },
                  update: {
                    viewCount: video.viewCount,
                    thumbnail: video.thumbnail,
                  },
                  create: video,
                });
                break;
              default:
                throw new Error(`Unknown table: ${tableName}`);
            }
          } catch (error) {
            await logError({
              timestamp: new Date(),
              operation: "upsert",
              channelId,
              videoId: video.id,
              error: error instanceof Error ? error.message : "Unknown error",
              details: error,
            });
            throw error; // トランザクションをロールバック
          }
        }
      },
      {
        maxWait: 10000, // 最大待機時間
        timeout: 30000, // トランザクションタイムアウト
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // 分離レベル
      }
    );
  } catch (error) {
    await logError({
      timestamp: new Date(),
      operation: "transaction",
      channelId,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error,
    });
    throw error;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userEmail = req.headers["x-user-email"];
  if (!userEmail || !ADMIN_EMAILS.includes(userEmail as string)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const updateResults = {
    success: [] as string[],
    failed: [] as { channelId: string; error: string }[],
  };

  try {
    // 通常のチャンネルの処理
    for (const [channelId, tableName] of Object.entries(CHANNEL_TABLES)) {
      try {
        console.log(`Starting update for channel ${channelId}`);
        const videos = await fetchChannelVideos(channelId);
        const battleVideos = videos.filter((video) =>
          video.title.toLowerCase().includes("vs")
        );

        if (battleVideos.length > 0) {
          await updateChannelVideos(channelId, tableName, battleVideos);
          updateResults.success.push(channelId);
          console.log(`Successfully updated ${channelId}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        updateResults.failed.push({ channelId, error: errorMessage });
        console.error(`Failed to update ${channelId}:`, error);
        // エラーが発生しても続行
        continue;
      }
    }

    // BATTLE SUMMITの処理
    for (const channelId of BATTLE_SUMMIT_CHANNELS) {
      try {
        console.log(`Starting BATTLE SUMMIT update for channel ${channelId}`);
        const videos = await fetchChannelVideos(channelId);
        const battleVideos = videos.filter((video) =>
          isBattleSummitBattle(video.title)
        );

        if (battleVideos.length > 0) {
          await prisma.$transaction(async (tx) => {
            for (const video of battleVideos) {
              await tx.video_battlesummit.upsert({
                where: { id: video.id },
                update: {
                  viewCount: parseInt(video.viewCount, 10),
                  thumbnail: video.thumbnail,
                },
                create: {
                  id: video.id,
                  title: video.title,
                  thumbnail: video.thumbnail,
                  publishedAt: new Date(video.publishedAt),
                  channelId: video.channelId,
                  channelTitle: video.channelTitle,
                  viewCount: parseInt(video.viewCount, 10),
                  duration: video.duration,
                  sourceChannel: channelId,
                },
              });
            }
          });
          updateResults.success.push(`BATTLE_SUMMIT_${channelId}`);
          console.log(
            `Successfully updated BATTLE SUMMIT channel ${channelId}`
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        updateResults.failed.push({
          channelId: `BATTLE_SUMMIT_${channelId}`,
          error: errorMessage,
        });
        console.error(`Failed to update BATTLE SUMMIT ${channelId}:`, error);
        // エラーが発生しても続行
        continue;
      }
    }

    // 結果を返す
    if (updateResults.failed.length === 0) {
      res.status(200).json({
        message: "All videos updated successfully",
        results: updateResults,
      });
    } else {
      res.status(207).json({
        message: "Some updates failed",
        results: updateResults,
      });
    }
  } catch (error) {
    console.error("Critical error updating videos:", error);
    res.status(500).json({
      error: "Failed to update videos",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
