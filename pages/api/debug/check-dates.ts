import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // 各チャンネルの動画数と日付の範囲を確認
    const channelStats = await Promise.all(
      [
        { id: "UC15ebOqdhmvl1eb0s0jk5aw", name: "戦極" },
        { id: "UCLn8FintdYEDCSK6HaX5Q4g", name: "UMB" },
        { id: "UCQbxh2ft3vw9M6Da_kuIa6A", name: "KOK" },
        { id: "UCyGlD1rZjYGs8IjEfA4Kf3A", name: "NG" },
        { id: "UCe_EvY8GrvYgx8PbwRBc75g", name: "凱旋" },
        { id: "UCj6aXG5H_fm_RAvxH38REXw", name: "ADRENALINE" },
        { id: "UCXIaUFBW7TrZh_utWNILFDQ", name: "FSL" },
        { id: "UCbuC7CWNCGwMT_lqRWvKbDQ", name: "罵倒" },
        { id: "UCTGmN6Qt8TGs37BtLSCkinQ", name: "口喧嘩祭" },
      ].map(async (channel) => {
        const stats = await prisma.video.aggregate({
          where: {
            channelId: channel.id,
          },
          _count: {
            id: true,
          },
          _min: {
            publishedAt: true,
          },
          _max: {
            publishedAt: true,
          },
        });

        // publishedAtがnullの動画の数を確認
        const nullDates = await prisma.video.count({
          where: {
            channelId: channel.id,
            publishedAt: {
              isSet: false,
            } as Prisma.DateTimeFilter<"Video">,
          },
        });

        return {
          channelName: channel.name,
          channelId: channel.id,
          totalVideos: stats._count.id,
          nullDates,
          oldestVideo: stats._min.publishedAt,
          newestVideo: stats._max.publishedAt,
        };
      })
    );

    res.status(200).json(channelStats);
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({
      error: "Failed to check dates",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
