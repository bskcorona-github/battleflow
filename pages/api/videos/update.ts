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

// テーブル名から最新の動画の公開日を取得する関数
async function getLatestVideoDate(tableName: string): Promise<Date | null> {
  try {
    let latestDate: Date | null = null;

    switch (tableName) {
      case "video_sengoku":
        const sengokuVideo = await prisma.video_sengoku.findFirst({
          orderBy: { publishedAt: "desc" },
          select: { publishedAt: true },
        });
        latestDate = sengokuVideo?.publishedAt || null;
        break;
      case "video_umb":
        const umbVideo = await prisma.video_umb.findFirst({
          orderBy: { publishedAt: "desc" },
          select: { publishedAt: true },
        });
        latestDate = umbVideo?.publishedAt || null;
        break;
      case "video_kok":
        const kokVideo = await prisma.video_kok.findFirst({
          orderBy: { publishedAt: "desc" },
          select: { publishedAt: true },
        });
        latestDate = kokVideo?.publishedAt || null;
        break;
      case "video_ng":
        const ngVideo = await prisma.video_ng.findFirst({
          orderBy: { publishedAt: "desc" },
          select: { publishedAt: true },
        });
        latestDate = ngVideo?.publishedAt || null;
        break;
      case "video_gaisen":
        const gaisenVideo = await prisma.video_gaisen.findFirst({
          orderBy: { publishedAt: "desc" },
          select: { publishedAt: true },
        });
        latestDate = gaisenVideo?.publishedAt || null;
        break;
      case "video_adrenaline":
        const adrenalineVideo = await prisma.video_adrenaline.findFirst({
          orderBy: { publishedAt: "desc" },
          select: { publishedAt: true },
        });
        latestDate = adrenalineVideo?.publishedAt || null;
        break;
      case "video_fsl":
        const fslVideo = await prisma.video_fsl.findFirst({
          orderBy: { publishedAt: "desc" },
          select: { publishedAt: true },
        });
        latestDate = fslVideo?.publishedAt || null;
        break;
      case "video_batou":
        const batouVideo = await prisma.video_batou.findFirst({
          orderBy: { publishedAt: "desc" },
          select: { publishedAt: true },
        });
        latestDate = batouVideo?.publishedAt || null;
        break;
      case "video_kuchigenka":
        const kuchigenkaVideo = await prisma.video_kuchigenka.findFirst({
          orderBy: { publishedAt: "desc" },
          select: { publishedAt: true },
        });
        latestDate = kuchigenkaVideo?.publishedAt || null;
        break;
      default:
        console.log(`Unknown table: ${tableName}, returning null date`);
    }

    // 最新の日付が存在しない場合は、少し余裕を持たせるために7日前の日付を返す
    if (!latestDate) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return sevenDaysAgo;
    }

    return latestDate;
  } catch (error) {
    console.error(`Error getting latest video date for ${tableName}:`, error);
    // エラーが発生した場合は、少し余裕を持たせるために7日前の日付を返す
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return sevenDaysAgo;
  }
}

// BATTLE SUMMITの最新動画日付を取得
async function getLatestBattleSummitDate(): Promise<Date | null> {
  try {
    const video = await prisma.video_battlesummit.findFirst({
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true },
    });

    if (!video?.publishedAt) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return sevenDaysAgo;
    }

    return video.publishedAt;
  } catch (error) {
    console.error("Error getting latest BATTLE SUMMIT video date:", error);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return sevenDaysAgo;
  }
}

async function updateChannelVideos(
  channelId: string,
  tableName: string,
  videos: VideoData[],
  latestDate: Date | null
) {
  if (!videos || videos.length === 0) {
    console.log(`No videos to update for ${tableName}`);
    return { added: 0, updated: 0 };
  }

  // 日付でフィルタリング
  let filteredVideos = videos;
  if (latestDate) {
    filteredVideos = videos.filter(
      (video) => new Date(video.publishedAt) > latestDate
    );
    console.log(
      `Filtered ${
        videos.length - filteredVideos.length
      } existing videos for ${tableName}`
    );
  }

  if (filteredVideos.length === 0) {
    console.log(`No new videos to update for ${tableName}`);
    return { added: 0, updated: 0 };
  }

  const processedVideos = filteredVideos.map((video) => ({
    id: video.id,
    title: video.title,
    thumbnail: video.thumbnail,
    publishedAt: new Date(video.publishedAt),
    channelId: video.channelId,
    channelTitle: video.channelTitle,
    viewCount: parseInt(video.viewCount, 10),
    duration: video.duration,
  }));

  let added = 0;
  let updated = 0;

  // トランザクション開始
  try {
    await prisma.$transaction(
      async (tx) => {
        for (const video of processedVideos) {
          try {
            // 既存のビデオが存在するかチェック
            const exists = await checkVideoExists(tx, tableName, video.id);

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
                if (exists) {
                  updated++;
                } else {
                  added++;
                }
                console.log(
                  `${exists ? "Updated" : "Created"} video ${
                    video.id
                  } in ${tableName}`
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
                if (exists) {
                  updated++;
                } else {
                  added++;
                }
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
                if (exists) {
                  updated++;
                } else {
                  added++;
                }
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
                if (exists) {
                  updated++;
                } else {
                  added++;
                }
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
                if (exists) {
                  updated++;
                } else {
                  added++;
                }
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
                if (exists) {
                  updated++;
                } else {
                  added++;
                }
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
                if (exists) {
                  updated++;
                } else {
                  added++;
                }
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
                if (exists) {
                  updated++;
                } else {
                  added++;
                }
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
                if (exists) {
                  updated++;
                } else {
                  added++;
                }
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

    return { added, updated };
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

// 動画が既に存在するかチェックする関数
async function checkVideoExists(
  tx: Prisma.TransactionClient,
  tableName: string,
  videoId: string
): Promise<boolean> {
  try {
    let exists = false;

    switch (tableName) {
      case "video_sengoku":
        const sengoku = await tx.video_sengoku.findUnique({
          where: { id: videoId },
          select: { id: true },
        });
        exists = !!sengoku;
        break;
      case "video_umb":
        const umb = await tx.video_umb.findUnique({
          where: { id: videoId },
          select: { id: true },
        });
        exists = !!umb;
        break;
      case "video_kok":
        const kok = await tx.video_kok.findUnique({
          where: { id: videoId },
          select: { id: true },
        });
        exists = !!kok;
        break;
      case "video_ng":
        const ng = await tx.video_ng.findUnique({
          where: { id: videoId },
          select: { id: true },
        });
        exists = !!ng;
        break;
      case "video_gaisen":
        const gaisen = await tx.video_gaisen.findUnique({
          where: { id: videoId },
          select: { id: true },
        });
        exists = !!gaisen;
        break;
      case "video_adrenaline":
        const adrenaline = await tx.video_adrenaline.findUnique({
          where: { id: videoId },
          select: { id: true },
        });
        exists = !!adrenaline;
        break;
      case "video_fsl":
        const fsl = await tx.video_fsl.findUnique({
          where: { id: videoId },
          select: { id: true },
        });
        exists = !!fsl;
        break;
      case "video_batou":
        const batou = await tx.video_batou.findUnique({
          where: { id: videoId },
          select: { id: true },
        });
        exists = !!batou;
        break;
      case "video_kuchigenka":
        const kuchigenka = await tx.video_kuchigenka.findUnique({
          where: { id: videoId },
          select: { id: true },
        });
        exists = !!kuchigenka;
        break;
      default:
        console.log(`Unknown table: ${tableName}`);
    }

    return exists;
  } catch (error) {
    console.error(`Error checking video existence for ${videoId}:`, error);
    return false;
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
    success: [] as { channelId: string; added: number; updated: number }[],
    failed: [] as { channelId: string; error: string }[],
  };

  try {
    // 通常のチャンネルの処理
    for (const [channelId, tableName] of Object.entries(CHANNEL_TABLES)) {
      try {
        console.log(`Starting update for channel ${channelId}`);

        // 最新の動画日付を取得
        const latestDate = await getLatestVideoDate(tableName);
        console.log(
          `Latest video for ${tableName} is from ${
            latestDate ? latestDate.toISOString() : "none found"
          }`
        );

        const videos = await fetchChannelVideos(channelId);
        const battleVideos = videos.filter((video) =>
          video.title.toLowerCase().includes("vs")
        );

        if (battleVideos.length > 0) {
          const result = await updateChannelVideos(
            channelId,
            tableName,
            battleVideos,
            latestDate
          );
          updateResults.success.push({
            channelId,
            added: result.added,
            updated: result.updated,
          });
          console.log(
            `Successfully updated ${channelId} - Added: ${result.added}, Updated: ${result.updated}`
          );
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
    // 最新の動画日付を取得
    const latestBSDate = await getLatestBattleSummitDate();
    console.log(
      `Latest BATTLE SUMMIT video is from ${
        latestBSDate ? latestBSDate.toISOString() : "none found"
      }`
    );

    for (const channelId of BATTLE_SUMMIT_CHANNELS) {
      try {
        console.log(`Starting BATTLE SUMMIT update for channel ${channelId}`);
        const videos = await fetchChannelVideos(channelId);
        const battleVideos = videos.filter((video) =>
          isBattleSummitBattle(video.title)
        );

        // 日付でフィルタリング
        let filteredVideos = battleVideos;
        if (latestBSDate) {
          filteredVideos = battleVideos.filter(
            (video) => new Date(video.publishedAt) > latestBSDate
          );
          console.log(
            `Filtered ${
              battleVideos.length - filteredVideos.length
            } existing BATTLE SUMMIT videos for ${channelId}`
          );
        }

        if (filteredVideos.length > 0) {
          let added = 0;
          await prisma.$transaction(async (tx) => {
            for (const video of filteredVideos) {
              // BATTLESUMMITの動画が既に存在するかを確認
              const existingVideo = await tx.video_battlesummit.findUnique({
                where: { id: video.id },
                select: { id: true },
              });

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

              if (!existingVideo) added++;
            }
          });
          updateResults.success.push({
            channelId: `BATTLE_SUMMIT_${channelId}`,
            added,
            updated: 0,
          });
          console.log(
            `Successfully updated BATTLE SUMMIT channel ${channelId} - Added: ${added}`
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
    const totalAdded = updateResults.success.reduce(
      (sum, item) => sum + item.added,
      0
    );
    const totalUpdated = updateResults.success.reduce(
      (sum, item) => sum + item.updated,
      0
    );

    if (updateResults.failed.length === 0) {
      res.status(200).json({
        message: `Videos updated successfully: ${totalAdded} added, ${totalUpdated} updated`,
        results: updateResults,
      });
    } else {
      res.status(207).json({
        message: `Some updates failed. Overall: ${totalAdded} added, ${totalUpdated} updated`,
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
