import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Vercel Cronからのリクエストかを確認
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 動画更新APIを内部的に呼び出し
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/videos/update`,
      {
        method: "POST",
        headers: {
          "X-User-Email": "system@battleflow.com",
        },
      }
    );

    if (!response.ok) throw new Error("Update failed");

    res.status(200).json({ message: "Cron job completed successfully" });
  } catch (error) {
    console.error("Cron job error:", error);
    res.status(500).json({ error: "Cron job failed" });
  }
}
