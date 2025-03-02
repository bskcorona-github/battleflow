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
  if (!session?.user?.id) {
    return res.status(401).json({ error: "ログインが必要です" });
  }

  try {
    const { mcId } = req.body;
    const userId = session.user.id;

    // 既存のいいねを確認
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_mcId: {
          userId,
          mcId,
        },
      },
    });

    if (existingLike) {
      // いいねを削除
      await prisma.like.delete({
        where: {
          userId_mcId: {
            userId,
            mcId,
          },
        },
      });

      // MCのいいね数を更新
      const updatedMC = await prisma.mC.update({
        where: { id: mcId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      });

      return res.status(200).json({
        message: "いいねを取り消しました",
        likesCount: updatedMC.likesCount,
        liked: false,
      });
    } else {
      // 新しいいいねを作成
      await prisma.like.create({
        data: {
          userId,
          mcId,
        },
      });

      // MCのいいね数を更新
      const updatedMC = await prisma.mC.update({
        where: { id: mcId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      });

      return res.status(200).json({
        message: "いいねしました",
        likesCount: updatedMC.likesCount,
        liked: true,
      });
    }
  } catch (error) {
    console.error("Like error:", error);
    return res.status(500).json({ error: "いいねの処理に失敗しました" });
  }
}
