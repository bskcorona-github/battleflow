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
    // リクエストとセッションの並列処理
    const [sessionPromise, requestBody] = await Promise.all([
      getServerSession(req, res, authOptions),
      req.body,
    ]);

    const session = sessionPromise;
    if (!session || !session.user) {
      return res.status(401).json({ error: "認証が必要です" });
    }

    const { mcId } = requestBody;

    // パラメータの検証を強化
    if (mcId === undefined || mcId === null) {
      return res.status(400).json({ error: "mcIdは必須パラメータです" });
    }

    // 数値に変換
    const parsedMcId = typeof mcId === "string" ? parseInt(mcId, 10) : mcId;

    // 無効な値をチェック
    if (isNaN(parsedMcId) || parsedMcId <= 0) {
      return res.status(400).json({ error: "無効なmcIdです" });
    }

    // ユーザー情報はセッションから直接取得
    if (!session.user.id) {
      return res.status(401).json({ error: "ユーザーIDが見つかりません" });
    }

    // トランザクションを最適化して全ての処理を一度に行う
    const result = await prisma.$transaction(async (tx) => {
      // 既存のいいねを確認
      const existingLike = await tx.like.findFirst({
        where: {
          mcId: parsedMcId,
          userId: session.user.id,
        },
      });

      let msg = "";
      let isLiked = false;

      if (existingLike) {
        // いいねを削除
        await tx.like.delete({
          where: {
            id: existingLike.id,
          },
        });

        msg = "いいねを取り消しました";
        isLiked = false;
      } else {
        // いいねを作成
        await tx.like.create({
          data: {
            mcId: parsedMcId,
            userId: session.user.id,
          },
        });

        msg = "いいねしました";
        isLiked = true;
      }

      // いいね数を更新して最新の状態を取得
      const updatedMC = await tx.mC.update({
        where: {
          id: parsedMcId,
        },
        data: {
          likesCount: {
            [existingLike ? "decrement" : "increment"]: 1,
          },
        },
        select: {
          likesCount: true,
        },
      });

      return { message: msg, liked: isLiked, likesCount: updatedMC.likesCount };
    });

    // 結果を返す
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error handling like:", error);
    // エラーメッセージをより具体的に
    const errorMessage =
      error instanceof Error ? error.message : "いいねの処理に失敗しました";
    return res.status(500).json({ error: errorMessage });
  }
}
