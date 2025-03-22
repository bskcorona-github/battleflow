import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import type { Video } from "../../../types/video";

// テーブル名の型定義
type TableName =
  | "video_sengoku"
  | "video_umb"
  | "video_kok"
  | "video_ng"
  | "video_gaisen"
  | "video_adrenaline"
  | "video_fsl"
  | "video_batou"
  | "video_kuchigenka";

// Prismaのテーブルモデルの型
type PrismaModel = {
  count: () => Promise<number>;
  findMany: (options: QueryOptions) => Promise<Video[]>;
};

// 動画の型定義
interface Video {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: Date;
  channelId: string;
  channelTitle: string;
  viewCount: number;
  duration: string;
}

// チャンネルとテーブルの対応を定義
const CHANNEL_TABLES: Record<string, TableName> = {
  UC15ebOqdhmvl1eb0s0jk5aw: "video_sengoku",
  UCLn8FintdYEDCSK6HaX5Q4g: "video_umb",
  UCQbxh2ft3vw9M6Da_kuIa6A: "video_kok",
  UCyGlD1rZjYGs8IjEfA4Kf3A: "video_ng",
  UCe_EvY8GrvYgx8PbwRBc75g: "video_gaisen",
  UCj6aXG5H_fm_RAvxH38REXw: "video_adrenaline",
  UCXIaUFBW7TrZh_utWNILFDQ: "video_fsl",
  UCbuC7CWNCGwMT_lqRWvKbDQ: "video_batou",
  UCTGmN6Qt8TGs37BtLSCkinQ: "video_kuchigenka",
};

// Prismaのクエリオプションの型
type QueryOptions = {
  orderBy: {
    viewCount?: "desc" | "asc";
    publishedAt?: "desc" | "asc";
  };
  skip: number;
  take: number;
};

// 動的テーブルアクセスのための型安全なヘルパー関数
function getTableModel(
  prisma: PrismaClient,
  tableName: TableName
): PrismaModel {
  return prisma[tableName] as unknown as PrismaModel;
}

// テーブル名の配列
const ALL_TABLE_NAMES: TableName[] = [
  "video_sengoku",
  "video_umb",
  "video_kok",
  "video_ng",
  "video_gaisen",
  "video_adrenaline",
  "video_fsl",
  "video_batou",
  "video_kuchigenka",
];

// BATTLE SUMMIT専用のチャンネル
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

// キャッシュ機能の無効化（常に最新データを取得するため）
const CACHE_DURATION = 0; // キャッシュを無効化

interface CacheItem {
  data: any;
  timestamp: number;
}

// メモリキャッシュの実装
const videoCache: Record<string, CacheItem> = {};

// キャッシュキーの生成 - タブ情報も含める
const getCacheKey = (
  queryOptions: any,
  tabName: string,
  channelId: string,
  timestamp?: string
): string => {
  // タイムスタンプがある場合はキャッシュを無効化
  if (timestamp) {
    return `${tabName}-${channelId}-${JSON.stringify(
      queryOptions
    )}-${timestamp}`;
  }
  return `${tabName}-${channelId}-${JSON.stringify(queryOptions)}`;
};

// キャッシュの有効性チェック
const isCacheValid = (cacheKey: string): boolean => {
  if (!videoCache[cacheKey]) return false;
  const now = Date.now();
  return now - videoCache[cacheKey].timestamp < CACHE_DURATION;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const {
    channelId = "",
    query = "vs",
    keyword = "戦極",
    sortOrder = "views",
    page = "1",
    limit = "12",
    timestamp,
  } = req.query;

  const currentPage = parseInt(typeof page === "string" ? page : "1", 10);
  const itemsPerPage = parseInt(typeof limit === "string" ? limit : "12", 10);

  // ソート順の設定
  const sort =
    sortOrder === "date_asc"
      ? "date_asc"
      : sortOrder === "date_desc"
      ? "date_desc"
      : "views";

  try {
    // デバッグ用：すべてのテーブルの件数をカウント
    const counts = await Promise.all(
      ALL_TABLE_NAMES.map(async (table) => {
        const count = await prisma[table].count();
        return { table, count };
      })
    );
    console.log("データベーステーブル件数:", counts);

    // BATTLE SUMMITの場合は特別な処理
    if (keyword === "BATTLE SUMMIT") {
      // まず全件を取得
      const allVideos = await prisma.video_battlesummit.findMany({
        where: {
          channelId: {
            in: BATTLE_SUMMIT_CHANNELS, // チャンネルIDでフィルタリング
          },
        },
        orderBy: {
          ...(sort === "views"
            ? { viewCount: "desc" }
            : sort === "date_desc"
            ? { publishedAt: "desc" }
            : { publishedAt: "asc" }),
        },
      });

      // タイトルに"BATTLE SUMMIT"と"vs"が含まれ、かつ「直前記念」と「記者会見」を含まない動画をフィルタリング
      const filteredVideos = allVideos.filter((video) => {
        const title = video.title.toLowerCase();
        return (
          title.includes("battle summit") &&
          title.includes("vs") &&
          !title.includes("直前記念") &&
          !title.includes("記者会見")
        );
      });

      console.log(
        `BATTLE SUMMIT: 全${allVideos.length}件中${filteredVideos.length}件を抽出`
      );

      const totalCount = filteredVideos.length;
      // クライアント側でページネーションを行うため、全データを返す
      return res.status(200).json({
        videos: filteredVideos,
        pagination: {
          total: totalCount,
          currentPage,
          totalPages: Math.ceil(totalCount / itemsPerPage),
          hasNextPage: currentPage * itemsPerPage < totalCount,
          hasPreviousPage: currentPage > 1,
        },
      });
    }

    // 通常の処理（channelIdが必要な場合）
    if (
      !channelId ||
      typeof channelId !== "string" ||
      (channelId !== "" && !(channelId in CHANNEL_TABLES))
    ) {
      return res.status(400).json({
        error: "Invalid or missing channel ID",
        channelId: channelId,
        isValidKey: channelId in CHANNEL_TABLES,
      });
    }

    const tableName = CHANNEL_TABLES[channelId as string];

    // KOKとNGの場合は特別処理 (テーブル名を直接確認)
    console.log(
      `リクエストされたテーブル: ${tableName} (チャンネルID: ${channelId})`
    );

    // KOKとNGのテーブルに直接アクセスして件数を確認
    if (tableName === "video_kok") {
      console.log(`KOKテーブル直接カウント: ${await prisma.video_kok.count()}`);
    } else if (tableName === "video_ng") {
      console.log(`NGテーブル直接カウント: ${await prisma.video_ng.count()}`);
    }

    // クエリのpaginationを削除して全件取得するよう変更
    const orderByOptions =
      sort === "views"
        ? { viewCount: "desc" as const }
        : sort === "date_desc"
        ? { publishedAt: "desc" as const }
        : { publishedAt: "asc" as const };

    // 動的にテーブルを選択してデータを取得（型安全に）
    const model = getTableModel(prisma, tableName);
    const totalCount = await model.count();
    console.log(`テーブル ${tableName} の総件数: ${totalCount}件`);

    if (req.method === "GET") {
      // タブ名を取得（リクエストから）
      const tabName = typeof query === "string" ? query : "";

      // タブ名を含めたキャッシュキーを生成
      const cacheKey = getCacheKey(
        { orderBy: orderByOptions },
        tabName,
        channelId as string,
        timestamp as string | undefined
      );

      // デバッグログ
      console.log(`Request for tab: ${tabName}, channel: ${channelId}`);

      // キャッシュが有効であれば利用（ただし現在は無効化中）
      if (isCacheValid(cacheKey)) {
        console.log(`Using cached videos data for tab: ${tabName}`);

        // キャッシュからデータを取得
        const cachedVideos = videoCache[cacheKey].data;

        // キャッシュデータにもフィルタリングを適用
        let filteredCachedVideos = cachedVideos;
        if (keyword) {
          filteredCachedVideos = cachedVideos.filter((video: Video) => {
            const title = video.title.toLowerCase();
            const keywords = (typeof keyword === "string" ? keyword : "")
              .toLowerCase()
              .split(/[,\s]+/)
              .filter((k) => k.length > 0);

            if (keywords.length === 0) {
              return true;
            }

            const matchesKeyword = keywords.some((k) => title.includes(k));

            // 特別なタブ（BATTLE SUMMIT）の場合は追加のフィルタリング
            if (tabName === "BATTLE SUMMIT") {
              return (
                title.includes("battle summit") &&
                title.includes("vs") &&
                !title.includes("直前記念") &&
                !title.includes("記者会見")
              );
            }

            return matchesKeyword;
          });
        }

        // フィルタリング後の総数
        const filteredTotalCount = filteredCachedVideos.length;

        return res.status(200).json({
          videos: filteredCachedVideos,
          pagination: {
            total: filteredTotalCount,
            currentPage,
            totalPages: Math.ceil(filteredTotalCount / itemsPerPage),
            hasNextPage: currentPage * itemsPerPage < filteredTotalCount,
            hasPreviousPage: currentPage > 1,
          },
        });
      }

      console.log(`Fetching fresh videos for tab: ${tabName}`);

      // KOKとNGのテーブルは特別処理
      let videos: Video[] = [];
      if (tableName === "video_kok") {
        // KOKテーブルを直接クエリ
        console.log("KOKテーブルを直接クエリします");
        videos = await prisma.video_kok.findMany({
          orderBy: orderByOptions,
        });
      } else if (tableName === "video_ng") {
        // NGテーブルを直接クエリ
        console.log("NGテーブルを直接クエリします");
        videos = await prisma.video_ng.findMany({
          orderBy: orderByOptions,
        });
      } else {
        // 通常のテーブルクエリ
        videos = await model.findMany({
          orderBy: orderByOptions,
        });
      }

      console.log(`取得したビデオ数: ${videos.length}件`);

      // NGとKOKチャンネルの場合、データをより適切にフィルタリング
      let filteredVideos = videos;
      if (channelId === "UCyGlD1rZjYGs8IjEfA4Kf3A") {
        // NGチャンネルの場合、フィルタリング条件を緩和
        filteredVideos = videos.filter((video: Video) => {
          const title = video.title.toLowerCase();
          return (
            title.includes("vs") ||
            title.includes("バトル") ||
            title.includes("battle") ||
            title.includes("試合") ||
            title.includes("決勝") ||
            title.includes("準決勝") ||
            title.includes("予選") ||
            title.includes("ng計画") ||
            title.includes("rap") ||
            title.includes("ラップ") ||
            title.includes("mc")
          );
        });
        console.log(
          `NGチャンネル: 全${videos.length}件中${filteredVideos.length}件を抽出`
        );
      } else if (channelId === "UCQbxh2ft3vw9M6Da_kuIa6A") {
        // KOKチャンネルの場合、バトル関連の動画をフィルタリング
        filteredVideos = videos.filter((video: Video) => {
          const title = video.title.toLowerCase();
          return (
            title.includes("vs") ||
            title.includes("バトル") ||
            title.includes("battle") ||
            title.includes("king of kings") ||
            title.includes("kok") ||
            title.includes("決勝") ||
            title.includes("準決勝") ||
            title.includes("予選") ||
            title.includes("試合") ||
            title.includes("rap") ||
            title.includes("ラップ") ||
            title.includes("mc")
          );
        });
        console.log(
          `KOKチャンネル: 全${videos.length}件中${filteredVideos.length}件を抽出`
        );
      } else if (keyword) {
        // 通常のキーワードフィルタリング
        console.log(
          `Filtering videos for tab: ${tabName}, keyword: ${keyword}`
        );

        filteredVideos = videos.filter((video: Video) => {
          const title = video.title.toLowerCase();
          const keywords = (typeof keyword === "string" ? keyword : "")
            .toLowerCase()
            .split(/[,\s]+/)
            .filter((k) => k.length > 0);

          if (keywords.length === 0) {
            return true;
          }

          const matchesKeyword = keywords.some((k) => title.includes(k));

          // 特別なタブ（BATTLE SUMMIT）の場合は追加のフィルタリング
          if (tabName === "BATTLE SUMMIT") {
            return (
              title.includes("battle summit") &&
              title.includes("vs") &&
              !title.includes("直前記念") &&
              !title.includes("記者会見")
            );
          }

          return matchesKeyword;
        });

        console.log(
          `Filtered ${videos.length} videos to ${filteredVideos.length} for tab: ${tabName}`
        );
      }

      // 結果をキャッシュに保存（フィルタリング前のすべてのデータ）
      videoCache[cacheKey] = {
        data: videos,
        timestamp: Date.now(),
      };

      console.log(`Saved ${videos.length} videos to cache for tab: ${tabName}`);

      // フィルタリング後の総数を更新
      const filteredTotalCount = filteredVideos.length;

      return res.status(200).json({
        videos: filteredVideos,
        pagination: {
          total: filteredTotalCount,
          currentPage,
          totalPages: Math.ceil(filteredTotalCount / itemsPerPage),
          hasNextPage: currentPage * itemsPerPage < filteredTotalCount,
          hasPreviousPage: currentPage > 1,
        },
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return res.status(500).json({
      error: "Failed to fetch videos",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
