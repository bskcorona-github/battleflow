import { useState, useMemo, useEffect } from "react";
import { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";
import { getSession, useSession } from "next-auth/react";
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

type Props = {
  mcs: (MCRank & {
    hasVoted: boolean;
    voteCount: number;
    comments: CommentWithUser[];
  })[];
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

export default function RankingPage({ mcs: initialMcs }: Props) {
  const { data: session } = useSession();
  const [mcs, setMcs] = useState(initialMcs);
  const [selectedMC, setSelectedMC] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [selectedChartMC, setSelectedChartMC] = useState<MCRank | null>(null);
  const [isAddMCModalOpen, setIsAddMCModalOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // ページネーション関連の状態
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 1ページに10件表示

  // 検索クエリに基づいてMCをフィルタリングするためのmemo
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

  // 現在のページに表示するMCを計算
  const currentMCs = useMemo(() => {
    const indexOfLastMC = currentPage * itemsPerPage;
    const indexOfFirstMC = indexOfLastMC - itemsPerPage;
    return sortedMCs.slice(indexOfFirstMC, indexOfLastMC);
  }, [sortedMCs, currentPage, itemsPerPage]);

  // 総ページ数を計算
  const totalPages = useMemo(
    () => Math.ceil(sortedMCs.length / itemsPerPage),
    [sortedMCs.length, itemsPerPage]
  );

  // ページ変更のハンドラー
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // ページが変わったらページトップにスクロール
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 検索時にページを1に戻す
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // 検索ハンドラー
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

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
                onSearch={handleSearch}
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

          {currentMCs.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {currentMCs.map((mc, index) => (
                <div key={mc.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-gray-800">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </span>
                      <div>
                        <Link
                          href={`/mcs#${mc.name}`}
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

        {/* ページネーションコンポーネント */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

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

export const getServerSideProps: GetServerSideProps = async (context) => {
  // パフォーマンス向上のためにキャッシュヘッダーを設定
  context.res.setHeader(
    "Cache-Control",
    "public, s-maxage=10, stale-while-revalidate=59"
  );

  try {
    // セッションとMCデータを並列で取得
    const session = await getSession(context);

    // ユーザー情報と投票状況を並列で取得
    let user = null;
    let votedMCIds: number[] = [];

    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          isAdmin: true,
        },
      });

      // このユーザーが投票済みのMCを取得
      if (user) {
        const userVotes = await prisma.vote.findMany({
          where: {
            userId: user.id,
          },
          select: {
            mcId: true,
          },
        });
        votedMCIds = userVotes.map((vote) => vote.mcId);
      }
    }

    // MCのランキングデータを取得（必要最小限のデータのみ）
    const mcs = await prisma.mCRank.findMany({
      select: {
        id: true,
        name: true,
        rhymeScore: true,
        vibesScore: true,
        flowScore: true,
        dialogueScore: true,
        musicalityScore: true,
        totalScore: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            votes: true,
          },
        },
        // すべてのコメントを取得
        comments: {
          // take制限を削除してすべてのコメントを取得
          where: {
            parentId: null,
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            mcRankId: true,
            parentId: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true, // emailも取得（編集・削除権限の判定に必要）
              },
            },
            // 返信コメントも取得
            replies: {
              select: {
                id: true,
                content: true,
                createdAt: true,
                updatedAt: true,
                userId: true,
                mcRankId: true,
                parentId: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    email: true, // emailも取得
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        totalScore: "desc",
      },
    });

    // シリアライズ処理を最適化
    const serializedMcs = mcs.map((mc) => {
      // 必要なプロパティのみを含む新しいオブジェクトを作成
      const serializedMC = {
        id: mc.id,
        name: mc.name,
        rhymeScore: mc.rhymeScore,
        vibesScore: mc.vibesScore,
        flowScore: mc.flowScore,
        dialogueScore: mc.dialogueScore,
        musicalityScore: mc.musicalityScore,
        totalScore: mc.totalScore,
        voteCount: mc._count.votes,
        hasVoted: votedMCIds.includes(mc.id),
        createdAt: mc.createdAt.toISOString(),
        updatedAt: mc.updatedAt.toISOString(),
        // コメントと返信コメント情報を含める
        comments: mc.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
          userId: comment.userId,
          mcId: comment.mcRankId,
          parentId: comment.parentId,
          user: {
            id: comment.user.id,
            name: comment.user.name,
            image: comment.user.image,
            email: comment.user.email, // emailを含める
          },
          // 返信コメントを含める
          replies: comment.replies?.map((reply) => ({
            id: reply.id,
            content: reply.content,
            createdAt: reply.createdAt.toISOString(),
            updatedAt: reply.updatedAt.toISOString(),
            userId: reply.userId,
            mcId: reply.mcRankId,
            parentId: reply.parentId,
            user: {
              id: reply.user.id,
              name: reply.user.name,
              image: reply.user.image,
              email: reply.user.email,
            },
          })),
        })),
      };

      return serializedMC;
    });

    // セッション情報も最小限に
    const optimizedSession =
      session && user?.id
        ? {
            expires: session.expires,
            user: {
              id: user.id,
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
              isAdmin: user.isAdmin || false,
            },
          }
        : null;

    return {
      props: {
        mcs: serializedMcs,
        session: optimizedSession,
      },
    };
  } catch (error) {
    console.error("Error fetching MCRanks:", error);
    return {
      props: {
        mcs: [],
        session: null,
        error: "データの取得に失敗しました",
      },
    };
  }
};
