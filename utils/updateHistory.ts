// 更新履歴データの型定義
export interface UpdateItem {
  date: string;
  content: string;
}

// 更新履歴データ（新しい順）
export const updateHistory: UpdateItem[] = [
  {
    date: "2025-03-23",
    content:
      "MCランキング一覧の表示数制限を解除、全てのMCが表示されるように改善",
  },
  {
    date: "2025-03-23",
    content:
      "バトル動画ページのページネーション機能を修正、全ての動画が正しく表示されるように改善",
  },
  {
    date: "2025-03-22",
    content: "トップページに更新履歴セクションを追加",
  },
  {
    date: "2025-03-22",
    content: "サイトデザインをアップデート、ダークモード対応を強化",
  },
  {
    date: "2025-03-15",
    content: "ランキング集計システムを改善、集計速度を向上",
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
    content: "サイトパフォーマンスの最適化を実施",
  },
];
