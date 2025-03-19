import { NextApiRequest, NextApiResponse } from "next";
import { searchAndSaveImage } from "@/lib/imageSearch";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { mcName, skipUrls = [] } = req.body;

    if (!mcName) {
      return res.status(400).json({ error: "MC name is required" });
    }

    const imagePath = await searchAndSaveImage(mcName, 0, 1, skipUrls);

    res.status(200).json({
      success: true,
      imagePath,
      imageUrl: imagePath, // クライアント側で使用済みURL管理用
    });
  } catch (error) {
    console.error("Error updating MC image:", error);

    // エラーの種類に応じて適切なレスポンスを返す
    if (error instanceof Error) {
      if (error.message === "QUOTA_EXCEEDED") {
        return res.status(429).json({
          error: "API rate limit exceeded",
          message:
            "現在APIの利用制限に達しています。しばらく時間をおいて再度お試しください。",
          code: "QUOTA_EXCEEDED",
        });
      }
    }

    res.status(500).json({
      error: "Failed to update MC image",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
