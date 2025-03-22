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
}: MCCardProps) {
  const { data: session } = useSession();
  const [commentContent, setCommentContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  // 未使用の変数をコメントアウト
  // const [currentPageNumber, setCurrentPageNumber] = useState(1);

  // showCommentsの状態をexpandedCommentsから取得
  const isExpanded = expandedComments.includes(mc.id);

  useEffect(() => {
    console.log("Initial comments:", mc.comments);
    console.log("Processed comments:", mc.comments);
  }, [mc.comments]);

  const handleLikeClick = async () => {
    if (!session) {
      toast.error("いいねするにはログインが必要です");
      return;
    }
    try {
      await onLike(mc.id);
    } catch (error) {
      console.error("Error liking MC:", error);
    }
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

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-gray-200 w-[400px] flex flex-col">
      <div className="relative h-[280px] bg-gray-200 flex-shrink-0">
        {mc.image ? (
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
                "flex items-center justify-center h-full bg-gray-100";
              container.innerHTML = `<span class="text-gray-500 font-bold text-4xl">${mc.name
                .substring(0, 2)
                .toUpperCase()}</span>`;
              img.parentNode?.replaceChild(container, img);
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <span className="text-gray-500 font-bold text-4xl">
              {mc.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="p-6 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{mc.name}</h2>
          {session && (
            <button
              onClick={handleLikeClick}
              className={`flex items-center gap-1 ${
                mc.isLikedByUser ? "text-red-500" : "text-gray-500"
              } hover:text-red-500 transition-colors`}
              disabled={!session}
            >
              <svg
                className={`w-5 h-5 ${mc.isLikedByUser ? "fill-current" : ""}`}
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
          )}
        </div>
        <div className="space-y-4">
          {mc.description && (
            <div
              className="text-gray-700"
              dangerouslySetInnerHTML={createSanitizedHTML(mc.description)}
            />
          )}
          {mc.hood && (
            <div className="py-2">
              <span className="font-semibold text-gray-700">地域:</span>{" "}
              <span className="text-gray-800">{mc.hood}</span>
            </div>
          )}

          {/* インタラクション部分 */}
          <div className="flex items-center space-x-4 pt-4 border-t">
            <button
              onClick={() => toggleComments(mc.id)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-500"
            >
              <ChatBubbleLeftIcon className="w-6 h-6" />
              <span>{getTotalCommentsCount(mc.comments)}</span>
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
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                    <button
                      type="submit"
                      disabled={!commentContent.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      投稿
                    </button>
                  </div>
                </form>
              )}

              {/* コメント一覧 */}
              <div className="space-y-4">
                {mc.comments
                  .filter(
                    (comment: CommentWithUser) => comment.parentId === null
                  )
                  .map((comment: CommentWithUser) => (
                    <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
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
                        {isCurrentUserComment(comment) && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditCommentContent(comment.content);
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
                            value={editCommentContent}
                            onChange={(e) =>
                              setEditCommentContent(e.target.value)
                            }
                            className="w-full p-2 border rounded-md text-gray-900"
                            rows={3}
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditCommentContent("");
                              }}
                              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                            >
                              キャンセル
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  editCommentContent.trim() &&
                                  editCommentContent !== comment.content
                                ) {
                                  await handleEditComment(
                                    comment.id,
                                    editCommentContent
                                  );
                                  // 状態を更新
                                  mc.comments = mc.comments.map(
                                    (c: CommentWithUser) =>
                                      c.id === comment.id
                                        ? { ...c, content: editCommentContent }
                                        : c
                                  );
                                }
                                setEditingCommentId(null);
                                setEditCommentContent("");
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
          )}
        </div>
      </div>
    </div>
  );
}
