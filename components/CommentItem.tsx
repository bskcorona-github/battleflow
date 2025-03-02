import { useState, ReactNode } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import type { CommentWithUser } from "@/types/mc";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

type CommentItemProps = {
  comment: CommentWithUser;
  onReply: (commentId: number, content: string, replyToUser?: string) => void;
  parentComment?: CommentWithUser;
};

export default function CommentItem({
  comment,
  onReply,
  parentComment,
}: CommentItemProps): ReactNode {
  const { data: sessionData } = useSession();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    if (parentComment) {
      const mentionContent = `@${comment.user.name} ${replyContent}`;
      await onReply(parentComment.id, mentionContent, comment.user.name);
    } else {
      await onReply(comment.id, replyContent);
    }

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
            <span className="text-sm text-gray-500">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-black">
            {comment.content.startsWith("@") ? (
              <>
                <span className="text-blue-500">
                  {comment.content.split(" ")[0]}
                </span>{" "}
                {comment.content.split(" ").slice(1).join(" ")}
              </>
            ) : (
              comment.content
            )}
          </p>
          <div className="flex items-center gap-4 mt-2">
            {sessionData && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                返信
              </button>
            )}
            {comment.replies?.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <span>{comment.replies.length}件の返信</span>
                {showReplies ? (
                  <ChevronUpIcon className="w-4 h-4" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
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
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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

      {showReplies && comment.replies?.length > 0 && (
        <div className="ml-8 space-y-4 border-l-2 border-gray-200 pl-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              parentComment={comment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
