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

// キャッシュ機能を無効化（常に最新データを取得するため）
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
  channelId: string
): string => {
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
    channelId,
    keyword,
    sort = "views",
    page = "1",
    limit = "10",
    tab = "", // タブ名を追加
  } = req.query;
  const currentPage = parseInt(page as string, 10);
  const itemsPerPage = parseInt(limit as string, 10);

  try {
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

      const totalCount = filteredVideos.length;
      const videos = filteredVideos.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );

      return res.status(200).json({
        videos,
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

    const tableName = CHANNEL_TABLES[channelId];

    // クエリオプションを作成
    const queryOptions: QueryOptions = {
      orderBy:
        sort === "views"
          ? { viewCount: "desc" }
          : sort === "date_desc"
          ? { publishedAt: "desc" }
          : { publishedAt: "asc" },
      skip: (currentPage - 1) * itemsPerPage,
      take: itemsPerPage,
    };

    // 動的にテーブルを選択してデータを取得（型安全に）
    const model = getTableModel(prisma, tableName);
    const totalCount = await model.count();

    if (req.method === "GET") {
      // タブ名を取得（リクエストから）
      const tabName = typeof tab === "string" ? tab : "";

      // タブ名を含めたキャッシュキーを生成
      const cacheKey = getCacheKey(queryOptions, tabName, channelId as string);

      // デバッグログ
      console.log(`Request for tab: ${tabName}, channel: ${channelId}`);

      // キャッシュが有効であれば利用（ただし現在は無効化中）
      if (isCacheValid(cacheKey)) {
        console.log(`Using cached videos data for tab: ${tabName}`);
        return res.status(200).json({
          videos: videoCache[cacheKey].data,
          pagination: {
            total: totalCount,
            currentPage,
            totalPages: Math.ceil(totalCount / itemsPerPage),
            hasNextPage: currentPage * itemsPerPage < totalCount,
            hasPreviousPage: currentPage > 1,
          },
        });
      }

      console.log(`Fetching fresh videos for tab: ${tabName}`);

      // データベースから取得
      const videos = await model.findMany(queryOptions);

      // キーワードでのフィルタリングを強化
      let filteredVideos = videos;
      if (keyword) {
        // タブ名を取得（フィルタリングに使用）
        console.log(
          `Filtering videos for tab: ${tabName}, keyword: ${keyword}`
        );

        filteredVideos = videos.filter((video: Video) => {
          const title = video.title.toLowerCase();
          const keywords = (keyword as string)
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

      // 結果をキャッシュに保存（タブ名を含んだキーで）
      videoCache[cacheKey] = {
        data: filteredVideos,
        timestamp: Date.now(),
      };

      console.log(
        `Saved ${filteredVideos.length} videos to cache for tab: ${tabName}`
      );

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

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return res.status(500).json({
      error: "Failed to fetch videos",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
