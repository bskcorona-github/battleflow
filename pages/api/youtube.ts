import type { NextApiRequest, NextApiResponse } from "next";

// YouTubeのAPIレスポンスの型定義
interface YouTubeSearchResponse {
  items: Array<{
    id: {
      videoId: string;
    };
    snippet: {
      title: string;
      thumbnails: {
        medium: {
          url: string;
        };
      };
      publishedAt: string;
      channelTitle: string;
    };
  }>;
}

interface YouTubeStatsResponse {
  items: Array<{
    id: string;
    statistics: {
      viewCount: string;
    };
    contentDetails: {
      duration: string;
    };
  }>;
}

type YouTubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
  viewCount: string;
  duration: string;
};

// キャッシュの型定義
type CacheData = {
  data: YouTubeVideo[];
  timestamp: number;
};

// インメモリキャッシュ
const cache = new Map<string, CacheData>();

const CACHE_DURATION = 1000 * 60 * 60; // 1時間

// APIキーの管理
const API_KEYS = [
  process.env.YOUTUBE_API_KEY,
  process.env.YOUTUBE_API_KEY2,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

function getNextApiKey(): string {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return key;
}

async function fetchWithApiKey(
  url: string,
  attemptCount = 0
): Promise<YouTubeSearchResponse | YouTubeStatsResponse> {
  if (attemptCount >= API_KEYS.length) {
    throw new Error("All API keys have been exhausted");
  }

  const apiKey = getNextApiKey();
  const finalUrl = url.replace(/key=[^&]+/, `key=${apiKey}`);

  const response = await fetch(finalUrl);
  const data = await response.json();

  if (!response.ok) {
    if (data.error?.message?.includes("quota")) {
      console.log(`API key ${apiKey} quota exceeded, trying next key...`);
      return fetchWithApiKey(url, attemptCount + 1);
    }
    throw new Error(data.error?.message || "YouTube API error");
  }

  return data;
}

interface PlaylistItem {
  snippet: {
    resourceId: {
      videoId: string;
    };
    title: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
    publishedAt: string;
    channelTitle: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { keyword, channelId } = req.query;

  if (!channelId) {
    return res.status(400).json({ error: "Channel ID is required" });
  }

  const cacheKey = `${channelId}-${keyword}`;
  const cachedData = cache.get(cacheKey);
  const now = Date.now();

  if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
    return res.status(200).json(cachedData.data);
  }

  try {
    // まずチャンネルの情報を取得してアップロードプレイリストIDを取得
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEYS[0]}`;
    const channelData = await fetchWithApiKey(channelUrl);

    const uploadsPlaylistId =
      channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // すべての動画を取得するための再帰関数
    async function getAllVideos(
      playlistId: string,
      pageToken?: string
    ): Promise<PlaylistItem[]> {
      const pageSize = 50; // APIの最大値
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${pageSize}&playlistId=${playlistId}${
        pageToken ? `&pageToken=${pageToken}` : ""
      }&key=${API_KEYS[0]}`;

      const response = await fetchWithApiKey(playlistUrl);
      const items = response.items || [];

      // 次のページがある場合は再帰的に取得
      if (response.nextPageToken) {
        const nextItems = await getAllVideos(
          playlistId,
          response.nextPageToken
        );
        return [...items, ...nextItems];
      }

      return items;
    }

    // すべての動画を取得
    const allItems = await getAllVideos(uploadsPlaylistId);
    console.log(`Total videos found: ${allItems.length}`);

    // 動画IDを取得して統計情報を取得
    const videoIds = allItems.map((item) => item.snippet.resourceId.videoId);

    // 統計情報を50件ずつ取得（APIの制限のため）
    const statsPromises = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      const batch = videoIds.slice(i, i + 50).join(",");
      // statisticsとcontentDetailsの両方を取得
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${batch}&key=${API_KEYS[0]}`;
      statsPromises.push(fetchWithApiKey(statsUrl));
    }

    const statsResponses = await Promise.all(statsPromises);
    const statsItems = statsResponses.flatMap(
      (response) => response.items || []
    );

    // 統計情報をIDでマップ化（動画の詳細情報も含める）
    const statsMap = new Map(
      statsItems.map((item) => [
        item.id,
        {
          statistics: item.statistics,
          contentDetails: item.contentDetails,
        },
      ])
    );

    // 動画情報を整形してソート
    const videos: YouTubeVideo[] = allItems
      .map((item) => {
        const videoDetails = statsMap.get(item.snippet.resourceId.videoId);
        return {
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails.medium.url,
          publishedAt: item.snippet.publishedAt,
          channelTitle: item.snippet.channelTitle,
          viewCount: videoDetails?.statistics?.viewCount || "0",
          duration: videoDetails?.contentDetails?.duration || "",
        };
      })
      .filter((video) => {
        // ショート動画（60秒以下）を除外
        const duration = parseDuration(video.duration);
        if (duration < 60) return false;

        // ライブ配信を除外
        if (video.duration === "P0D") return false;

        // キーワードフィルタリング
        if (!keyword || keyword === "") {
          return true;
        }

        const title = video.title.toLowerCase();
        const keywords = (keyword as string)
          .toLowerCase()
          .split(/[,\s]+/)
          .filter((k) => k.length > 0);

        if (keywords.length === 0) {
          return true;
        }

        return keywords.some((k) => title.includes(k));
      })
      .sort((a, b) => Number(b.viewCount) - Number(a.viewCount))
      .slice(0, 10);

    console.log(
      "Filtered and sorted videos:",
      videos.map((v) => `${v.title} (${v.viewCount} views)`)
    );

    cache.set(cacheKey, {
      data: videos,
      timestamp: now,
    });

    res.status(200).json(videos);
  } catch (error) {
    if (cachedData) {
      return res.status(200).json(cachedData.data);
    }

    console.error("Detailed API Error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to fetch videos",
      details: error,
    });
  }
}

// ISO 8601 期間形式を秒数に変換する関数
function parseDuration(duration: string): number {
  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return 0;

  const hours = parseInt(matches[1] || "0", 10);
  const minutes = parseInt(matches[2] || "0", 10);
  const seconds = parseInt(matches[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}
