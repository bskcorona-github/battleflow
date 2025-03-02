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
  if (!session?.user?.email) {
    return res.status(401).json({ error: "ログインが必要です" });
  }

  try {
    const { mcId, content } = req.body;

    const comment = await prisma.rankComment.create({
      data: {
        content,
        mcRankId: mcId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      userId: comment.userId,
      mcId: comment.mcRankId,
      parentId: comment.parentId,
      user: {
        name: comment.user.name,
        image: comment.user.image,
        email: comment.user.email,
      },
      replies: [],
    });
  } catch (error) {
    console.error("Comment error:", error);
    res.status(500).json({ error: "コメントの投稿に失敗しました" });
  }
}
