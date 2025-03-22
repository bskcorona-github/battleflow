import { GetServerSideProps } from "next";
import { prisma } from "../../lib/prisma";
import { useState, useMemo, useEffect } from "react";
import MCCard from "@/components/MCCard";
import { getSession, useSession } from "next-auth/react";
import type { MCWithLikesAndComments, CommentWithUser } from "@/types/mc";
import Image from "next/image";
import React from "react";
import { toast } from "react-hot-toast";
import CommentReply from "@/components/CommentReply";
import DOMPurify from "isomorphic-dompurify";
import Pagination from "@/components/Pagination";
import Head from "next/head";

type Props = {
  mcs: MCWithLikesAndComments[];
  session: {
    expires: string | null;
    user: {
      name: string | null;
      email: string | null;
      image: string | null;
      id: string | null;
    } | null;
  } | null;
};

// MCViewerコンポーネントを作成
type MCViewerProps = {
  mc: MCWithLikesAndComments;
  viewMode: "grid" | "table";
  onLike: (mcId: number) => void;
  onComment: (mcId: number, content: string) => Promise<CommentWithUser>;
  session: {
    expires: string | null;
    user: {
      name: string | null;
      email: string | null;
      image: string | null;
      id: string | null;
    } | null;
  } | null;
  expandedComments: number[];
  toggleComments: (mcId: number) => void;
  setMcs: React.Dispatch<React.SetStateAction<MCWithLikesAndComments[]>>;
  handleEditComment: (commentId: number, content: string) => Promise<void>;
  handleDeleteComment: (commentId: number) => Promise<void>;
  handleReply: (
    commentId: number,
    content: string,
    replyToUser?: string
  ) => Promise<void>;
};

const MCViewer = ({
  mc,
  viewMode,
  onLike,
  onComment,
  expandedComments,
  toggleComments,
  setMcs,
  handleEditComment,
  handleDeleteComment,
  handleReply,
}: Omit<MCViewerProps, "session">) => {
  const { data: sessionData } = useSession();
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [hasLoadedAllComments, setHasLoadedAllComments] = useState(false);

  // HTMLをサニタイズして安全にレンダリングする関数
  const createSanitizedHTML = (html: string) => {
    const sanitizedHTML = DOMPurify.sanitize(html);
    return { __html: sanitizedHTML };
  };

  // コメント展開時に全コメントを読み込む
  useEffect(() => {
    const isExpanded = expandedComments.includes(mc.id);
    if (
      isExpanded &&
      mc.comments.length > 0 &&
      !hasLoadedAllComments &&
      !isLoadingComments
    ) {
      const fetchAllComments = async () => {
        setIsLoadingComments(true);
        try {
          const response = await fetch(`/api/mcs/fetch-comments?mcId=${mc.id}`);
          if (response.ok) {
            const comments = await response.json();
            // MCsの状態を更新
            setMcs((prevMcs) =>
              prevMcs.map((prevMc) =>
                prevMc.id === mc.id ? { ...prevMc, comments } : prevMc
              )
            );
            setHasLoadedAllComments(true);
          } else {
            console.error("コメント取得エラー:", await response.text());
          }
        } catch (error) {
          console.error("コメント読み込みエラー:", error);
        } finally {
          setIsLoadingComments(false);
        }
      };

      fetchAllComments();
    }
  }, [
    expandedComments,
    mc.id,
    mc.comments.length,
    hasLoadedAllComments,
    isLoadingComments,
    setMcs,
  ]);

  // テーブル表示の場合のJSXを修正
  if (viewMode === "table") {
    return (
      <React.Fragment>
        <tr className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="flex items-center">
              {mc.image && mc.image !== "NULL" && mc.image !== "[NULL]" ? (
                <div className="relative w-10 h-10 mr-3">
                  <Image
                    src={`/images/mcs/${encodeURIComponent(mc.image)}`}
                    alt={mc.name}
                    fill
                    sizes="40px"
                    className="rounded-full object-cover"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      // 親要素を取得
                      const parent = img.parentElement;
                      if (parent) {
                        // 親要素のスタイルを維持しながら内容を置き換え
                        parent.innerHTML = `<div class="flex items-center justify-center w-full h-full bg-gray-200 rounded-full">
                          <span class="text-gray-600 font-medium text-xs">${mc.name
                            .substring(0, 2)
                            .toUpperCase()}</span>
                        </div>`;
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-10 h-10 mr-3 bg-gray-200 rounded-full">
                  <span className="text-gray-600 font-medium text-xs">
                    {mc.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="text-sm font-medium text-gray-900">{mc.name}</div>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-500">{mc.hood || "-"}</div>
          </td>
          <td className="px-6 py-4">
            <div
              className="text-sm text-gray-500"
              dangerouslySetInnerHTML={createSanitizedHTML(
                mc.description || "-"
              )}
            />
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <div className="flex justify-center items-center">
              <button
                onClick={() => onLike(mc.id)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
                  mc.isLikedByUser
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill={mc.isLikedByUser ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{mc.likesCount}</span>
              </button>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <div className="flex justify-center items-center">
              <button
                onClick={() => toggleComments(mc.id)}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>
                  {mc.comments.reduce(
                    (total: number, comment: CommentWithUser) =>
                      total + 1 + (comment.replies?.length || 0),
                    0
                  )}
                </span>
              </button>
            </div>
          </td>
        </tr>
        {expandedComments.includes(mc.id) && (
          <tr>
            <td colSpan={5} className="px-6 py-4 bg-gray-50">
              <div className="space-y-4">
                {sessionData && (
                  <div className="flex gap-3 items-start">
                    {/* ログインユーザーのアバター */}
                    {sessionData.user?.image && (
                      <div className="flex-shrink-0">
                        <Image
                          src={sessionData.user.image}
                          alt={sessionData.user.name || "User"}
                          width={32}
                          height={32}
                          className="rounded-full"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = "/images/default-avatar.png";
                          }}
                          unoptimized
                        />
                      </div>
                    )}
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const content = (
                          form.elements.namedItem(
                            "content"
                          ) as HTMLTextAreaElement
                        ).value;
                        if (!content.trim()) return;

                        try {
                          const newComment = await onComment(mc.id, content);
                          form.reset();
                          setMcs((prevMcs) =>
                            prevMcs.map((prevMc) =>
                              prevMc.id === mc.id
                                ? {
                                    ...prevMc,
                                    comments: [newComment, ...prevMc.comments],
                                  }
                                : prevMc
                            )
                          );
                        } catch (error) {
                          console.error("Error posting comment:", error);
                        }
                      }}
                      className="flex-1 space-y-2"
                    >
                      <textarea
                        name="content"
                        placeholder="コメントを入力..."
                        className="w-full p-2 border rounded-md"
                        rows={3}
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        コメントを投稿
                      </button>
                    </form>
                  </div>
                )}

                {/* コメント読み込み中の表示 */}
                {isLoadingComments && (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-600">
                      コメントを読み込み中...
                    </span>
                  </div>
                )}

                {/* コメント一覧 */}
                <div className="space-y-4">
                  {mc.comments
                    .filter(
                      (comment: CommentWithUser) => comment.parentId === null
                    )
                    .map((comment: CommentWithUser) => (
                      <div
                        key={comment.id}
                        className="bg-white p-4 rounded-lg shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {comment.user.image && (
                              <Image
                                src={comment.user.image}
                                alt={comment.user.name || "User"}
                                width={32}
                                height={32}
                                className="rounded-full"
                                onError={(e) => {
                                  const img = e.target as HTMLImageElement;
                                  img.src = "/images/default-avatar.png";
                                }}
                                unoptimized
                              />
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {comment.user.name || "Anonymous"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          {/* 編集・削除ボタン */}
                          {sessionData?.user?.id === comment.userId && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditContent(comment.content);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("このコメントを削除しますか？")) {
                                    handleDeleteComment(comment.id);
                                  }
                                }}
                                className="text-sm text-red-600 hover:text-red-800"
                              >
                                削除
                              </button>
                            </div>
                          )}
                        </div>
                        {editingCommentId === comment.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full p-2 border rounded-md"
                              rows={3}
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditContent("");
                                }}
                                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                              >
                                キャンセル
                              </button>
                              <button
                                onClick={async () => {
                                  if (
                                    editContent.trim() &&
                                    editContent !== comment.content
                                  ) {
                                    await handleEditComment(
                                      comment.id,
                                      editContent
                                    );
                                  }
                                  setEditingCommentId(null);
                                  setEditContent("");
                                }}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                保存
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        )}

                        {/* 返信コンポーネントを追加 */}
                        <div className="mt-4">
                          <CommentReply
                            comment={comment}
                            onReply={handleReply}
                            handleEditComment={handleEditComment}
                            handleDeleteComment={handleDeleteComment}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  }
};

// ソートの種類を定義を更新
type SortType =
  | "name"
  | "nameReverse"
  | "likes"
  | "likesReverse"
  | "comments"
  | "commentsReverse";

// コメント総数を計算する関数の型を修正
const getTotalCommentsCount = (comments: CommentWithUser[]): number => {
  return comments.reduce((total: number, comment: CommentWithUser) => {
    return total + 1 + (comment.replies?.length || 0);
  }, 0);
};

// ソート関数を更新
const sortMCs = (mcs: MCWithLikesAndComments[], sortType: SortType) => {
  const sortedMCs = [...mcs];
  switch (sortType) {
    case "name":
      return sortedMCs.sort((a, b) => a.name.localeCompare(b.name, "ja"));
    case "nameReverse":
      return sortedMCs.sort((a, b) => b.name.localeCompare(a.name, "ja"));
    case "likes":
      return sortedMCs.sort((a, b) => b.likesCount - a.likesCount);
    case "likesReverse":
      return sortedMCs.sort((a, b) => a.likesCount - b.likesCount);
    case "comments":
      return sortedMCs.sort(
        (a, b) =>
          getTotalCommentsCount(b.comments) - getTotalCommentsCount(a.comments)
      );
    case "commentsReverse":
      return sortedMCs.sort(
        (a, b) =>
          getTotalCommentsCount(a.comments) - getTotalCommentsCount(b.comments)
      );
    default:
      return sortedMCs;
  }
};

export default function MCList({ mcs: initialMcs }: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortType, setSortType] = useState<SortType>("name");
  const [mcs, setMcs] = useState(initialMcs);
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  // いいね処理の連打防止用の状態 - フックを他のフックと同じレベルに移動
  const [likingMcIds, setLikingMcIds] = useState<Set<number>>(new Set());

  // ページネーション関連の状態
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 3の倍数

  // ソートされたMCsを取得
  const sortedMCs = useMemo(() => sortMCs(mcs, sortType), [mcs, sortType]);

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

  // 管理者権限チェック
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch(
            `/api/user/check-admin?email=${session.user.email}`
          );
          const data = await response.json();
          setIsAdmin(data.isAdmin);
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      }
    };
    checkAdminStatus();
  }, [session]);

  // リセット処理関数を修正
  const handleReset = async () => {
    if (
      !confirm(
        "全てのコメントといいねをリセットします。この操作は取り消せません。続行しますか？"
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/mc/reset", {
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

      // 成功したら全MCのコメントといいねをリセット
      setMcs((prevMcs) =>
        prevMcs.map((mc) => ({
          ...mc,
          comments: [],
          likes: [],
          likesCount: 0,
          isLikedByUser: false,
        }))
      );

      toast.success("コメントといいねを全てリセットしました");
    } catch (error) {
      console.error("Error resetting:", error);
      toast.error(
        error instanceof Error ? error.message : "リセットに失敗しました"
      );
    }
  };

  if (!session) {
    return <p>コメントするにはログインしてください</p>;
  }

  // コメントの編集処理
  const handleEditComment = async (commentId: number, content: string) => {
    try {
      const response = await fetch(`/api/mc/comment/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error("コメントの更新に失敗しました");
      }

      const updatedComment = await response.json();

      // MCsの状態を更新
      setMcs((prevMcs) =>
        prevMcs.map((mc) => ({
          ...mc,
          comments: mc.comments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  content: updatedComment.content,
                  updatedAt: updatedComment.updatedAt,
                }
              : comment
          ),
        }))
      );

      toast.success("コメントを更新しました");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("コメントの更新に失敗しました");
    }
  };

  // コメントの削除処理
  const handleDeleteComment = async (commentId: number) => {
    try {
      const response = await fetch(`/api/mc/comment/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("コメントの削除に失敗しました");
      }

      // MCsの状態を更新
      setMcs((prevMcs) =>
        prevMcs.map((mc) => ({
          ...mc,
          comments: mc.comments.filter((comment) => comment.id !== commentId),
        }))
      );

      toast.success("コメントを削除しました");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("コメントの削除に失敗しました");
    }
  };

  // コメントの返信処理
  const handleReply = async (
    commentId: number,
    content: string,
    replyToUser?: string
  ) => {
    try {
      const response = await fetch(`/api/mcs/comment/${commentId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, replyToUser }),
      });

      if (!response.ok) {
        throw new Error("返信の投稿に失敗しました");
      }

      const newReply = await response.json();

      // MCsの状態を更新
      setMcs((prevMcs) =>
        prevMcs.map((mc) => ({
          ...mc,
          comments: mc.comments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  replies: [...(comment.replies || []), newReply],
                }
              : comment
          ),
        }))
      );

      toast.success("返信を投稿しました");
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error("返信の投稿に失敗しました");
    }
  };

  // いいね処理
  const handleLike = async (mcId: number) => {
    if (!session) {
      toast.error("いいねするにはログインが必要です");
      return;
    }

    // 確実にセッションIDが存在することを確認
    if (!session.user?.id) {
      toast.error("セッション情報が不足しています。再ログインしてください");
      return;
    }

    // 連打防止: すでに処理中なら何もしない
    if (likingMcIds.has(mcId)) {
      console.log(`MC ID ${mcId} のいいね処理が進行中です`);
      return;
    }

    // 処理中フラグを設定
    setLikingMcIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(mcId);
      return newSet;
    });

    // 対象のMCを検索
    const targetMc = mcs.find((mc) => mc.id === mcId);
    if (!targetMc) return;

    // 現在の状態を記録
    const wasLiked = targetMc.isLikedByUser;
    const originalLikesCount = targetMc.likesCount;

    // 楽観的UI更新: UIを即座に更新
    setMcs((prevMcs) =>
      prevMcs.map((mc) =>
        mc.id === mcId
          ? {
              ...mc,
              isLikedByUser: !wasLiked,
              likesCount: originalLikesCount + (wasLiked ? -1 : 1),
            }
          : mc
      )
    );

    try {
      // オプティミスティックUI更新をするための処理がすでに上部で完了しているので、
      // ここからはバックエンドとの同期処理を行う

      // デバウンスのためにリクエスト発行を少し遅延
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒タイムアウト

      // APIリクエストを非同期で実行
      const response = await fetch(`/api/mc/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mcId }),
        credentials: "include", // クッキーを含める
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // レスポンスデータを取得
      const data = await response
        .json()
        .catch(() => ({ error: "レスポンスの解析に失敗しました" }));

      if (!response.ok) {
        // ステータスコードが200系でない場合
        throw new Error(data.error || "いいねの処理に失敗しました");
      }

      // サーバー側でユニーク制約エラーが正常に処理されていれば、
      // data.liked と data.likesCount が提供される

      // APIレスポンスで正確な値に更新
      setMcs((prevMcs) =>
        prevMcs.map((mc) =>
          mc.id === mcId
            ? {
                ...mc,
                isLikedByUser: data.liked,
                likesCount: data.likesCount,
              }
            : mc
        )
      );

      // ユーザーにフィードバックを表示
      if (data.message) {
        toast.success(data.message);
      }
    } catch (error) {
      console.error("Error liking MC:", error);
      // エラー時は元の状態に戻す
      setMcs((prevMcs) =>
        prevMcs.map((mc) =>
          mc.id === mcId
            ? {
                ...mc,
                isLikedByUser: wasLiked,
                likesCount: originalLikesCount,
              }
            : mc
        )
      );

      if (error instanceof DOMException && error.name === "AbortError") {
        toast.error("タイムアウトしました。ネットワーク接続を確認してください");
      } else {
        toast.error(
          error instanceof Error ? error.message : "いいねの処理に失敗しました"
        );
      }
    } finally {
      // 処理が完了したらフラグを解除
      setLikingMcIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(mcId);
        return newSet;
      });
    }
  };

  // コメントの投稿処理
  const handleComment = async (mcId: number, content: string) => {
    if (!session) {
      toast.error("コメントするにはログインが必要です");
      return null;
    }

    try {
      const response = await fetch("/api/mcs/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mcId, content }),
      });

      if (!response.ok) {
        throw new Error("コメントの投稿に失敗しました");
      }

      const newComment = await response.json();

      // MCsの状態を更新
      setMcs((prevMcs) =>
        prevMcs.map((mc) =>
          mc.id === mcId
            ? {
                ...mc,
                comments: [
                  {
                    ...newComment,
                    user: {
                      id: session.user.id,
                      name: session.user.name,
                      email: session.user.email,
                      image: session.user.image,
                    },
                    replies: [],
                    parentId: null,
                    userId: session.user.id,
                    mcId: mcId,
                  },
                  ...mc.comments,
                ],
              }
            : mc
        )
      );

      toast.success("コメントを投稿しました");
      return {
        ...newComment,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        },
        replies: [],
        parentId: null,
        userId: session.user.id,
        mcId: mcId,
      };
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("コメントの投稿に失敗しました");
      return null;
    }
  };

  // コメントの表示/非表示を切り替え
  const toggleComments = (mcId: number) => {
    setExpandedComments((prev) =>
      prev.includes(mcId) ? prev.filter((id) => id !== mcId) : [...prev, mcId]
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>
          MCバトル選手一覧 | 人気ラッパープロフィール・最新情報 |
          MCバトルビューワー
        </title>
        <meta
          name="description"
          content="日本全国のMCバトル出場選手プロフィール一覧。UMB、フリースタイルダンジョン、高校生ラップ選手権などの人気大会出場者のプロフィール、活動情報、ファン評価を掲載。お気に入りのMCにいいね・コメントで応援しよう！"
        />
        <meta
          name="keywords"
          content="MCバトル,MC一覧,バトルMC,ラッパー,日本語ラップ,UMB,フリースタイルダンジョン,プロフィール,人気ランキング,フリースタイル"
        />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">MC一覧</h1>
          <div className="flex gap-4">
            {/* 管理者用リセットボタン */}
            {isAdmin && (
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                全コメント・いいねをリセット
              </button>
            )}
            {/* ソート選択 */}
            <select
              value={sortType}
              onChange={(e) => {
                setSortType(e.target.value as SortType);
                setCurrentPage(1); // ソートが変わったら最初のページに戻る
              }}
              className="px-4 py-2 rounded border bg-white text-gray-700"
            >
              <option value="name">名前 (A-Z, あ-ん)</option>
              <option value="nameReverse">名前 (Z-A, ん-あ)</option>
              <option value="likes">いいね (多い順)</option>
              <option value="likesReverse">いいね (少ない順)</option>
              <option value="comments">コメント (多い順)</option>
              <option value="commentsReverse">コメント (少ない順)</option>
            </select>
            {/* 表示切り替えボタン */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                グリッド表示
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                テーブル表示
              </button>
            </div>
          </div>
        </div>

        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center items-start"
              : ""
          }
        >
          {viewMode === "grid" ? (
            currentMCs.map((mc) => (
              <div
                key={mc.id}
                id={mc.name}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200 w-[400px] scroll-mt-8 target:ring-2 target:ring-blue-500"
              >
                <MCCard
                  mc={mc}
                  onLike={handleLike}
                  onComment={handleComment}
                  handleEditComment={handleEditComment}
                  handleDeleteComment={handleDeleteComment}
                  handleReply={handleReply}
                  expandedComments={expandedComments}
                  toggleComments={toggleComments}
                  setMcs={setMcs}
                />
              </div>
            ))
          ) : (
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名前
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    地域
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    説明
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    いいね
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    コメント
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentMCs.map((mc) => (
                  <MCViewer
                    key={mc.id}
                    mc={mc}
                    viewMode={viewMode}
                    onLike={handleLike}
                    onComment={handleComment}
                    expandedComments={expandedComments}
                    toggleComments={toggleComments}
                    setMcs={setMcs}
                    handleEditComment={handleEditComment}
                    handleDeleteComment={handleDeleteComment}
                    handleReply={handleReply}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ページネーションコンポーネント */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  // パフォーマンス向上のためにキャッシュヘッダーを設定
  // 10秒間キャッシュして、59秒間は古いキャッシュを再検証しながら使用
  context.res.setHeader(
    "Cache-Control",
    "public, s-maxage=10, stale-while-revalidate=59"
  );

  try {
    // 並列でセッションとMCデータを取得するように最適化
    const [session, totalCount] = await Promise.all([
      getSession(context),
      prisma.mC.count(),
    ]);

    // セッションがある場合のみユーザー情報を取得
    let user = null;
    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          isAdmin: true,
        },
      });
    }

    // データベースクエリを最適化
    const mcs = await prisma.mC.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        hood: true,
        likesCount: true,
        commentsCount: true,
        // 初期表示に必要ないフィールドは除外
        description: false,
        affiliation: true,
        // 日付はクライアント側での整形に必要なもののみ
        createdAt: true,
        updatedAt: true,
        // いいね情報は最小限に
        likes:
          session && user?.id
            ? {
                where: { userId: user.id },
                select: { id: true },
                take: 1,
              }
            : false,
        // すべてのコメントを取得
        comments: {
          orderBy: { createdAt: "desc" },
          // take制限を削除してすべてのコメントを取得
          where: { parentId: null },
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            mcId: true,
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
                mcId: true,
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
        },
      },
      orderBy: [{ likesCount: "desc" }, { commentsCount: "desc" }],
    });

    // JSONシリアライズを効率化（余分なデータを除外）
    const serializedMcs = mcs.map((mc) => {
      // 必要なプロパティのみ抽出して新しいオブジェクトを作成
      const serializedMC = {
        id: mc.id,
        name: mc.name,
        image: mc.image,
        hood: mc.hood,
        affiliation: mc.affiliation,
        description: null, // 必要に応じて後から取得
        likesCount: mc.likesCount,
        commentsCount: mc.commentsCount,
        isLikedByUser: session && user?.id ? mc.likes.length > 0 : false,
        createdAt: mc.createdAt.toISOString(),
        updatedAt: mc.updatedAt.toISOString(),
        // コメントを最小限の情報に絞る
        comments: mc.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
          userId: comment.userId,
          mcId: comment.mcId,
          parentId: null,
          user: {
            id: comment.user.id,
            name: comment.user.name,
            image: comment.user.image,
            email: comment.user.email,
          },
          replies: comment.replies?.map((reply) => ({
            id: reply.id,
            content: reply.content,
            createdAt: reply.createdAt.toISOString(),
            updatedAt: reply.updatedAt.toISOString(),
            userId: reply.userId,
            mcId: reply.mcId,
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
        totalCount,
        session: optimizedSession,
      },
    };
  } catch (error) {
    console.error("Error fetching MCs:", error);
    return {
      props: {
        mcs: [],
        totalCount: 0,
        session: null,
        error: "データの取得に失敗しました",
      },
    };
  }
};
