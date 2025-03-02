import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "認証が必要です" });
  }

  const commentId = Number(req.query.id);
  if (isNaN(commentId)) {
    return res.status(400).json({ error: "無効なコメントIDです" });
  }

  // コメントの所有者を確認
  const comment = await prisma.mCComment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    return res.status(404).json({ error: "コメントが見つかりません" });
  }

  if (comment.userId !== session.user.id) {
    return res.status(403).json({ error: "権限がありません" });
  }

  if (req.method === "PUT") {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: "コメント内容は必須です" });
    }

    const updatedComment = await prisma.mCComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return res.json(updatedComment);
  }

  if (req.method === "DELETE") {
    // トランザクションを使用して親コメントと返信を一括削除
    await prisma.$transaction(async (tx) => {
      // 関連する返信を削除
      await tx.mCComment.deleteMany({
        where: {
          parentId: commentId,
        },
      });

      // 親コメントを削除
      await tx.mCComment.delete({
        where: { id: commentId },
      });
    });

    return res.json({ message: "コメントを削除しました" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
