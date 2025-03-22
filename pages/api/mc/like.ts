import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
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
    // セッションの確認 - getServerSessionに変更
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user) {
      return res.status(401).json({ error: "認証が必要です" });
    }

    const { mcId } = req.body;

    // 数値に変換
    const parsedMcId = typeof mcId === "string" ? parseInt(mcId, 10) : mcId;

    // ユーザー情報はセッションから直接取得
    if (!session.user.id) {
      return res.status(401).json({ error: "ユーザーIDが見つかりません" });
    }

    // 既存のいいねを確認
    const existingLike = await prisma.like.findFirst({
      where: {
        mcId: parsedMcId,
        userId: session.user.id,
      },
    });

    let liked = false;
    let message = "";
    let likesCount = 0;

    // 既存のいいねがある場合は削除、ない場合は作成
    if (existingLike) {
      // トランザクションでいいね削除といいね数の更新を行う
      await prisma.$transaction([
        prisma.like.delete({
          where: {
            id: existingLike.id,
          },
        }),
        prisma.mC.update({
          where: {
            id: parsedMcId,
          },
          data: {
            likesCount: {
              decrement: 1,
            },
          },
        }),
      ]);

      message = "いいねを取り消しました";
      liked = false;
    } else {
      // トランザクションでいいね作成といいね数の更新を行う
      await prisma.$transaction([
        prisma.like.create({
          data: {
            mcId: parsedMcId,
            userId: session.user.id,
          },
        }),
        prisma.mC.update({
          where: {
            id: parsedMcId,
          },
          data: {
            likesCount: {
              increment: 1,
            },
          },
        }),
      ]);

      message = "いいねしました";
      liked = true;
    }

    // 更新後のいいね数を取得
    const updatedMC = await prisma.mC.findUnique({
      where: {
        id: parsedMcId,
      },
      select: {
        likesCount: true,
      },
    });

    likesCount = updatedMC?.likesCount || 0;

    return res.status(200).json({
      message,
      liked,
      likesCount,
    });
  } catch (error) {
    console.error("Error handling like:", error);
    return res.status(500).json({ error: "いいねの処理に失敗しました" });
  }
}
