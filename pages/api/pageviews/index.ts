import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import { prisma } from "../../../lib/prisma";

// ページビュー更新の制限（秒単位）
const UPDATE_LIMIT_SECONDS = 10;
// 最後の更新時間を記録
const lastUpdates: Record<string, number> = {};

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

      // 同じパスに対する頻繁な更新を防止
      const now = Date.now();
      const lastUpdate = lastUpdates[path] || 0;
      if (now - lastUpdate < UPDATE_LIMIT_SECONDS * 1000) {
        return res.status(200).json({ message: "最近更新済み" });
      }

      // 更新時間を記録
      lastUpdates[path] = now;

      // 非同期で更新処理を実行し、レスポンスはすぐに返す
      updatePageView(path).catch((error) => {
        console.error("Error updating page views in background:", error);
      });

      return res
        .status(202)
        .json({ message: "ページビュー更新処理を開始しました" });
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

// ページビューを非同期で更新する関数
async function updatePageView(path: string): Promise<void> {
  try {
    await prisma.pageView.upsert({
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
  } catch (error) {
    console.error("Failed to update page view in background:", error);
  }
}
