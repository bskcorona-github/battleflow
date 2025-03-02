import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";

// ChartJSの必要なコンポーネントを登録
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

type MCScoreChartProps = {
  scores: {
    rhymeScore: number;
    vibesScore: number;
    flowScore: number;
    dialogueScore: number;
    musicalityScore: number;
  };
};

export default function MCScoreChart({ scores }: MCScoreChartProps) {
  const data = {
    labels: ["韻", "バイブス", "フロー", "対話", "音楽性"],
    datasets: [
      {
        label: "スコア",
        data: [
          scores.rhymeScore,
          scores.vibesScore,
          scores.flowScore,
          scores.dialogueScore,
          scores.musicalityScore,
        ],
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    scales: {
      r: {
        angleLines: {
          display: true,
        },
        suggestedMin: 0,
        suggestedMax: 20,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Radar data={data} options={options} />
    </div>
  );
}
