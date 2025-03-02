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
    return res.status(401).json({ error: "認証が必要です" });
  }

  const { commentId, content } = req.body;

  try {
    const reply = await prisma.mCComment.create({
      data: {
        content,
        userId: session.user.id,
        parentId: commentId,
        mcId: (
          await prisma.mCComment.findUnique({
            where: { id: commentId },
            select: { mcId: true },
          })
        )?.mcId,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return res.json(reply);
  } catch (error) {
    console.error("Reply error:", error);
    return res.status(500).json({ error: "返信の投稿に失敗しました" });
  }
}
