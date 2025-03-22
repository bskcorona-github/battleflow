import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { mcId } = req.query;

    if (!mcId || Array.isArray(mcId)) {
      return res.status(400).json({ error: "Invalid MC ID" });
    }

    const mcIdNum = parseInt(mcId, 10);

    if (isNaN(mcIdNum)) {
      return res.status(400).json({ error: "MC ID must be a number" });
    }

    // コメントを取得
    const comments = await prisma.mCComment.findMany({
      where: {
        mcId: mcIdNum,
        parentId: null, // 親コメントのみ取得
      },
      orderBy: {
        createdAt: "desc",
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
        replies: {
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
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // 日付をJSON化するために変換
    const serializedComments = comments.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      replies: comment.replies.map((reply) => ({
        ...reply,
        createdAt: reply.createdAt.toISOString(),
        updatedAt: reply.updatedAt.toISOString(),
      })),
    }));

    res.status(200).json(serializedComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "コメントの取得に失敗しました" });
  }
}
