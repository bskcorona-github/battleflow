import { GetServerSideProps } from "next";
import { prisma } from "../../lib/prisma";
import { useState, useMemo, useEffect } from "react";
import { getSession, useSession, signIn } from "next-auth/react";
import type { MCWithLikesAndComments, CommentWithUser } from "@/types/mc";
import Image from "next/image";
import React from "react";
import { toast } from "react-hot-toast";
import CommentReply from "@/components/CommentReply";
import DOMPurify from "isomorphic-dompurify";
import Pagination from "@/components/Pagination";
import Head from "next/head";
import SearchBar from "@/components/SearchBar";
import Link from "next/link";

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
}: MCViewerProps) => {
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
        <tr className="hover:bg-gray-50 cursor-pointer">
          <td className="px-6 py-4 whitespace-nowrap">
            <Link href={`/mcs/${mc.id}`} className="block w-full h-full">
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
                <div className="text-sm font-medium text-gray-900">
                  {mc.name}
                </div>
              </div>
            </Link>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <Link href={`/mcs/${mc.id}`} className="block w-full h-full">
              <div className="text-sm text-gray-500">{mc.hood || "-"}</div>
            </Link>
          </td>
          <td className="px-6 py-4">
            <Link href={`/mcs/${mc.id}`} className="block w-full h-full">
              <div
                className="text-sm text-gray-500"
                dangerouslySetInnerHTML={createSanitizedHTML(
                  mc.description || "-"
                )}
              />
            </Link>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <div className="flex justify-center items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLike(mc.id);
                }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  toggleComments(mc.id);
                }}
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
            <td
              colSpan={5}
              className="px-6 py-4 bg-gray-50"
              onClick={(e) => e.stopPropagation()}
            >
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
                        className="w-full p-2 border rounded-md text-black font-medium"
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
                              className="w-full p-2 border rounded-md text-black font-medium"
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
                            commentId={comment.id}
                            replies={comment.replies || []}
                            onReply={handleReply}
                            session={sessionData}
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

  // グリッド表示の場合のJSXを修正
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Link href={`/mcs/${mc.id}`} className="block">
        <div
          className="p-4 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center mb-4">
            {mc.image && mc.image !== "NULL" && mc.image !== "[NULL]" ? (
              <div className="relative h-16 w-16 mr-4">
                <Image
                  src={`/images/mcs/${encodeURIComponent(mc.image)}`}
                  alt={mc.name}
                  fill
                  sizes="64px"
                  className="rounded-full object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    // 親要素を取得
                    const parent = img.parentElement;
                    if (parent) {
                      // 親要素のスタイルを維持しながら内容を置き換え
                      parent.innerHTML = `<div class="flex items-center justify-center w-full h-full bg-gray-200 rounded-full">
                        <span class="text-gray-600 font-medium">${mc.name
                          .substring(0, 2)
                          .toUpperCase()}</span>
                      </div>`;
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-16 w-16 mr-4 bg-gray-200 rounded-full">
                <span className="text-gray-600 font-medium">
                  {mc.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">{mc.name}</h3>
              {mc.hood && (
                <p className="text-sm text-gray-500 mt-1">{mc.hood}</p>
              )}
            </div>
          </div>
          <div
            className="text-sm text-gray-500 mb-4 line-clamp-3"
            dangerouslySetInnerHTML={createSanitizedHTML(mc.description || "-")}
          />
        </div>
      </Link>

      <div
        className="px-4 py-3 bg-gray-50 flex justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike(mc.id);
          }}
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

        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleComments(mc.id);
          }}
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

      {expandedComments.includes(mc.id) && (
        <div
          className="p-4 border-t border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
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
                    form.elements.namedItem("content") as HTMLTextAreaElement
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
                  className="w-full p-2 border rounded-md text-black font-medium"
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
              .filter((comment: CommentWithUser) => comment.parentId === null)
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
                        className="w-full p-2 border rounded-md text-black font-medium"
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
                              await handleEditComment(comment.id, editContent);
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
                      commentId={comment.id}
                      replies={comment.replies || []}
                      onReply={handleReply}
                      session={sessionData}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function MCsPage({ mcs: initialMcs }: Props) {
  const [mcs, setMcs] = useState<MCWithLikesAndComments[]>(initialMcs);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const { data: sessionData } = useSession();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  // いいね処理の連打防止用の状態
  const [likingMcIds, setLikingMcIds] = useState<Set<number>>(new Set());

  // MCViewerコンポーネントをレンダリングする関数
  const renderMCViewer = (mc: MCWithLikesAndComments) => {
    // MCViewerコンポーネントをレンダリングするときに必要な引数を渡す
    return (
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
    );
  };

  // 検索クエリに基づいてMCをフィルタリングするためのmemo
  const filteredMCs = useMemo(() => {
    if (!searchQuery.trim()) return mcs;

    const query = searchQuery.toLowerCase();
    return mcs.filter(
      (mc) =>
        mc.name.toLowerCase().includes(query) ||
        (mc.hood && mc.hood.toLowerCase().includes(query)) ||
        (mc.description && mc.description.toLowerCase().includes(query))
    );
  }, [mcs, searchQuery]);

  // 現在のページのMCs
  const currentMCs = useMemo(() => {
    const indexOfLastMC = currentPage * itemsPerPage;
    const indexOfFirstMC = indexOfLastMC - itemsPerPage;
    return filteredMCs.slice(indexOfFirstMC, indexOfLastMC);
  }, [filteredMCs, currentPage]);

  // ページ数の計算を更新
  const totalPages = useMemo(
    () => Math.ceil(filteredMCs.length / itemsPerPage),
    [filteredMCs.length, itemsPerPage]
  );

  // 検索時にページを1に戻す
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // 検索ハンドラー
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // コメントの投稿処理
  const handleComment = async (mcId: number, content: string) => {
    if (!sessionData) {
      toast.error("コメントするにはログインが必要です");
      return null;
    }

    if (!sessionData.user?.id) {
      toast.error("セッション情報が不足しています。再ログインしてください");
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
                      id: sessionData.user?.id,
                      name: sessionData.user?.name,
                      email: sessionData.user?.email,
                      image: sessionData.user?.image,
                    },
                    replies: [],
                    parentId: null,
                    userId: sessionData.user?.id,
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
          id: sessionData.user?.id,
          name: sessionData.user?.name,
          email: sessionData.user?.email,
          image: sessionData.user?.image,
        },
        replies: [],
        parentId: null,
        userId: sessionData.user?.id,
        mcId: mcId,
      };
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("コメントの投稿に失敗しました");
      return null;
    }
  };

  // 管理者権限チェック
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (sessionData?.user?.email) {
        try {
          const response = await fetch(
            `/api/user/check-admin?email=${sessionData.user.email}`
          );
          const data = await response.json();
          setIsAdmin(data.isAdmin);
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      }
    };
    checkAdminStatus();
  }, [sessionData]);

  // リセット処理関数
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
    if (!sessionData) {
      toast.error("いいねするにはログインが必要です");
      return;
    }

    // 確実にセッションIDが存在することを確認
    if (!sessionData.user?.id) {
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

  // コメントの表示/非表示を切り替え
  const toggleComments = (mcId: number) => {
    setExpandedComments((prev) =>
      prev.includes(mcId) ? prev.filter((id) => id !== mcId) : [...prev, mcId]
    );
  };

  return (
    <>
      <Head>
        <title>MC一覧 - MCバトルビューワー</title>
        <meta
          name="description"
          content="日本の人気MCをチェック。プロフィール、出身地、バトル成績など、各MCの詳細情報を見られます。"
        />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6">
          <h1 className="text-2xl font-bold mb-4 md:mb-0">MC一覧</h1>
          <div className="w-full md:w-auto flex flex-col md:flex-row gap-4">
            <SearchBar onSearch={handleSearch} />
            <div className="flex items-center gap-4">
              <div className="flex">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1 rounded-l ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-1 rounded-r ${
                    viewMode === "table"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>

              {isAdmin && (
                <button
                  onClick={handleReset}
                  className="px-4 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  リセット
                </button>
              )}

              {!sessionData && (
                <button
                  onClick={() => signIn()}
                  className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  ログイン
                </button>
              )}
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentMCs.map((mc) => renderMCViewer(mc))}
          </div>
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
              {currentMCs.map((mc) => renderMCViewer(mc))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // パフォーマンス計測開始
    const startTime = Date.now();

    // セッション取得
    const session = await getSession(context);
    const user = session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, isAdmin: true },
        })
      : null;

    // ページネーションパラメータの取得
    const page = context.query.page ? Number(context.query.page) : 1;
    const limit = 20; // 1ページに表示する件数を20に固定
    const skip = (page - 1) * limit;

    // MCの総数を取得（ページネーション用）
    const totalCount = await prisma.mC.count();

    // 必要なデータだけを選択的に取得
    const mcs = await prisma.mC.findMany({
      take: limit,
      skip: skip,
      select: {
        id: true,
        name: true,
        image: true,
        hood: true,
        affiliation: true,
        description: true,
        likesCount: true,
        commentsCount: true,
        createdAt: true,
        updatedAt: true,
        // ユーザーがログインしている場合のみいいね情報を取得
        likes:
          session && user?.id
            ? {
                where: {
                  userId: user.id,
                },
                select: {
                  id: true,
                },
                take: 1,
              }
            : false,
        // 最新コメントのみ取得
        comments: {
          take: 2, // 最新2件のみ取得
          orderBy: {
            createdAt: "desc",
          },
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
              },
            },
            // 最新の返信のみ取得
            replies: {
              take: 2,
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

    // 処理時間計測
    const processingTime = Date.now() - startTime;
    console.log(`MC一覧データ取得処理時間: ${processingTime}ms`);

    // 日付をISOString形式に変換
    const serializedMcs = mcs.map((mc) => ({
      ...mc,
      isLikedByUser:
        session && user?.id ? mc.likes && mc.likes.length > 0 : false,
      createdAt: mc.createdAt.toISOString(),
      updatedAt: mc.updatedAt.toISOString(),
      comments: mc.comments.map((comment) => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        replies: comment.replies?.map((reply) => ({
          ...reply,
          createdAt: reply.createdAt.toISOString(),
          updatedAt: reply.updatedAt.toISOString(),
        })),
      })),
    }));

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
