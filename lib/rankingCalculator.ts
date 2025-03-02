export function calculateBayesianScore(
  rawScore: number,
  voteCount: number,
  prior = 10, // 事前分布の平均
  priorWeight = 10 // 事前分布の重み
): number {
  return (
    (rawScore * voteCount + prior * priorWeight) / (voteCount + priorWeight)
  );
}

export function updateMCScores(
  rawScores: {
    rhyme: number;
    vibes: number;
    flow: number;
    dialogue: number;
    musicality: number;
  },
  voteCount: number
) {
  // 各項目のベイズ推定スコアを計算
  const scores = {
    rhymeScore: calculateBayesianScore(rawScores.rhyme, voteCount),
    vibesScore: calculateBayesianScore(rawScores.vibes, voteCount),
    flowScore: calculateBayesianScore(rawScores.flow, voteCount),
    dialogueScore: calculateBayesianScore(rawScores.dialogue, voteCount),
    musicalityScore: calculateBayesianScore(rawScores.musicality, voteCount),
  };

  // 総合スコアを各項目のベイズ推定スコアの合計値として計算
  const totalScore =
    scores.rhymeScore +
    scores.vibesScore +
    scores.flowScore +
    scores.dialogueScore +
    scores.musicalityScore;

  return {
    ...scores,
    totalScore,
  };
}
