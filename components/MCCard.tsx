import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { MCWithLikesAndComments, CommentWithUser } from "@/types/mc";
// import CommentItem from "./CommentItem"; // 未使用のインポートをコメントアウト
import { toast } from "react-hot-toast";
import CommentReply from "./CommentReply";
import DOMPurify from "isomorphic-dompurify";

type MCCardProps = {
  mc: MCWithLikesAndComments;
  onLike: (mcId: number) => void;
  onComment: (mcId: number, content: string) => Promise<CommentWithUser>;
  handleEditComment: (commentId: number, content: string) => Promise<void>;
  handleDeleteComment: (commentId: number) => Promise<void>;
  handleReply: (commentId: number, content: string) => Promise<void>;
  expandedComments: number[];
  toggleComments: (mcId: number) => void;
  setMcs: React.Dispatch<React.SetStateAction<MCWithLikesAndComments[]>>;
};

export default function MCCard({
  mc,
  onLike,
  onComment,
  handleEditComment,
  handleDeleteComment,
  handleReply,
  expandedComments,
  toggleComments,
  setMcs,
}: MCCardProps) {
  const { data: session } = useSession();
  const [commentContent, setCommentContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  // 未使用の変数をコメントアウト
  // const [currentPageNumber, setCurrentPageNumber] = useState(1);

  // showCommentsの状態をexpandedCommentsから取得
  const isExpanded = expandedComments.includes(mc.id);

  // コメント全体を読み込むための状態
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [hasLoadedAllComments, setHasLoadedAllComments] = useState(false);

  // デバッグログは開発環境でのみ出力
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("MC Card rendered:", mc.id);
    }
  }, [mc.id]);

  const handleLikeClick = () => {
    if (!session) {
      toast.error("いいねするにはログインが必要です");
      return;
    }

    // セッションIDが存在することを確認
    if (!session.user?.id) {
      toast.error("セッション情報が不足しています。再ログインしてください");
      return;
    }

    // 親コンポーネントに処理を委任
    onLike(mc.id);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !commentContent.trim()) return;

    try {
      const response = await onComment(mc.id, commentContent);
      // 新しいコメントをcommentsステートに追加
      mc.comments = [response, ...mc.comments];
      setCommentContent("");
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  // コメント総数を計算する関数を追加
  const getTotalCommentsCount = (comments: CommentWithUser[]): number => {
    return comments.reduce((total, comment) => {
      // 親コメント + 返信の数を再帰的に計算
      return total + 1 + (comment.replies?.length || 0);
    }, 0);
  };

  // HTMLをサニタイズして安全にレンダリングする関数
  const createSanitizedHTML = (html: string) => {
    const sanitizedHTML = DOMPurify.sanitize(html);
    return { __html: sanitizedHTML };
  };

  // セッション関連の処理
  const isCurrentUserComment = (comment: CommentWithUser) => {
    return session?.user?.email === comment.user.email;
  };

  // コメントキャッシュのキー
  const commentsStorageKey = `mc-comments-${mc.id}`;
  // キャッシュの有効期限(15分)
  const CACHE_EXPIRY = 15 * 60 * 1000;

  // コメント展開時に全コメントを読み込む
  useEffect(() => {
    const isExpanded = expandedComments.includes(mc.id);
    if (isExpanded && !hasLoadedAllComments && !isLoadingComments) {
      const fetchAllComments = async () => {
        setIsLoadingComments(true);

        // まずSessionStorageからコメントのキャッシュをチェック
        try {
          const cachedData = sessionStorage.getItem(commentsStorageKey);

          if (cachedData) {
            const { comments, timestamp } = JSON.parse(cachedData);
            const now = Date.now();

            // キャッシュが有効期限内なら使用
            if (now - timestamp < CACHE_EXPIRY) {
              console.log(`Using cached comments for MC #${mc.id}`);

              // MCsの状態を更新
              setMcs((prevMcs) =>
                prevMcs.map((prevMc) =>
                  prevMc.id === mc.id ? { ...prevMc, comments } : prevMc
                )
              );

              setHasLoadedAllComments(true);
              setIsLoadingComments(false);
              return;
            }
          }
        } catch (e) {
          // キャッシュ読み込みエラーは無視して通常のフェッチに進む
          console.warn("Cache read failed:", e);
        }

        // キャッシュがない場合やキャッシュが古い場合はAPIから取得
        try {
          // 遅延ロードとタイムアウト設定
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const response = await fetch(
            `/api/mcs/fetch-comments?mcId=${mc.id}`,
            {
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (response.ok) {
            const comments = await response.json();

            // MCsの状態を更新
            setMcs((prevMcs) =>
              prevMcs.map((prevMc) =>
                prevMc.id === mc.id ? { ...prevMc, comments } : prevMc
              )
            );

            // コメントをキャッシュに保存
            try {
              sessionStorage.setItem(
                commentsStorageKey,
                JSON.stringify({
                  comments,
                  timestamp: Date.now(),
                })
              );
            } catch (e) {
              console.warn("Failed to cache comments:", e);
            }

            setHasLoadedAllComments(true);
          } else {
            console.error("コメント取得エラー:", await response.text());
          }
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            console.error("コメント読み込みがタイムアウトしました");
          } else {
            console.error("コメント読み込みエラー:", error);
          }
        } finally {
          setIsLoadingComments(false);
        }
      };

      // 遅延読み込みでUIをブロックしないようにする
      const timer = setTimeout(() => {
        fetchAllComments();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [
    expandedComments,
    mc.id,
    hasLoadedAllComments,
    isLoadingComments,
    setMcs,
    commentsStorageKey,
    CACHE_EXPIRY,
  ]);

  return (
    <div className="card flex flex-col w-full max-w-[400px] h-full">
      <div className="relative h-[280px] bg-gray-100 dark:bg-slate-700 flex-shrink-0">
        {mc.image && mc.image !== "NULL" && mc.image !== "[NULL]" ? (
          <Image
            src={`/images/mcs/${encodeURIComponent(mc.image)}`}
            alt={mc.name}
            fill
            sizes="400px"
            className="object-cover"
            onError={(e) => {
              // fallback to default image if the MC image fails to load
              const img = e.target as HTMLImageElement;
              // Create placeholder with initials
              const container = document.createElement("div");
              container.className =
                "flex items-center justify-center h-full bg-gray-100 dark:bg-slate-700";
              container.innerHTML = `<span class="text-gray-500 dark:text-gray-400 font-bold text-4xl">${mc.name
                .substring(0, 2)
                .toUpperCase()}</span>`;
              img.parentNode?.replaceChild(container, img);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-slate-700">
            <span className="text-gray-500 dark:text-gray-400 font-bold text-4xl">
              {mc.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="p-6 flex-grow flex flex-col">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {mc.name}
        </h2>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLikeClick}
              className={`flex items-center space-x-1 ${
                mc.likes &&
                mc.likes.some(
                  (like) => session?.user?.id && like.userId === session.user.id
                )
                  ? "text-red-500"
                  : "text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              } transition-colors duration-200`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill={
                  mc.likes &&
                  mc.likes.some(
                    (like) =>
                      session?.user?.id && like.userId === session.user.id
                  )
                    ? "currentColor"
                    : "none"
                }
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
              <span className="text-sm font-medium">
                {mc.likesCount || (mc.likes ? mc.likes.length : 0)}
              </span>
            </button>
          </div>

          {mc.hood && (
            <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded-full">
              {mc.hood}
            </span>
          )}
        </div>

        <div className="space-y-4 flex-grow">
          {mc.description && (
            <div
              className="text-gray-700 dark:text-gray-300 text-sm"
              dangerouslySetInnerHTML={createSanitizedHTML(mc.description)}
            />
          )}

          {/* インタラクション部分 */}
          <div className="flex items-center space-x-4 pt-4 mt-auto">
            <button
              onClick={() => toggleComments(mc.id)}
              className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
            >
              <ChatBubbleLeftIcon className="w-6 h-6" />
              <span className="text-sm font-medium">
                {getTotalCommentsCount(mc.comments)}
              </span>
            </button>
          </div>

          {/* コメントセクション */}
          {isExpanded && (
            <div className="mt-4 space-y-4">
              {/* コメント入力フォーム */}
              {session && (
                <form onSubmit={handleCommentSubmit} className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="コメントを追加..."
                      className="input flex-1"
                    />
                    <button
                      type="submit"
                      disabled={!commentContent.trim()}
                      className="btn btn-primary disabled:opacity-50"
                    >
                      投稿
                    </button>
                  </div>
                </form>
              )}

              {/* コメント読み込み中の表示 */}
              {isLoadingComments && (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    コメントを読み込み中...
                  </span>
                </div>
              )}

              {/* コメント一覧 */}
              {mc.comments
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                )
                .map((comment: CommentWithUser) => (
                  <div
                    key={comment.id}
                    className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {comment.user.image ? (
                          <Image
                            src={comment.user.image}
                            alt={comment.user.name || "User"}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-600 flex items-center justify-center">
                            <span className="text-gray-600 dark:text-gray-300 text-xs font-bold">
                              {comment.user.name
                                ?.substring(0, 2)
                                .toUpperCase() || "UN"}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {comment.user.name || "匿名ユーザー"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(comment.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {isCurrentUserComment(comment) && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditCommentContent(comment.content);
                            }}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("このコメントを削除しますか？")) {
                                handleDeleteComment(comment.id);
                              }
                            }}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            削除
                          </button>
                        </div>
                      )}
                    </div>
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editCommentContent}
                          onChange={(e) =>
                            setEditCommentContent(e.target.value)
                          }
                          className="textarea w-full"
                          rows={3}
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setEditingCommentId(null);
                              setEditCommentContent("");
                            }}
                            className="btn btn-ghost text-sm"
                          >
                            キャンセル
                          </button>
                          <button
                            onClick={() => {
                              if (editCommentContent.trim()) {
                                handleEditComment(
                                  comment.id,
                                  editCommentContent
                                );
                              }
                            }}
                            className="btn btn-primary text-sm"
                          >
                            更新
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}

                    {/* 返信機能 */}
                    <CommentReply
                      commentId={comment.id}
                      replies={comment.replies || []}
                      onReply={handleReply}
                      session={session}
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
