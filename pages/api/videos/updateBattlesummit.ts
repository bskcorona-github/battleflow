import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { fetchChannelVideos } from "@/lib/youtube";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const allSummitVideos = [];

    for (const channelId of Object.keys(CHANNEL_TABLES)) {
      const allVideos = await fetchChannelVideos(channelId);

      const summitVideos = allVideos.filter((video) =>
        video?.title?.toLowerCase().includes("battle summit")
      );

      allSummitVideos.push(...summitVideos);
    }

    if (allSummitVideos.length > 0) {
      await prisma.video_battlesummit.createMany({
        data: allSummitVideos.map((video) => ({
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnail,
          publishedAt: new Date(video.publishedAt),
          channelId: video.channelId,
          channelTitle: video.channelTitle,
          viewCount: parseInt(video.viewCount, 10),
          duration: video.duration,
          sourceChannel: video.channelId,
        })),
        skipDuplicates: true,
      });
    }

    return res.status(200).json({
      message: "BATTLE SUMMIT videos updated successfully",
      updatedCount: allSummitVideos.length,
    });
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({
      error: "Failed to update BATTLE SUMMIT videos",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
