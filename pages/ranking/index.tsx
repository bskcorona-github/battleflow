import { useState, useMemo, useEffect } from "react";
import { prisma } from "@/lib/prisma";
import { useSession } from "next-auth/react";
import RankingVoteForm from "@/components/RankingVoteForm";
import type { MCRank } from "@prisma/client";
import MCScoreChart from "@/components/MCScoreChart";
import Modal from "@/components/Modal";
import AddMCForm from "@/components/AddMCForm";
import toast from "react-hot-toast";
import MCComment from "@/components/MCComment";
import type { CommentWithUser } from "@/types/mc";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import Head from "next/head";
import SearchBar from "@/components/SearchBar";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import RankingExplanation from "@/components/RankingExplanation";
import { useRouter } from "next/router";

type Props = {
  mcs: (MCRank & {
    hasVoted: boolean;
    voteCount: number;
    comments: CommentWithUser[];
  })[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  session: any;
};

type SortKey = "total" | "rhyme" | "vibes" | "flow" | "dialogue" | "musicality";

// スコアキーの型を定義
type ScoreKey =
  | "totalScore"
  | "rhymeScore"
  | "vibesScore"
  | "flowScore"
  | "dialogueScore"
  | "musicalityScore";

// ソートキーとスコアキーのマッピング
const sortKeyToScoreKey: Record<SortKey, ScoreKey> = {
  total: "totalScore",
  rhyme: "rhymeScore",
  vibes: "vibesScore",
  flow: "flowScore",
  dialogue: "dialogueScore",
  musicality: "musicalityScore",
};

// サポート関数
function getSortKeyLabel(key: SortKey): string {
  switch (key) {
    case "total":
      return "総合スコア";
    case "rhyme":
      return "韻";
    case "vibes":
      return "バイブス";
    case "flow":
      return "フロウ";
    case "dialogue":
      return "対応力";
    case "musicality":
      return "音楽性";
    default:
      return key;
  }
}

export default function RankingPage({ mcs: initialMcs, pagination, session }: Props) {
  const router = useRouter();
  const [mcs, setMcs] = useState(initialMcs);
  const [selectedMC, setSelectedMC] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [selectedChartMC, setSelectedChartMC] = useState<MCRank | null>(null);
  const [isAddMCModalOpen, setIsAddMCModalOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isVoteFormOpen, setIsVoteFormOpen] = useState(false);
  const [currentMcId, setCurrentMcId] = useState<number | null>(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(pagination.page);

  // ページ変更時の処理を追加
  const handlePageChange = (page: number) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, page: page.toString() }
    });
  };

  // 現在のページが変わったら自動的にURLも更新
  useEffect(() => {
    if (currentPage !== pagination.page) {
      handlePageChange(currentPage);
    }
  }, [currentPage]);

  // URLのページ番号が変わったら、ステートを更新
  useEffect(() => {
    if (pagination.page !== currentPage) {
      setCurrentPage(pagination.page);
    }
  }, [pagination.page]);

  // 検索クエリに基づいてMCをフィルタリングするためのuseMemo
  const filteredMCs = useMemo(() => {
    if (!searchQuery.trim()) return mcs;

    const query = searchQuery.toLowerCase();
    return mcs.filter((mc) => mc.name.toLowerCase().includes(query));
  }, [mcs, searchQuery]);

  // ソート関数をuseMemo内に移動
  const sortedMCs = useMemo(() => {
    const scoreKey = sortKeyToScoreKey[sortKey];
    return [...filteredMCs].sort((a, b) => b[scoreKey] - a[scoreKey]);
  }, [filteredMCs, sortKey]);

  // 検索時にページを1に戻す
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // 検索結果をクライアントサイドでページネーション
  const currentMCs = useMemo(() => {
    if (searchQuery) {
      const indexOfFirstItem = (currentPage - 1) * pagination.pageSize;
      const indexOfLastItem = indexOfFirstItem + pagination.pageSize;
      return sortedMCs.slice(indexOfFirstItem, indexOfLastItem);
    }
    return sortedMCs;
  }, [sortedMCs, currentPage, searchQuery, pagination.pageSize]);

  // 総ページ数（検索時はクライアントサイドで計算）
  const totalPages = useMemo(() => {
    return searchQuery
      ? Math.ceil(sortedMCs.length / pagination.pageSize)
      : pagination.totalPages;
  }, [sortedMCs.length, searchQuery, pagination.pageSize, pagination.totalPages]);

  const handleVote = async (
    mcId: number,
    scores: {
      rhyme: number;
      vibes: number;
      flow: number;
      dialogue: number;
      musicality: number;
    }
  ) => {
    try {
      const response = await fetch("/api/ranking/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mcId, ...scores }),
      });

      if (!response.ok) throw new Error("投票に失敗しました");

      const updatedMC = await response.json();
      setMcs((prev) =>
        prev.map((mc) =>
          mc.id === mcId ? { ...updatedMC, hasVoted: true } : mc
        )
      );
      setSelectedMC(null);
    } catch (error) {
      console.error("Vote error:", error);
      toast.error("投票に失敗しました。");
    }
  };

  // リセット処理の関数
  const handleReset = async () => {
    if (!session?.user?.isAdmin) return;

    if (
      !confirm(
        "全ての投票データをリセットしますか？\nこの操作は取り消せません。"
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/ranking/reset", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("リセットに失敗しました");
      }

      toast.success("投票データをリセットしました");
      // ページをリロード
      window.location.reload();
    } catch (error) {
      console.error("Reset error:", error);
      toast.error("リセットに失敗しました");
    }
  };

  // MC追加処理
  const handleAddMC = async (name: string) => {
    try {
      const response = await fetch("/api/mcs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "MC追加に失敗しました");
        return;
      }

      // MCRankの情報を取得して状態を更新
      const rankResponse = await fetch(`/api/ranking/${data.id}`);
      const rankData = await rankResponse.json();

      setMcs((prev) => [
        ...prev,
        { ...rankData, hasVoted: false, comments: [] },
      ]);
      setIsAddMCModalOpen(false);
      toast.success("MCを追加しました");
    } catch (error) {
      console.error("Add MC error:", error);
      toast.error("MC追加に失敗しました");
    }
  };

  // コメントの表示/非表示を切り替える関数を追加
  const toggleComments = (mcId: number) => {
    setExpandedComments((prev) =>
      prev.includes(mcId) ? prev.filter((id) => id !== mcId) : [...prev, mcId]
    );
  };

  // handleCommentAddedを修正
  const handleCommentAdded = (newComment: CommentWithUser) => {
    setMcs((prevMcs) =>
      prevMcs.map((prevMc) =>
        prevMc.id === newComment.mcId
          ? {
              ...prevMc,
              comments: [newComment, ...prevMc.comments],
            }
          : prevMc
      )
    );

    if (!expandedComments.includes(newComment.mcId)) {
      toggleComments(newComment.mcId);
    }
  };

  // コメントが更新された時の処理を追加
  const handleCommentUpdated = (
    mcId: number,
    commentId: number,
    newContent: string
  ) => {
    setMcs((prevMcs) =>
      prevMcs.map((prevMc) =>
        prevMc.id === mcId
          ? {
              ...prevMc,
              comments: prevMc.comments.map((comment) =>
                comment.id === commentId
                  ? { ...comment, content: newContent }
                  : comment
              ),
            }
          : prevMc
      )
    );
  };

  // コメントが削除された時の処理を追加
  const handleCommentDeleted = (mcId: number, commentId: number) => {
    setMcs((prevMcs) =>
      prevMcs.map((prevMc) =>
        prevMc.id === mcId
          ? {
              ...prevMc,
              comments: prevMc.comments.filter(
                (comment) => comment.id !== commentId
              ),
            }
          : prevMc
      )
    );
  };

  const handleResetComments = async () => {
    if (
      !confirm(
        "全てのコメントをリセットします。この操作は取り消せません。続行しますか？"
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/ranking/reset-comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "リセットに失敗しました");
      }

      // コメントをリセット
      setMcs((prevMcs) =>
        prevMcs.map((prevMc) => ({
          ...prevMc,
          comments: [],
        }))
      );

      toast.success("コメントを全てリセットしました");
    } catch (error) {
      console.error("Error resetting comments:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "コメントのリセットに失敗しました"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <Head>
        <title>
          MCバトル公式ランキング | 日本人気ラッパー最新評価・投票 |
          MCバトルビューワー
        </title>
        <meta
          name="description"
          content="日本最大のMCバトル選手ランキング！ファン投票による最新の人気MC評価を「韻」「フロー」「バイブス」「対話力」「音楽性」の5項目で分析。あなたの推しMCに投票して応援しよう！UMB、フリスタ出場者など多数掲載。"
        />
        <meta
          name="keywords"
          content="MCバトル,MCランキング,人気ラッパー,日本語ラップ,MCバトル投票,フリースタイルバトル,ヒップホップ,UMB,フリースタイルダンジョン,韻,フロー"
        />
      </Head>
      <div className="container mx-auto px-4">
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold text-black">MCランキング</h1>
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <SearchBar
                placeholder="MC名で検索..."
                onSearch={setSearchQuery}
                className="w-full md:w-64"
              />
              <div className="flex flex-wrap gap-2">
                {Object.keys(sortKeyToScoreKey).map((key) => (
                  <button
                    key={key}
                    onClick={() => setSortKey(key as SortKey)}
                    className={`px-3 py-1.5 rounded text-sm ${
                      sortKey === key
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {getSortKeyLabel(key as SortKey)}
                  </button>
                ))}
                {session?.user?.isAdmin && (
                  <>
                    <button
                      onClick={() => setIsAddMCModalOpen(true)}
                      className="px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      MC追加
                    </button>
                    <button
                      onClick={handleReset}
                      className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      投票リセット
                    </button>
                    <button
                      onClick={handleResetComments}
                      className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      コメントリセット
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ランキング説明コンポーネント */}
          <RankingExplanation />

          {currentMCs.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {currentMCs.map((mc, index) => (
                <div key={mc.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-gray-800">
                        {(currentPage - 1) * pagination.pageSize + index + 1}
                      </span>
                      <div>
                        <Link
                          href={`/mcs/${mc.id}`}
                          className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors group"
                        >
                          <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                            {mc.name}
                          </h2>
                          <svg
                            className="w-4 h-4 text-gray-400 group-hover:text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </Link>
                        {/* 投票数を表示 */}
                        <span className="text-xs text-gray-600">
                          投票数: {mc.voteCount}票
                        </span>
                      </div>
                    </div>
                    {session && !mc.hasVoted && (
                      <button
                        onClick={() => setSelectedMC(mc.id)}
                        className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        投票する
                      </button>
                    )}
                  </div>

                  {/* スコア表示 */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-xs font-medium text-gray-700">
                        総合スコア
                      </div>
                      <div className="text-base font-bold text-gray-900">
                        {mc.totalScore.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-xs font-medium text-gray-700">
                        韻
                      </div>
                      <div className="text-base font-bold text-gray-900">
                        {mc.rhymeScore.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-xs font-medium text-gray-700">
                        バイブス
                      </div>
                      <div className="text-base font-bold text-gray-900">
                        {mc.vibesScore.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-xs font-medium text-gray-700">
                        フロー
                      </div>
                      <div className="text-base font-bold text-gray-900">
                        {mc.flowScore.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-xs font-medium text-gray-700">
                        対話
                      </div>
                      <div className="text-base font-bold text-gray-900">
                        {mc.dialogueScore.toFixed(1)}
                      </div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-xs font-medium text-gray-700">
                        音楽性
                      </div>
                      <div className="text-base font-bold text-gray-900">
                        {mc.musicalityScore.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* チャート表示ボタン */}
                  <div className="mt-3 flex justify-center">
                    <button
                      onClick={() => setSelectedChartMC(mc)}
                      className="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded hover:bg-indigo-600 transition-colors"
                    >
                      スコアチャートを表示
                    </button>
                  </div>

                  {/* 投票フォーム */}
                  {selectedMC === mc.id && (
                    <div className="mt-4">
                      <RankingVoteForm
                        mcId={mc.id}
                        onSubmit={(scores) => handleVote(mc.id, scores)}
                      />
                    </div>
                  )}

                  {/* コメントセクション */}
                  <div className="mt-4 border-t pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      コメント
                    </h3>
                    <MCComment
                      mcId={mc.id}
                      comments={mc.comments}
                      onCommentAdded={handleCommentAdded}
                      onCommentUpdated={(commentId, newContent) =>
                        handleCommentUpdated(mc.id, commentId, newContent)
                      }
                      onCommentDeleted={(commentId) =>
                        handleCommentDeleted(mc.id, commentId)
                      }
                      type="ranking"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              {searchQuery ? (
                <p className="text-gray-500">
                  「{searchQuery}」に一致するMCが見つかりませんでした。
                </p>
              ) : (
                <p className="text-gray-500">MCが見つかりませんでした。</p>
              )}
            </div>
          )}
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {/* MC追加モーダル */}
        <Modal
          isOpen={isAddMCModalOpen}
          onClose={() => setIsAddMCModalOpen(false)}
          title="新しいMCを追加"
        >
          <AddMCForm
            onSubmit={handleAddMC}
            onCancel={() => setIsAddMCModalOpen(false)}
          />
        </Modal>

        {/* レーダーチャートモーダル */}
        <Modal
          isOpen={selectedChartMC !== null}
          onClose={() => setSelectedChartMC(null)}
          title={`${selectedChartMC?.name}のスコア分布`}
        >
          {selectedChartMC && (
            <MCScoreChart
              scores={{
                rhymeScore: selectedChartMC.rhymeScore,
                vibesScore: selectedChartMC.vibesScore,
                flowScore: selectedChartMC.flowScore,
                dialogueScore: selectedChartMC.dialogueScore,
                musicalityScore: selectedChartMC.musicalityScore,
              }}
            />
          )}
        </Modal>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  try {
    // パフォーマンス計測開始
    const startTime = Date.now();

    console.log("ランキングページのMC情報を取得中...");

    // ページネーション用のパラメータ
    const page = parseInt(context.query.page as string) || 1;
    const pageSize = 20; // 1ページあたりの表示件数

    // 総件数を取得
    const totalCount = await prisma.mCRank.count();

    // 必要なデータだけを選択して取得する
    const rankings = await prisma.mCRank.findMany({
      orderBy: {
        totalScore: "desc",
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        name: true,
        totalScore: true,
        rhymeScore: true,
        vibesScore: true,
        flowScore: true,
        dialogueScore: true,
        musicalityScore: true,
        voteCount: true,
        // ユーザーが投票済みかどうかのみを確認
        votes: session && session.user?.id
          ? {
              where: {
                userId: session.user.id,
              },
              select: {
                userId: true,
              },
              take: 1, // 1件あれば十分
            }
          : false,
        // コメント数のみを取得
        _count: {
          select: {
            comments: true
          }
        },
      },
    });

    // 処理時間計測
    const processingTime = Date.now() - startTime;
    console.log(
      `ランキングページデータ取得時間: ${processingTime}ms, MC数: ${rankings.length}件`
    );

    // Prismaの日付をシリアライズ可能な形式に変換
    const serializedRankings = rankings.map((mcRank) => ({
      ...mcRank,
      // コメントは最初は取得しない（必要時に別APIで取得）
      comments: [],
      commentsCount: mcRank._count?.comments || 0,
      // セッションユーザーが投票済みかどうかをチェック
      hasVoted: session && session.user?.id ? mcRank.votes && mcRank.votes.length > 0 : false,
    }));

    return {
      props: {
        session,
        mcs: serializedRankings,
        pagination: {
          total: totalCount,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      },
    };
  } catch (error) {
    console.error("Error fetching MCs for ranking:", error);
    return {
      props: {
        session,
        mcs: [],
        pagination: {
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0
        },
        error: "MCデータの取得に失敗しました",
      },
    };
  }
}
