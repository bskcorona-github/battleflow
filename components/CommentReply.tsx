import { useState } from "react";
import Image from "next/image";
import { Session } from "next-auth";
import { CommentWithUser } from "@/types/mc";

type CommentReplyProps = {
  commentId: number;
  replies: CommentWithUser[];
  onReply: (commentId: number, content: string) => Promise<void>;
  session: Session | null;
};

// ReplyFormのprops型を定義
type ReplyFormProps = {
  replyToUserName?: string;
};

export default function CommentReply({
  commentId,
  replies,
  onReply,
  session,
}: CommentReplyProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState(false);

  const handleSubmit = async (e: React.FormEvent, replyToUserName?: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      const content = replyToUserName
        ? `@${replyToUserName} ${replyContent}`
        : replyContent;

      await onReply(commentId, content);
      setReplyContent("");
      setIsReplying(false);
    } catch (error) {
      console.error("Error posting reply:", error);
    }
  };

  // ReplyFormコンポーネント
  const ReplyForm: React.FC<ReplyFormProps> = ({ replyToUserName }) => (
    <form
      onSubmit={(e) => handleSubmit(e, replyToUserName)}
      className="space-y-2 mt-2"
    >
      {replyToUserName && (
        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
          返信先:{" "}
          <span className="text-primary font-semibold">@{replyToUserName}</span>
        </div>
      )}
      <textarea
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        placeholder="返信を入力..."
        className="textarea w-full"
        rows={2}
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => {
            setIsReplying(false);
            setReplyContent("");
          }}
          className="btn btn-ghost text-sm"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={!replyContent.trim()}
          className="btn btn-primary text-sm"
        >
          返信
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      {/* メインの返信ボタン */}
      {!isReplying && session && (
        <button
          onClick={() => setIsReplying(true)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-2"
        >
          返信する
        </button>
      )}

      {/* メインの返信フォーム */}
      {isReplying && <ReplyForm />}

      {/* 返信一覧 */}
      {replies && replies.length > 0 && (
        <div>
          {/* 返信の表示/非表示を切り替えるボタン */}
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mt-2"
          >
            <svg
              className={`w-4 h-4 transform transition-transform ${
                showReplies ? "rotate-90" : ""
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
            {showReplies ? "返信を隠す" : `${replies.length}件の返信を表示`}
          </button>

          {/* 返信一覧（折りたたみ可能） */}
          {showReplies && (
            <div className="ml-4 space-y-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4 mt-3">
              {replies.map((reply) => (
                <div key={reply.id}>
                  <div className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {reply.user.image ? (
                          <Image
                            src={reply.user.image}
                            alt={reply.user.name || "User"}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-slate-600 flex items-center justify-center">
                            <span className="text-gray-600 dark:text-gray-300 text-xs font-bold">
                              {reply.user.name?.substring(0, 2).toUpperCase() ||
                                "UN"}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {reply.user.name || "匿名ユーザー"}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(reply.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {reply.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
