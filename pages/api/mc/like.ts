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
        // いいねを作成（重複がないことを再確認）
        try {
          await tx.like.create({
            data: {
              mcId: parsedMcId,
              userId: session.user.id,
            },
          });
        } catch (err) {
          // ユニーク制約エラーが発生した場合は既に存在するとみなす
          console.warn("いいねの作成中にエラーが発生しました:", err);
          const errMsg = err instanceof Error ? err.message : "";

          // 重複エラーの場合は正常に処理を続行
          if (errMsg.includes("Unique constraint failed")) {
            console.log(
              "ユーザーはすでにいいねしているため、処理をスキップします"
            );
          } else {
            // その他のエラーは再スロー
            throw err;
          }
        }

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

    // ユニーク制約エラーの場合は適切なレスポンスを返す
    if (errorMessage.includes("Unique constraint failed")) {
      // セッションを再取得
      const currentSession = await getServerSession(req, res, authOptions);
      if (!currentSession || !currentSession.user || !currentSession.user.id) {
        return res.status(401).json({ error: "認証が必要です" });
      }

      // 既存のいいねを取得
      try {
        const existingLike = await prisma.like.findFirst({
          where: {
            mcId: parseInt(req.body.mcId, 10),
            userId: currentSession.user.id,
          },
        });

        if (existingLike) {
          // 既存のいいねが見つかった場合、MC情報を取得
          const mc = await prisma.mC.findUnique({
            where: {
              id: parseInt(req.body.mcId, 10),
            },
            select: {
              likesCount: true,
            },
          });

          return res.status(200).json({
            message: "すでにいいねしています",
            liked: true,
            likesCount: mc?.likesCount || 0,
          });
        }
      } catch (secondError) {
        console.error("Error handling duplicate like:", secondError);
      }
    }

    return res.status(500).json({ error: errorMessage });
  }
}
