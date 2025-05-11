import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Request body:", req.body);
    const session = await getServerSession(req, res, authOptions);
    console.log("Session in comment API:", session);

    if (!session?.user?.id) {
      console.log("No user ID in session");
      return res.status(401).json({ error: "Unauthorized - No user ID" });
    }

    const { mcId, content } = req.body;
    console.log("Attempting to create comment:", {
      mcId,
      content,
      userId: session.user.id,
    });

    const mcIdAsInt = parseInt(mcId);
    if (isNaN(mcIdAsInt)) {
      console.log("Invalid MC ID format:", mcId);
      return res.status(400).json({ error: "MC ID must be a number" });
    }

    if (!mcIdAsInt || !content?.trim()) {
      console.log("Invalid request data:", { mcId: mcIdAsInt, content });
      return res.status(400).json({ error: "MC ID and content are required" });
    }

    // MCの存在確認
    const mc = await prisma.mC.findUnique({
      where: { id: mcIdAsInt },
    });

    if (!mc) {
      console.log("MC not found:", mcIdAsInt);
      return res.status(404).json({ error: "MC not found" });
    }

    try {
      const comment = await prisma.mCComment.create({
        data: {
          content: content.trim(),
          userId: session.user.id,
          mcId: mcIdAsInt,
        },
        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      });

      console.log("Comment created successfully:", comment);

      return res.status(200).json({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        user: {
          name: comment.user.name,
          image: comment.user.image,
        },
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({
        error: "Failed to create comment",
        details:
          dbError instanceof Error ? dbError.message : "Unknown database error",
      });
    }
  } catch (error) {
    console.error("Error handling comment:", error);
    return res.status(500).json({
      error: "Failed to process comment",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
