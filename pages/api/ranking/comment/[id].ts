import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "認証が必要です" });
  }

  const { id } = req.query;
  const commentId = parseInt(id as string);

  if (isNaN(commentId)) {
    return res.status(400).json({ error: "無効なコメントIDです" });
  }

  // コメントの所有者を確認
  const comment = await prisma.rankComment.findUnique({
    where: { id: commentId },
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!comment) {
    return res.status(404).json({ error: "コメントが見つかりません" });
  }

  if (comment.user.email !== session.user.email) {
    return res
      .status(403)
      .json({ error: "このコメントを編集する権限がありません" });
  }

  // PUT: コメントの編集
  if (req.method === "PUT") {
    const { content } = req.body;

    if (!content || typeof content !== "string") {
      return res.status(400).json({ error: "コメント内容が必要です" });
    }

    try {
      const updatedComment = await prisma.rankComment.update({
        where: { id: commentId },
        data: { content },
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

      return res.status(200).json({
        id: updatedComment.id,
        content: updatedComment.content,
        createdAt: updatedComment.createdAt.toISOString(),
        updatedAt: updatedComment.updatedAt.toISOString(),
        userId: updatedComment.userId,
        mcId: updatedComment.mcRankId,
        parentId: updatedComment.parentId,
        user: {
          name: updatedComment.user.name,
          image: updatedComment.user.image,
          email: updatedComment.user.email,
        },
      });
    } catch (error) {
      console.error("Update comment error:", error);
      return res.status(500).json({ error: "コメントの更新に失敗しました" });
    }
  }

  // DELETE: コメントの削除
  if (req.method === "DELETE") {
    try {
      await prisma.rankComment.delete({
        where: { id: commentId },
      });

      return res.status(200).json({ message: "コメントを削除しました" });
    } catch (error) {
      console.error("Delete comment error:", error);
      return res.status(500).json({ error: "コメントの削除に失敗しました" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
