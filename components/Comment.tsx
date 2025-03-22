import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import type { CommentWithUser } from "@/types/mc";

type CommentProps = {
  comment: CommentWithUser;
  onReply: (commentId: number, content: string) => void;
};

export default function Comment({ comment, onReply }: CommentProps) {
  const { data: sessionData } = useSession();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    await onReply(comment.id, replyContent);
    setReplyContent("");
    setIsReplying(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
        {comment.user.image && (
          <div className="relative w-8 h-8">
            <Image
              src={comment.user.image}
              alt={comment.user.name || "User"}
              fill
              sizes="32px"
              className="rounded-full object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-black">
              {comment.user.name}
            </span>
            <span className="text-sm text-black">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-black">{comment.content}</p>
          {sessionData && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className="mt-2 text-sm text-blue-500 hover:text-blue-600"
            >
              返信
            </button>
          )}
        </div>
      </div>

      {isReplying && (
        <form onSubmit={handleSubmit} className="ml-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="返信を入力..."
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!replyContent.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              送信
            </button>
          </div>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 space-y-4">
          {comment.replies.map((reply) => (
            <Comment key={reply.id} comment={reply} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}
