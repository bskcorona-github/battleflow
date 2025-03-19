import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { APIError } from "@/utils/errors";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      throw new APIError("認証が必要です", 401);
    }

    switch (req.method) {
      case "POST": {
        const { mcId, content } = req.body;

        if (!mcId || !content?.trim()) {
          throw new APIError("必要なパラメータが不足しています", 400);
        }

        // MCの存在確認
        const mc = await prisma.mC.findUnique({
          where: { id: parseInt(mcId) },
        });

        if (!mc) {
          throw new APIError("MCが見つかりません", 404);
        }

        const comment = await prisma.mCComment.create({
          data: {
            content: content.trim(),
            userId: session.user.id,
            mcId: parseInt(mcId),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true,
              },
            },
          },
        });

        return res.status(200).json({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
          userId: comment.userId,
          mcId: comment.mcId,
          parentId: comment.parentId,
          user: comment.user,
          replies: [],
        });
      }

      default:
        throw new APIError("Method not allowed", 405);
    }
  } catch (error) {
    console.error("API Error:", error);
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: "予期せぬエラーが発生しました" });
  }
}
