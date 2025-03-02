import { useState } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

type VoteFormProps = {
  mcId: number;
  onSubmit: (scores: {
    rhyme: number;
    vibes: number;
    flow: number;
    dialogue: number;
    musicality: number;
  }) => Promise<void>;
};

export default function RankingVoteForm({ onSubmit }: VoteFormProps) {
  const [scores, setScores] = useState({
    rhyme: 10,
    vibes: 10,
    flow: 10,
    dialogue: 10,
    musicality: 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(scores);
  };

  const categories = [
    { key: "rhyme", label: "韻" },
    { key: "vibes", label: "バイブス" },
    { key: "flow", label: "フロー" },
    { key: "dialogue", label: "対話" },
    { key: "musicality", label: "音楽性" },
  ] as const;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 bg-white rounded-lg shadow"
    >
      {categories.map(({ key, label }) => (
        <div key={key} className="space-y-2">
          <label className="flex justify-between">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <span className="text-sm text-gray-500">{scores[key]}/20</span>
          </label>
          <Slider
            min={1}
            max={20}
            value={scores[key]}
            onChange={(value) =>
              setScores((prev) => ({ ...prev, [key]: value }))
            }
            railStyle={{ backgroundColor: "#E5E7EB" }}
            trackStyle={{ backgroundColor: "#3B82F6" }}
            handleStyle={{
              borderColor: "#3B82F6",
              backgroundColor: "#3B82F6",
            }}
          />
        </div>
      ))}
      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        投票する
      </button>
    </form>
  );
}
