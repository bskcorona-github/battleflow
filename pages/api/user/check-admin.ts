import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "メールアドレスが必要です" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email as string },
      select: { isAdmin: true },
    });

    return res.json({ isAdmin: user?.isAdmin ?? false });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return res.status(500).json({ error: "管理者権限の確認に失敗しました" });
  }
}
