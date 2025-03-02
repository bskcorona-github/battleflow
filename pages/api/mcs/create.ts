import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, affiliation, description, hood } = req.body;

    // トランザクションを使用して両方のテーブルに同時に追加
    const result = await prisma.$transaction(async (tx) => {
      // MCテーブルに追加
      const mc = await tx.mC.create({
        data: {
          name,
          affiliation,
          description,
          hood,
        },
      });

      // MCRankテーブルに同じMCを追加
      const mcRank = await tx.mCRank.create({
        data: {
          name,
          mcId: mc.id,
        },
      });

      return { mc, mcRank };
    });

    res.status(200).json(result.mc);
  } catch (error) {
    console.error("Create MC error:", error);
    res.status(500).json({ error: "MCの作成に失敗しました" });
  }
}
