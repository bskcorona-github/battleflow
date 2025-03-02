import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { CommentWithUser } from "@/types/mc";

type CommentReplyProps = {
  comment: CommentWithUser;
  onReply: (
    commentId: number,
    content: string,
    replyToUser?: string
  ) => Promise<void>;
  handleEditComment: (commentId: number, content: string) => Promise<void>;
  handleDeleteComment: (commentId: number) => Promise<void>;
};

// ReplyFormのprops型を定義
type ReplyFormProps = {
  replyToUserName?: string;
};

export default function CommentReply({
  comment,
  onReply,
  handleEditComment,
  handleDeleteComment,
}: CommentReplyProps) {
  const { data: sessionData } = useSession();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyToUser, setReplyToUser] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showReplies, setShowReplies] = useState(false);

  const handleSubmit = async (e: React.FormEvent, replyToUserName?: string) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      const content = replyToUserName
        ? `@${replyToUserName} ${replyContent}`
        : replyContent;

      await onReply(comment.id, content, replyToUserName);
      setReplyContent("");
      setIsReplying(false);
      setReplyToUser(null);
      setReplyingToId(null);
    } catch (error) {
      console.error("Error posting reply:", error);
    }
  };

  // ReplyFormコンポーネントの型を修正
  const ReplyForm: React.FC<ReplyFormProps> = ({ replyToUserName }) => (
    <form
      onSubmit={(e) => handleSubmit(e, replyToUserName)}
      className="space-y-2 mt-2"
    >
      {replyToUserName && (
        <div className="text-sm font-medium text-gray-900">
          返信先:{" "}
          <span className="text-black font-semibold">@{replyToUserName}</span>
        </div>
      )}
      <textarea
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        placeholder="返信を入力..."
        className="w-full p-2 border rounded-md text-black"
        rows={2}
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => {
            setIsReplying(false);
            setReplyContent("");
            setReplyToUser(null);
            setReplyingToId(null);
          }}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={!replyContent.trim()}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          返信
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-4">
      {/* メインの返信ボタン */}
      {!isReplying && sessionData && (
        <button
          onClick={() => {
            setIsReplying(true);
            setReplyToUser(null);
            setReplyingToId(null);
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          返信する
        </button>
      )}

      {/* メインの返信フォーム */}
      {isReplying && !replyingToId && <ReplyForm />}

      {/* 返信一覧 */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {/* 返信の表示/非表示を切り替えるボタン */}
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 mb-2"
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
            {showReplies
              ? "返信を隠す"
              : `${comment.replies.length}件の返信を表示`}
          </button>

          {/* 返信一覧（折りたたみ可能） */}
          {showReplies && (
            <div className="ml-8 space-y-4 border-l-2 border-gray-200 pl-4">
              {comment.replies.map((reply) => (
                <div key={reply.id}>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {reply.user.image && (
                          <Image
                            src={reply.user.image}
                            alt={reply.user.name || "User"}
                            width={24}
                            height={24}
                            className="rounded-full"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.src = "/images/default-avatar.png";
                            }}
                            unoptimized
                          />
                        )}
                        <div>
                          <div className="font-semibold text-sm text-black">
                            {reply.user.name || "Anonymous"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(reply.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      {/* 編集・削除ボタン */}
                      {sessionData?.user?.id === reply.userId && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingReplyId(reply.id);
                              setEditContent(reply.content);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("この返信を削除しますか？")) {
                                handleDeleteComment(reply.id);
                              }
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            削除
                          </button>
                        </div>
                      )}
                    </div>
                    {editingReplyId === reply.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full p-2 border rounded-md text-black"
                          rows={2}
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setEditingReplyId(null);
                              setEditContent("");
                            }}
                            className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                          >
                            キャンセル
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                editContent.trim() &&
                                editContent !== reply.content
                              ) {
                                await handleEditComment(reply.id, editContent);
                              }
                              setEditingReplyId(null);
                              setEditContent("");
                            }}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            保存
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    )}
                    {/* 返信への返信ボタン */}
                    {sessionData && !editingReplyId && (
                      <button
                        onClick={() => {
                          setIsReplying(true);
                          setReplyToUser(reply.user.name || "Anonymous");
                          setReplyingToId(reply.id);
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                      >
                        返信する
                      </button>
                    )}
                  </div>
                  {/* 返信への返信フォーム */}
                  {isReplying && replyingToId === reply.id && (
                    <div className="mt-2">
                      <ReplyForm
                        replyToUserName={reply.user.name || "Anonymous"}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
