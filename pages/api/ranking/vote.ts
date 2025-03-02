import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { updateMCScores } from "@/lib/rankingCalculator";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { mcId, rhyme, vibes, flow, dialogue, musicality } = req.body;

    // 投票を記録
    await prisma.vote.create({
      data: {
        mcId,
        userId: session.user.id,
        rhyme,
        vibes,
        flow,
        dialogue,
        musicality,
      },
    });

    // 集計値を更新
    const votes = await prisma.vote.findMany({
      where: { mcId },
    });

    const rawScores = {
      rhyme: votes.reduce((sum, v) => sum + v.rhyme, 0) / votes.length,
      vibes: votes.reduce((sum, v) => sum + v.vibes, 0) / votes.length,
      flow: votes.reduce((sum, v) => sum + v.flow, 0) / votes.length,
      dialogue: votes.reduce((sum, v) => sum + v.dialogue, 0) / votes.length,
      musicality:
        votes.reduce((sum, v) => sum + v.musicality, 0) / votes.length,
    };

    const bayesianScores = updateMCScores(rawScores, votes.length);

    // MCRankを更新
    const updatedMC = await prisma.mCRank.update({
      where: { id: mcId },
      data: {
        ...bayesianScores,
        rawRhymeScore: rawScores.rhyme,
        rawVibesScore: rawScores.vibes,
        rawFlowScore: rawScores.flow,
        rawDialogueScore: rawScores.dialogue,
        rawMusicalityScore: rawScores.musicality,
        rawTotalScore:
          rawScores.rhyme +
          rawScores.vibes +
          rawScores.flow +
          rawScores.dialogue +
          rawScores.musicality,
        voteCount: votes.length,
      },
    });

    res.json(updatedMC);
  } catch (error) {
    console.error("Vote API error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
