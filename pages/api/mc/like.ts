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
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { mcId } = req.body;
    if (!mcId) {
      return res.status(400).json({ error: "MC ID is required" });
    }

    // 数値型に変換
    const parsedMcId = typeof mcId === "string" ? parseInt(mcId, 10) : mcId;

    // トランザクションを使用して処理
    const result = await prisma.$transaction(async (tx) => {
      // 既存のいいねを確認 (複合ユニーク制約を使用)
      const existingLike = await tx.like.findUnique({
        where: {
          userId_mcId: {
            userId: session.user.id,
            mcId: parsedMcId,
          },
        },
      });

      if (existingLike) {
        // いいねを削除
        await tx.like.delete({
          where: {
            userId_mcId: {
              userId: session.user.id,
              mcId: parsedMcId,
            },
          },
        });

        // MCのlikesCountを減少
        const updatedMC = await tx.mC.update({
          where: { id: parsedMcId },
          data: {
            likesCount: {
              decrement: 1,
            },
          },
        });

        return {
          liked: false,
          likesCount: updatedMC.likesCount,
          message: "いいねを取り消しました",
        };
      }

      // いいねを作成
      await tx.like.create({
        data: {
          userId: session.user.id,
          mcId: parsedMcId,
        },
      });

      // MCのlikesCountを増加
      const updatedMC = await tx.mC.update({
        where: { id: parsedMcId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      });

      return {
        liked: true,
        likesCount: updatedMC.likesCount,
        message: "いいねしました",
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error processing like:", error);
    if (error instanceof Error) {
      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}
