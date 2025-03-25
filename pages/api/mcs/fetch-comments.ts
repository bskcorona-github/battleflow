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
    const { mcId, page = "1", pageSize = "10", loadReplies = "false" } = req.query;

    if (!mcId || Array.isArray(mcId)) {
      return res.status(400).json({ error: "Invalid MC ID" });
    }

    const mcIdNum = parseInt(mcId, 10);
    const pageNum = parseInt(Array.isArray(page) ? page[0] : page, 10) || 1;
    const pageSizeNum = parseInt(Array.isArray(pageSize) ? pageSize[0] : pageSize, 10) || 10;
    const shouldLoadReplies = loadReplies === "true";

    if (isNaN(mcIdNum)) {
      return res.status(400).json({ error: "MC ID must be a number" });
    }

    // パフォーマンス計測開始
    const startTime = Date.now();

    // コメントを取得 - includeの代わりにselectを使用
    const comments = await prisma.mCComment.findMany({
      where: {
        mcId: mcIdNum,
        parentId: null, // 親コメントのみ取得
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        mcId: true,
        parentId: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            // emailは不要なので削除
          },
        },
        // 返信は必要な場合のみ取得
        ...(shouldLoadReplies ? {
          replies: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              updatedAt: true,
              userId: true,
              mcId: true,
              parentId: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  // emailは不要なので削除
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          }
        } : {
          // 返信が不要な場合は、数だけカウント
          _count: {
            select: {
              replies: true
            }
          }
        }),
      },
      // ページネーション対応
      take: pageSizeNum,
      skip: (pageNum - 1) * pageSizeNum,
    });

    // 総コメント数を取得
    const totalCount = await prisma.mCComment.count({
      where: {
        mcId: mcIdNum,
        parentId: null,
      },
    });

    // 日付をJSON化するために変換
    const serializedComments = comments.map((comment) => ({
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      // 返信があるかどうかで処理を分岐
      ...(shouldLoadReplies ? {
        replies: comment.replies?.map((reply) => ({
          ...reply,
          createdAt: reply.createdAt.toISOString(),
          updatedAt: reply.updatedAt.toISOString(),
        })) || []
      } : {
        repliesCount: comment._count?.replies || 0,
        replies: [] // 空配列を返す
      }),
    }));

    // 処理時間計測
    const processingTime = Date.now() - startTime;
    console.log(`コメント取得処理時間: ${processingTime}ms, コメント数: ${serializedComments.length}件`);

    res.status(200).json({
      comments: serializedComments,
      pagination: {
        total: totalCount,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil(totalCount / pageSizeNum)
      }
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "コメントの取得に失敗しました" });
  }
}
