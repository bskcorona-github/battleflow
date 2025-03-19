import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import type { CommentWithUser } from "@/types/mc";

export const useComments = (mcId: number) => {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addComment = async (content: string) => {
    if (!session) {
      toast.error("コメントするにはログインが必要です");
      return null;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/mc/comment", {
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
      setComments((prev) => [newComment, ...prev]);
      toast.success("コメントを投稿しました");
      return newComment;
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error(
        error instanceof Error ? error.message : "コメントの投稿に失敗しました"
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const editComment = async (commentId: number, content: string) => {
    if (!session) {
      toast.error("コメントの編集にはログインが必要です");
      return;
    }

    setIsLoading(true);
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
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, content: updatedComment.content }
            : comment
        )
      );
      toast.success("コメントを更新しました");
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error(
        error instanceof Error ? error.message : "コメントの更新に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!session) {
      toast.error("コメントの削除にはログインが必要です");
      return;
    }

    if (!confirm("このコメントを削除しますか？")) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/mc/comment/${commentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("コメントの削除に失敗しました");
      }

      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      toast.success("コメントを削除しました");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error(
        error instanceof Error ? error.message : "コメントの削除に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const replyToComment = async (
    commentId: number,
    content: string,
    replyToUser?: string
  ) => {
    if (!session) {
      toast.error("返信するにはログインが必要です");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/mc/comment/${commentId}/reply`, {
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
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), newReply],
              }
            : comment
        )
      );
      toast.success("返信を投稿しました");
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error(
        error instanceof Error ? error.message : "返信の投稿に失敗しました"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    comments,
    isLoading,
    addComment,
    editComment,
    deleteComment,
    replyToComment,
  };
};
