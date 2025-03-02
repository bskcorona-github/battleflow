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
    return res.status(401).json({ error: "認証が必要です" });
  }

  // 管理者権限チェック
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true },
  });

  if (!user?.isAdmin) {
    return res.status(403).json({ error: "管理者権限が必要です" });
  }

  try {
    // ランキングのコメントを全て削除
    await prisma.$executeRaw`DELETE FROM comments_rank`;

    return res.json({ message: "コメントを全てリセットしました" });
  } catch (error) {
    console.error("Reset error:", error);
    return res.status(500).json({ error: "リセットに失敗しました" });
  }
}
