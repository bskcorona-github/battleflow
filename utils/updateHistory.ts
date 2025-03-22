// 更新履歴データの型定義
export interface UpdateItem {
  date: string;
  content: string;
}

// 更新履歴データ（新しい順）
export const updateHistory: UpdateItem[] = [
  {
    date: "2025-03-22",
    content: "サイトデザインをアップデート、ダークモード対応を強化",
  },
  {
    date: "2025-03-15",
    content: "ランキング集計システムの改善、集計速度の向上",
  },
  {
    date: "2025-03-10",
    content: "新しいMCプロフィールを50名追加",
  },
  {
    date: "2025-03-01",
    content: "最新のバトル動画情報を更新",
  },
  {
    date: "2025-02-15",
    content: "サイトパフォーマンスの最適化",
  },
];
