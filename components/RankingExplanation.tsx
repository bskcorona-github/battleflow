import React, { useState } from "react";

/**
 * MCランキングの説明コンポーネント
 * ベイズ推定を使った集計方法や投票の仕組みを説明します
 */
const RankingExplanation: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-5 mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-900">
          ランキングについて
        </h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center"
        >
          {isExpanded ? (
            <>
              <span>閉じる</span>
              <svg
                className="ml-1 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 15l7-7 7 7"
                ></path>
              </svg>
            </>
          ) : (
            <>
              <span>詳細を見る</span>
              <svg
                className="ml-1 w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </>
          )}
        </button>
      </div>

      <div
        className={`text-gray-700 text-sm space-y-3 ${
          isExpanded ? "block" : "hidden"
        }`}
      >
        <p>
          このランキングは、ファンによる投票を集計してMCの実力を5つの観点から評価したものです。
          単純な平均値ではなく、<strong>ベイズ推定</strong>
          によって統計的に妥当な順位付けを行っています。
        </p>

        <h3 className="font-medium text-gray-900 mt-4">評価項目</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>韻</strong>
            ：韻の技術、言葉遊びのセンス、韻の深さと構成の評価
          </li>
          <li>
            <strong>フロー</strong>
            ：リズム感、テンポのコントロール、ビートとの一体感
          </li>
          <li>
            <strong>バイブス</strong>
            ：パフォーマンス力、雰囲気作り、会場を沸かせる能力
          </li>
          <li>
            <strong>対話力</strong>
            ：相手の言葉への反応、掘り返し、切り返しの巧みさ
          </li>
          <li>
            <strong>音楽性</strong>
            ：声質、メロディセンス、聴きやすさ、音楽的完成度
          </li>
        </ul>

        <h3 className="font-medium text-gray-900 mt-4">ベイズ推定について</h3>
        <p>
          一般的な平均点だけでは、投票数の少ないMCが極端に高い（または低い）点数になる傾向があります。
          そこで当サイトでは、事前情報（全体の平均）と実際の評価を組み合わせたベイズ推定を採用。
          投票数が少ないMCは全体平均に近い値に調整され、投票数が増えるほど実際の評価が反映される仕組みです。
        </p>

        <h3 className="font-medium text-gray-900 mt-4">投票の仕組み</h3>
        <p>
          1人のユーザーが1つのMCに対して1回のみ投票できます。各項目を1〜10点で評価し、
          その平均値がMCの総合スコアとなります。一度投票すると変更はできませんので、慎重に評価してください。
        </p>

        <p className="mt-4 text-gray-500 italic">
          ※投票にはアカウント登録が必要です。公平性を保つため、同一ユーザーからの複数アカウントによる投票は無効となる場合があります。
        </p>
      </div>

      <div
        className={`text-gray-700 text-sm ${isExpanded ? "hidden" : "block"}`}
      >
        このランキングはファン投票による評価を<strong>ベイズ推定</strong>
        を使って集計し、
        MCの実力を「韻」「フロー」「バイブス」「対話力」「音楽性」の5項目で分析しています。
        <span className="text-blue-600">詳細を見る</span>
        をクリックすると、ランキングの仕組みについて詳しく解説します。
      </div>
    </div>
  );
};

export default RankingExplanation;
