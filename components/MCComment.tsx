import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import type { CommentWithUser } from "@/types/mc";
import Image from "next/image";

// Comment型をCommentWithUser型と完全に一致させる

type MCCommentProps = {
  mcId: number;
  comments: CommentWithUser[];
  onCommentAdded: (newComment: CommentWithUser) => void;
  onCommentUpdated?: (commentId: number, newContent: string) => void;
  onCommentDeleted?: (commentId: number) => void;
  type: "mc" | "ranking";
};

export default function MCComment({
  mcId,
  comments = [],
  onCommentAdded,
  onCommentUpdated,
  onCommentDeleted,
  type,
}: MCCommentProps) {
  const { data: session } = useSession();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !session) return;

    setIsSubmitting(true);
    try {
      const endpoint =
        type === "mc" ? "/api/mcs/comment" : "/api/ranking/comment";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mcId, content: comment.trim() }),
      });

      if (!response.ok) {
        throw new Error("コメントの投稿に失敗しました");
      }

      const newComment = await response.json();
      onCommentAdded(newComment);
      setComment("");
      toast.success("コメントを投稿しました");
      setIsExpanded(true);
    } catch (error) {
      console.error("Comment error:", error);
      toast.error("コメントの投稿に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId: number, content: string) => {
    if (!session) return;

    try {
      const endpoint =
        type === "mc" ? "/api/mcs/comment" : "/api/ranking/comment";
      const response = await fetch(`${endpoint}/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!response.ok) {
        throw new Error("コメントの更新に失敗しました");
      }

      onCommentUpdated?.(commentId, content.trim());
      setEditingCommentId(null);
      setEditContent("");
      toast.success("コメントを更新しました");
    } catch (error) {
      console.error("Edit comment error:", error);
      toast.error("コメントの更新に失敗しました");
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!session || !window.confirm("このコメントを削除してもよろしいですか？"))
      return;

    try {
      const endpoint =
        type === "mc" ? "/api/mcs/comment" : "/api/ranking/comment";
      const response = await fetch(`${endpoint}/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("コメントの削除に失敗しました");
      }

      onCommentDeleted?.(commentId);
      toast.success("コメントを削除しました");
    } catch (error) {
      console.error("Delete comment error:", error);
      toast.error("コメントの削除に失敗しました");
    }
  };

  const startEdit = (comment: CommentWithUser) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingCommentId(null);
    setEditContent("");
  };

  return (
    <div>
      {/* コメントヘッダー */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${
            isExpanded ? "transform rotate-90" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="font-medium">コメント ({comments?.length || 0})</span>
      </button>

      {/* 展開時のコンテンツ */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* コメント入力フォーム */}
          {session && (
            <form onSubmit={handleSubmit} className="space-y-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="コメントを入力..."
                className="textarea w-full text-black dark:text-white border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800"
                rows={3}
              />
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="btn btn-primary"
              >
                {isSubmitting ? "投稿中..." : "コメントを投稿"}
              </button>
            </form>
          )}

          {/* コメント一覧 */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-gray-50 dark:bg-slate-700/50 p-4 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
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
                          {comment.user.name?.substring(0, 2).toUpperCase() ||
                            "UN"}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {comment.user.name || "匿名ユーザー"}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {session?.user?.id === comment.userId && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(comment)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                      >
                        削除
                      </button>
                    </div>
                  )}
                </div>
                {editingCommentId === comment.id ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="textarea w-full text-black dark:text-white border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800"
                      rows={3}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleEdit(comment.id, editContent)}
                        className="btn btn-primary text-sm"
                      >
                        更新
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="btn btn-ghost text-sm"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
