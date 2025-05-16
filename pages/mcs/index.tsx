import { GetServerSideProps } from "next";
import { prisma } from "../../lib/prisma";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
import { useRouter } from "next/router";
import { Prisma } from "@prisma/client";
import { ParsedUrlQueryInput } from "querystring";

type Props = {
  mcs: MCWithLikesAndComments[];
  totalCount: number;
  currentPage: number;
  itemsPerPage: number;
  currentSortOrder: string;
  currentHoodFilter: string | null;
  currentSearchQuery: string;
  allHoods: string[];
  session: {
    expires: string | null;
    user: {
      name: string | null;
      email: string | null;
      image: string | null;
      id: string | null;
      isAdmin?: boolean;
    } | null;
  } | null;
  error?: string;
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

// MCViewerコンポーネントをメモ化
const MCViewer = React.memo(
  ({
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
    const [editingCommentId, setEditingCommentId] = useState<number | null>(
      null
    );
    const [editContent, setEditContent] = useState("");
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [hasLoadedAllComments, setHasLoadedAllComments] = useState(false);
    const isFetchingRef = useRef(false); // 同時に複数回のリクエストを防止するためのref

    // HTMLをサニタイズして安全にレンダリングする関数
    const createSanitizedHTML = (html: string) => {
      const sanitizedHTML = DOMPurify.sanitize(html);
      return { __html: sanitizedHTML };
    };

    // コメントキャッシュのキー
    const commentsStorageKey = `mc-comments-${mc.id}`;
    // キャッシュの有効期限(5分)
    const CACHE_EXPIRY = 5 * 60 * 1000;

    // コメント展開時に全コメントを読み込む
    useEffect(() => {
      const isExpanded = expandedComments.includes(mc.id);
      if (
        isExpanded &&
        mc.comments.length > 0 &&
        !hasLoadedAllComments &&
        !isLoadingComments &&
        !isFetchingRef.current
      ) {
        const fetchAllComments = async () => {
          // すでにフェッチ処理中なら重複起動しない
          if (isFetchingRef.current) return;
          isFetchingRef.current = true;
          setIsLoadingComments(true);

          try {
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
                  isFetchingRef.current = false;
                  return;
                }
              }
            } catch (e) {
              // キャッシュ読み込みエラーは無視して通常のフェッチに進む
              console.warn("Cache read failed:", e);
            }

            const response = await fetch(
              `/api/mcs/fetch-comments?mcId=${mc.id}`
            );
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
            console.error("コメント読み込みエラー:", error);
          } finally {
            setIsLoadingComments(false);
            isFetchingRef.current = false;
          }
        };

        // 起動タイミングを少しずらしてUIをブロックしないようにする
        const timer = setTimeout(() => {
          fetchAllComments();
        }, 50);

        return () => clearTimeout(timer);
      }
    }, [
      expandedComments,
      mc.id,
      mc.comments.length,
      hasLoadedAllComments,
      isLoadingComments,
      setMcs,
      commentsStorageKey,
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
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImciPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjZWVlIiBvZmZzZXQ9IjIwJSIgLz4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iI2RkZCIgb2Zmc2V0PSI1MCUiIC8+CiAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiNlZWUiIG9mZnNldD0iNzAlIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZWVlIiAvPgogIDxyZWN0IGlkPSJyIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9InVybCgjZykiIC8+CiAgPGFuaW1hdGUgeGxpbms6aHJlZj0iI3IiIGF0dHJpYnV0ZU5hbWU9IngiIGZyb209Ii00MCIgdG89IjQwIiBkdXI9IjFzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgIC8+Cjwvc3ZnPg=="
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
                            loading="lazy"
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
                                      comments: [
                                        newComment,
                                        ...prevMc.comments,
                                      ],
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
                          className="w-full p-2 border rounded-md text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 font-medium"
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
                                  loading="lazy"
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
                                    if (
                                      confirm("このコメントを削除しますか？")
                                    ) {
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
                                className="w-full p-2 border rounded-md text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 font-medium"
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
                    loading="lazy"
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImciPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjZWVlIiBvZmZzZXQ9IjIwJSIgLz4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iI2RkZCIgb2Zmc2V0PSI1MCUiIC8+CiAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiNlZWUiIG9mZnNldD0iNzAlIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZWVlIiAvPgogIDxyZWN0IGlkPSJyIiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9InVybCgjZykiIC8+CiAgPGFuaW1hdGUgeGxpbms6aHJlZj0iI3IiIGF0dHJpYnV0ZU5hbWU9IngiIGZyb209Ii02NCIgdG89IjY0IiBkdXI9IjFzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgIC8+Cjwvc3ZnPg=="
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
              dangerouslySetInnerHTML={createSanitizedHTML(
                mc.description || "-"
              )}
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
                      loading="lazy"
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
                    className="w-full p-2 border rounded-md text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 font-medium"
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
                            loading="lazy"
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
                          className="w-full p-2 border rounded-md text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 font-medium"
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
        )}
      </div>
    );
  }
);

// displayNameを設定
MCViewer.displayName = "MCViewer";

// 再帰的にコメントに返信を追加するヘルパー関数
const addReplyToComment = (
  comments: CommentWithUser[],
  targetCommentId: number,
  newReply: CommentWithUser
): CommentWithUser[] => {
  return comments.map((comment) => {
    if (comment.id === targetCommentId) {
      // 既存のrepliesがない場合は空配列として初期化
      const existingReplies = comment.replies || [];
      return {
        ...comment,
        replies: [...existingReplies, newReply],
      };
    }
    if (comment.replies && comment.replies.length > 0) {
      return {
        ...comment,
        replies: addReplyToComment(comment.replies, targetCommentId, newReply),
      };
    }
    return comment;
  });
};

export default function MCsPage({
  mcs: initialMcs,
  totalCount,
  currentPage,
  itemsPerPage,
  currentSortOrder,
  currentHoodFilter,
  currentSearchQuery,
  allHoods,
  session: initialSession,
  error,
}: Props) {
  const router = useRouter();
  const [mcs, setMcs] = useState<MCWithLikesAndComments[]>(initialMcs);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const { data: sessionDataFromHook, status } = useSession();
  const sessionData =
    status === "loading"
      ? initialSession
      : sessionDataFromHook || initialSession;
  const [searchQuery, setSearchQuery] = useState(currentSearchQuery);
  const [searchInputValue, setSearchInputValue] = useState(currentSearchQuery);
  const [isAdmin, setIsAdmin] = useState(sessionData?.user?.isAdmin || false);
  const [likingMcIds, setLikingMcIds] = useState<Set<number>>(new Set());
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (error) {
    console.error("Error on MCsPage:", error);
    // ここでユーザーにエラーメッセージを表示するUIを出すことも検討できる
  }

  // Paginationコンポーネントのページ変更ハンドラ
  const handlePageChange = (page: number) => {
    const query: ParsedUrlQueryInput = { page, sort: currentSortOrder };
    if (currentHoodFilter) {
      query.hood = currentHoodFilter;
    }
    if (currentSearchQuery) {
      query.search = currentSearchQuery;
    }
    router.push({
      pathname: "/mcs",
      query,
    });
  };

  // ソート順変更ハンドラー
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSortOrder = e.target.value;
    const query: ParsedUrlQueryInput = { page: 1, sort: newSortOrder };
    if (currentHoodFilter) {
      query.hood = currentHoodFilter;
    }
    if (currentSearchQuery) {
      query.search = currentSearchQuery;
    }
    router.push({
      pathname: "/mcs",
      query,
    });
  };

  // フッドフィルター変更ハンドラー
  const handleHoodFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHoodFilter = e.target.value || null;
    const query: ParsedUrlQueryInput = { page: 1, sort: currentSortOrder };
    if (newHoodFilter && newHoodFilter !== "all") {
      query.hood = newHoodFilter;
    }
    if (currentSearchQuery) {
      query.search = currentSearchQuery;
    }
    router.push({
      pathname: "/mcs",
      query,
    });
  };

  // 管理者権限チェック (sessionDataの変更を監視)
  useEffect(() => {
    if (sessionData?.user?.email) {
      setIsAdmin(sessionData.user.isAdmin || false);
    } else {
      setIsAdmin(false);
    }
  }, [sessionData]);

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
      const response = await fetch(`/api/mc/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, commentId, replyToUser }),
      });

      if (!response.ok) {
        throw new Error("返信の投稿に失敗しました");
      }

      const newReplyData = await response.json();

      // APIからのレスポンスをCommentWithUser型に合わせる (user情報と空のreplies配列を付与)
      const newReplyComment: CommentWithUser = {
        ...newReplyData,
        user: newReplyData.user ||
          sessionData?.user || {
            name: "不明なユーザー",
            image: null,
            id: "",
            email: null,
          }, // ユーザー情報を保証
        replies: [], // 新しい返信にはさらに返信は無いため空配列
      };

      // MCsの状態を更新
      setMcs((prevMcs) =>
        prevMcs.map((mc) => ({
          ...mc,
          comments: addReplyToComment(mc.comments, commentId, newReplyComment),
        }))
      );

      toast.success("返信を投稿しました");
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error("返信の投稿に失敗しました");
    }
  };

  // MCViewerコンポーネントをレンダリングする関数 (すべてのハンドラー関数を定義した後に配置)
  const renderMCViewer = useCallback(
    (mc: MCWithLikesAndComments) => {
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
    },
    [
      viewMode,
      expandedComments,
      handleLike,
      handleComment,
      toggleComments,
      handleEditComment,
      handleDeleteComment,
      handleReply,
    ]
  );

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
  const currentMCsToDisplay = searchQuery.trim() ? filteredMCs : mcs;

  // ページ数の計算を更新
  const totalPages = useMemo(
    () => Math.ceil(totalCount / itemsPerPage),
    [totalCount, itemsPerPage]
  );

  // 検索ハンドラー
  const handleSearch = (query: string) => {
    setSearchInputValue(query);

    // ディバウンス処理: 入力が終わってから検索実行
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(query);
      const routerQuery: ParsedUrlQueryInput = {
        page: 1,
        sort: currentSortOrder,
      };

      if (currentHoodFilter) {
        routerQuery.hood = currentHoodFilter;
      }

      if (query.trim()) {
        routerQuery.search = query;
      }

      router.push({
        pathname: "/mcs",
        query: routerQuery,
      });
    }, 500); // 500ms遅延
  };

  // useEffectで検索タイムアウトをクリーンアップ
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
            <SearchBar
              onSearch={handleSearch}
              initialValue={searchInputValue}
            />
            <div className="flex items-center gap-4">
              {/* ソート順選択ドロップダウンを追加 */}
              <div className="relative">
                <select
                  value={currentSortOrder}
                  onChange={handleSortChange}
                  className="block w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                >
                  <option value="createdAt_desc">新着順</option>
                  <option value="likes_desc">人気順（いいね数）</option>
                  <option value="comments_desc">注目順（コメント数）</option>
                  <option value="name_asc">名前順</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              {/* フッドフィルター選択ドロップダウンを追加 */}
              <div className="relative">
                <select
                  value={currentHoodFilter || "all"}
                  onChange={handleHoodFilterChange}
                  className="block w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                >
                  <option value="all">全ての地域</option>
                  {allHoods.map((hood) => (
                    <option key={hood} value={hood}>
                      {hood}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

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
            {currentMCsToDisplay.map((mc) => renderMCViewer(mc))}
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
              {currentMCsToDisplay.map((mc) => renderMCViewer(mc))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
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

    const page = parseInt(context.query.page as string) || 1;
    const itemsPerPage = 20;
    const sortOrderQuery = context.query.sort as string;
    const hoodFilter = (context.query.hood as string) || null;
    const searchQuery = (context.query.search as string) || null;

    // フィルター条件を構築
    const where: Prisma.MCWhereInput = {};
    if (hoodFilter) {
      where.hood = hoodFilter;
    }

    // 検索クエリがある場合、検索条件を追加
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      where.OR = [
        { name: { contains: searchLower } },
        { hood: { contains: searchLower } },
        { description: { contains: searchLower } },
      ];
    }

    let orderBy: Prisma.MCOrderByWithRelationInput[] = [
      { createdAt: "desc" }, // デフォルトは新着順
    ];

    if (sortOrderQuery === "likes_desc") {
      orderBy = [{ likesCount: "desc" }, { createdAt: "desc" }];
    } else if (sortOrderQuery === "name_asc") {
      orderBy = [{ name: "asc" }, { createdAt: "desc" }];
    } else if (sortOrderQuery === "comments_desc") {
      // コメント数順も追加
      orderBy = [{ commentsCount: "desc" }, { createdAt: "desc" }];
    }

    const session = await getSession(context);
    const user = session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, isAdmin: true },
        })
      : null;

    // 全ての異なるフッド値を取得
    const allHoodsResult = await prisma.mC.findMany({
      select: {
        hood: true,
      },
      distinct: ["hood"],
      where: {
        hood: {
          not: null,
        },
      },
      orderBy: {
        hood: "asc",
      },
    });
    const allHoods = allHoodsResult
      .map((item) => item.hood)
      .filter((hood): hood is string => hood !== null && hood !== "");

    // MCの総数を取得（フィルター条件と検索クエリを考慮）
    const totalCount = await prisma.mC.count({ where });
    console.log(
      `総MC数: ${totalCount}件, 現在ページ: ${page}, ソート: ${
        sortOrderQuery || "default"
      }, フィルター: ${hoodFilter || "なし"}, 検索: ${searchQuery || "なし"}`
    );

    // 指定ページのMCを取得
    const mcs = await prisma.mC.findMany({
      where, // フィルター条件を適用
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
      orderBy: orderBy,
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
    });

    // 処理時間計測
    const processingTime = Date.now() - startTime;
    console.log(
      `MC一覧データ取得処理時間: ${processingTime}ms, 件数: ${mcs.length}件`
    );

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

    // セッション情報を最適化（必要な情報のみクライアントに渡す）
    const optimizedSession = session
      ? {
          expires: session.expires,
          user: {
            name: session.user?.name || null,
            email: session.user?.email || null,
            image: session.user?.image || null,
            id: user?.id || null, // DBから取得したuser.idを使用
            isAdmin: user?.isAdmin || false, // DBから取得したuser.isAdminを使用
          },
        }
      : null;

    return {
      props: {
        mcs: serializedMcs,
        totalCount,
        currentPage: page,
        itemsPerPage,
        currentSortOrder: sortOrderQuery || "createdAt_desc",
        currentHoodFilter: hoodFilter,
        currentSearchQuery: searchQuery || "",
        allHoods,
        session: optimizedSession,
      },
    };
  } catch (error) {
    console.error("Error fetching MCs:", error);
    return {
      props: {
        mcs: [],
        totalCount: 0,
        currentPage: 1,
        itemsPerPage: 20,
        currentSortOrder: "createdAt_desc",
        currentHoodFilter: null,
        currentSearchQuery: "",
        allHoods: [],
        session: null,
        error: "データの取得に失敗しました",
      },
    };
  }
};
