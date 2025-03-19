// import { Video } from "@prisma/client"; // 未使用のインポート
import { google } from "googleapis";

// 警告を修正するため、未使用のものはコメントアウト
// const API_KEYS = [
//   process.env.YOUTUBE_API_KEY,
//   process.env.YOUTUBE_API_KEY2,
// ].filter(Boolean) as string[];

// let currentKeyIndex = 0;

// function getNextApiKey(): string {
//   const key = API_KEYS[currentKeyIndex];
//   currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
//   return key;
// }

// interface YouTubeApiItem {
//   snippet: {
//     resourceId: {
//       videoId: string;
//     };
//     title: string;
//     thumbnails: {
//       medium: {
//         url: string;
//       };
//     };
//     publishedAt: string;
//     channelTitle: string;
//   };
// }

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

type YouTubeVideo = {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  channelId: string;
  channelTitle: string;
  viewCount: string;
  duration: string;
};

// チャンネル名のマッピングを追加
const CHANNEL_NAMES = {
  UC15ebOqdhmvl1eb0s0jk5aw: "戦極",
  UCLn8FintdYEDCSK6HaX5Q4g: "UMB",
  UCQbxh2ft3vw9M6Da_kuIa6A: "KOK",
  UCyGlD1rZjYGs8IjEfA4Kf3A: "NG",
  UCe_EvY8GrvYgx8PbwRBc75g: "凱旋",
  UCj6aXG5H_fm_RAvxH38REXw: "ADRENALINE",
  UCXIaUFBW7TrZh_utWNILFDQ: "FSL",
  UCbuC7CWNCGwMT_lqRWvKbDQ: "罵倒",
  UCTGmN6Qt8TGs37BtLSCkinQ: "口喧嘩祭",
} as const;

// ISO 8601 形式の動画時間を分に変換する関数を追加
function getDurationInMinutes(duration: string): number {
  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return 0;

  const hours = parseInt(matches[1] || "0", 10);
  const minutes = parseInt(matches[2] || "0", 10);
  const seconds = parseInt(matches[3] || "0", 10);

  return hours * 60 + minutes + seconds / 60;
}

// async function fetchWithApiKey( // 未使用の関数
//   url: string,
//   attemptCount = 0
// ): Promise<
//   YouTubeApiResponse | YouTubeStatsApiResponse | YouTubeChannelResponse
// > {
//   ... 関数の内容 ...
// }

export async function fetchChannelVideos(
  channelId: string
): Promise<YouTubeVideo[]> {
  try {
    const channelName =
      CHANNEL_NAMES[channelId as keyof typeof CHANNEL_NAMES] || channelId;
    console.log(`Fetching videos for channel: ${channelName}`);

    // チャンネルの動画を取得
    const { data: playlistData } = await youtube.channels.list({
      part: ["contentDetails"],
      id: [channelId],
    });

    if (!playlistData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads) {
      console.error("No uploads playlist found for channel:", channelId);
      return [];
    }

    const uploadsPlaylistId =
      playlistData.items[0].contentDetails.relatedPlaylists.uploads;

    let allVideos: YouTubeVideo[] = [];
    let pageToken: string | undefined = undefined;

    // すべての動画を取得するまでループ
    do {
      // プレイリストの動画を取得
      const { data }: { data: any } = await youtube.playlistItems.list({
        part: ["snippet"],
        playlistId: uploadsPlaylistId,
        maxResults: 50, // 1回のリクエストで最大数を取得
        pageToken: pageToken,
      });

      if (!data.items) {
        console.error("No videos found in playlist");
        break;
      }

      // 動画IDのリストを作成
      const videoIds = data.items
        .map((item: any) => item.snippet?.resourceId?.videoId)
        .filter(Boolean);

      // 動画の詳細情報を取得（contentDetailsを追加）
      const { data: videoDetails } = await youtube.videos.list({
        part: ["snippet", "statistics", "contentDetails"], // contentDetailsを追加
        id: videoIds,
      });

      if (!videoDetails.items) {
        console.error("No video details found");
        break;
      }

      // 必要な情報を抽出して整形（1分以上の動画のみ）
      const videos = videoDetails.items
        .filter((video) => {
          const duration = video.contentDetails?.duration || "PT0S";
          const minutes = getDurationInMinutes(duration);
          return minutes >= 1;
        })
        .map((video) => ({
          id: video.id || "",
          title: video.snippet?.title || "",
          thumbnail: video.snippet?.thumbnails?.high?.url || "",
          publishedAt: video.snippet?.publishedAt || new Date().toISOString(),
          channelId: video.snippet?.channelId || "",
          channelTitle: video.snippet?.channelTitle || "",
          viewCount: video.statistics?.viewCount || "0",
          duration: video.contentDetails?.duration || "",
        }));

      allVideos = [...allVideos, ...videos];

      // 次のページのトークンを取得
      pageToken = data.nextPageToken;

      // API制限を考慮して少し待機
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } while (pageToken);

    console.log(`Total videos fetched for ${channelName}: ${allVideos.length}`);
    return allVideos;
  } catch (error) {
    console.error(
      `Error fetching videos for ${
        CHANNEL_NAMES[channelId as keyof typeof CHANNEL_NAMES] || channelId
      }:`,
      error
    );
    throw error;
  }
}
