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

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.isAdmin) {
    return res.status(403).json({ error: "管理者権限が必要です" });
  }

  try {
    // トランザクションを使用してリセット処理を実行
    await prisma.$transaction(async (tx) => {
      // 投票を全て削除
      await tx.vote.deleteMany();

      // MCRankのスコアをリセット
      await tx.mCRank.updateMany({
        data: {
          totalScore: 0,
          rhymeScore: 0,
          vibesScore: 0,
          flowScore: 0,
          dialogueScore: 0,
          musicalityScore: 0,
          rawTotalScore: 0,
          rawRhymeScore: 0,
          rawVibesScore: 0,
          rawFlowScore: 0,
          rawDialogueScore: 0,
          rawMusicalityScore: 0,
          voteCount: 0,
        },
      });
    });

    return res.status(200).json({ message: "投票データをリセットしました" });
  } catch (error) {
    console.error("Reset error:", error);
    return res.status(500).json({ error: "リセット処理に失敗しました" });
  }
}
