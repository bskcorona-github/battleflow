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

    const parsedMcId = parseInt(mcId);

    // トランザクションを使用して処理
    const result = await prisma.$transaction(async (tx) => {
      // 既存のいいねを確認
      const existingLike = await tx.like.findFirst({
        where: {
          userId: session.user.id,
          mcId: parsedMcId,
        },
      });

      if (existingLike) {
        // いいねを削除
        await tx.like.delete({
          where: {
            id: existingLike.id,
          },
        });

        // MCのlikesCountを減少
        await tx.mC.update({
          where: { id: parsedMcId },
          data: {
            likesCount: {
              decrement: 1,
            },
          },
        });

        return { liked: false };
      }

      // いいねを作成
      await tx.like.create({
        data: {
          userId: session.user.id,
          mcId: parsedMcId,
        },
      });

      // MCのlikesCountを増加
      await tx.mC.update({
        where: { id: parsedMcId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      });

      return { liked: true };
    });

    // いいねの総数を取得
    const likesCount = await prisma.like.count({
      where: {
        mcId: parsedMcId,
      },
    });

    return res.status(200).json({
      ...result,
      likesCount,
    });
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
