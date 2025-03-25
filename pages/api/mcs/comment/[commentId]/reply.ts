import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]";
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

  const commentId = Number(req.query.commentId);
  if (isNaN(commentId)) {
    return res.status(400).json({ error: "無効なコメントIDです" });
  }

  try {
    // 親コメントの存在確認とmcIdの取得
    const parentComment = await prisma.mCComment.findUnique({
      where: { id: commentId },
      select: { mcId: true },
    });

    if (!parentComment) {
      return res.status(404).json({ error: "親コメントが見つかりません" });
    }

    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: "返信内容は必須です" });
    }

    // 返信を作成
    const reply = await prisma.mCComment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        mcId: parentComment.mcId,
        parentId: commentId,
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

    // レスポンスデータを整形
    const responseData = {
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt.toISOString(),
      updatedAt: reply.updatedAt.toISOString(),
      userId: reply.userId,
      mcId: reply.mcId,
      parentId: reply.parentId,
      user: {
        name: reply.user.name,
        image: reply.user.image,
        email: reply.user.email,
      },
      replies: [],
    };

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Reply error:", error);
    return res.status(500).json({ error: "返信の投稿に失敗しました" });
  }
}
