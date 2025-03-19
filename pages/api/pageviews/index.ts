import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../../lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const { path } = req.body;

      if (!path || typeof path !== "string") {
        return res
          .status(400)
          .json({ error: "パスが正しく指定されていません" });
      }

      const pageView = await prisma.pageView.upsert({
        where: {
          path,
        },
        update: {
          count: {
            increment: 1,
          },
        },
        create: {
          path,
          count: 1,
        },
      });

      return res.status(200).json(pageView);
    } catch (error) {
      console.error("Error updating page views:", error);
      return res
        .status(500)
        .json({ error: "ページビューの更新に失敗しました" });
    }
  }

  if (req.method === "GET") {
    try {
      const session = await getSession({ req });

      if (!session?.user?.email) {
        return res.status(401).json({ error: "認証が必要です" });
      }

      // 管理者チェック
      const user = await prisma.user.findUnique({
        where: {
          email: session.user.email,
        },
        select: {
          isAdmin: true,
        },
      });

      if (!user?.isAdmin) {
        return res.status(403).json({ error: "管理者権限が必要です" });
      }

      const pageViews = await prisma.pageView.findMany({
        orderBy: {
          count: "desc",
        },
      });

      return res.status(200).json(pageViews);
    } catch (error) {
      console.error("Error fetching page views:", error);
      return res
        .status(500)
        .json({ error: "ページビューの取得に失敗しました" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
