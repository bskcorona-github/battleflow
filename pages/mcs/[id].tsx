import { GetServerSideProps } from "next";
import { prisma } from "../../lib/prisma";
import Head from "next/head";
// import { useRouter } from "next/router";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import type { MCWithLikesAndComments, CommentWithUser } from "@/types/mc";
import { getSession, useSession, signIn } from "next-auth/react";
import { toast } from "react-hot-toast";

type Props = {
  mc: MCWithLikesAndComments;
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

export default function MCDetail({ mc, session }: Props) {
  // const _router = useRouter();
  // const { data: _sessionData } = useSession();
  const { data: sessionData } = useSession();
  const currentSession = sessionData || session;

  const [likes, setLikes] = useState(mc.likesCount || 0);
  const [isLiked, setIsLiked] = useState(mc.isLikedByUser || false);
  const [comments, setComments] = useState<CommentWithUser[]>(
    mc.comments as CommentWithUser[]
  );

  const createSanitizedHTML = (html: string) => {
    const sanitized = DOMPurify.sanitize(html);
    return { __html: sanitized };
  };

  const handleLike = async () => {
    if (!currentSession) {
      toast.error("いいねするにはログインが必要です");
      signIn();
      return;
    }

    try {
      const response = await fetch(`/api/mc/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mcId: mc.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikes(data.likesCount);
        toast.success(isLiked ? "いいねを取り消しました" : "いいねしました");
      }
    } catch (error) {
      console.error("Error liking MC:", error);
      toast.error("エラーが発生しました");
    }
  };

  const handleComment = async (content: string) => {
    if (!currentSession) {
      toast.error("コメントするにはログインが必要です");
      signIn();
      return null;
    }

    try {
      const response = await fetch(`/api/mcs/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mcId: mc.id, content }),
      });

      if (response.ok) {
        const newComment = await response.json();

        const commentWithUser = {
          ...newComment,
          user: {
            id: currentSession.user?.id,
            name: currentSession.user?.name,
            email: currentSession.user?.email,
            image: currentSession.user?.image,
          },
          replies: [],
        };

        setComments([commentWithUser, ...comments]);
        toast.success("コメントを投稿しました");
        return commentWithUser;
      }
    } catch (error) {
      console.error("Error commenting:", error);
      toast.error("エラーが発生しました");
    }
    return null;
  };

  return (
    <>
      <Head>
        <title>{mc.name} | MCバトル選手情報 - MCバトルビューワー</title>
        <meta
          name="description"
          content={`${mc.name}のMCバトル情報、プロフィール、出身地、戦績。${mc.name}の最新活動やバトル結果をチェックしよう。`}
        />
        <meta
          name="keywords"
          content={`${mc.name},MCバトル,${
            mc.hood || ""
          },ラップバトル,フリースタイル,日本語ラップ`}
        />
        <meta
          property="og:title"
          content={`${mc.name} | MCバトル選手情報 - MCバトルビューワー`}
        />
        <meta
          property="og:description"
          content={`${mc.name}のMCバトル情報、プロフィール、出身地、戦績。日本のMCバトルシーンをリアルタイムで追う。`}
        />
        <meta property="og:type" content="profile" />
        <meta
          property="og:url"
          content={`https://your-domain.com/mcs/${mc.id}`}
        />
        <meta
          property="og:image"
          content={mc.image || "https://your-domain.com/default-mc.jpg"}
        />
        <link rel="canonical" href={`https://your-domain.com/mcs/${mc.id}`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: mc.name,
              description:
                mc.description?.replace(/<br>/g, " ") ||
                `${mc.name}のプロフィール`,
              image: mc.image || "https://your-domain.com/default-mc.jpg",
              url: `https://your-domain.com/mcs/${mc.id}`,
              homeLocation: {
                "@type": "Place",
                name: mc.hood || "日本",
              },
              keywords: `MCバトル,${mc.name},ラッパー,ヒップホップ,日本語ラップ`,
            }),
          }}
        />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2">
            <li>
              <Link href="/" className="text-blue-500 hover:underline">
                ホーム
              </Link>
            </li>
            <li className="text-black">/</li>
            <li>
              <Link href="/mcs" className="text-blue-500 hover:underline">
                MC一覧
              </Link>
            </li>
            <li className="text-black">/</li>
            <li className="text-black">{mc.name}</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 mb-6 md:mb-0">
                {mc.image ? (
                  <Image
                    src={`/images/mcs/${encodeURIComponent(mc.image)}`}
                    alt={mc.name}
                    width={300}
                    height={300}
                    className="rounded-lg w-full h-auto object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-2xl">No Image</span>
                  </div>
                )}
              </div>
              <div className="md:w-2/3 md:pl-8">
                <h1 className="text-3xl font-bold mb-2 text-black">
                  {mc.name}
                </h1>
                <div className="flex items-center mb-4">
                  {mc.hood && (
                    <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm mr-3">
                      {mc.hood}
                    </div>
                  )}
                  <div className="flex items-center text-black mr-4">
                    <span className="mr-1">👍</span>
                    <span>{likes}</span>
                  </div>
                  <div className="flex items-center text-black">
                    <span className="mr-1">💬</span>
                    <span>{comments.length}</span>
                  </div>
                </div>

                {mc.description && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2 text-black">
                      プロフィール
                    </h2>
                    <div
                      className="text-black leading-relaxed"
                      dangerouslySetInnerHTML={createSanitizedHTML(
                        mc.description
                      )}
                    />
                  </div>
                )}

                <div className="flex mt-4">
                  <button
                    onClick={handleLike}
                    className={`px-4 py-2 rounded-md mr-3 ${
                      isLiked
                        ? "bg-red-100 text-red-600 border border-red-200"
                        : "bg-gray-100 text-black border border-gray-200"
                    }`}
                  >
                    👍 {isLiked ? "いいね済み" : "いいね"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-black">
                コメント ({comments.length})
              </h2>
              {currentSession ? (
                <div className="mb-6">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const content = (
                        form.elements.namedItem(
                          "content"
                        ) as HTMLTextAreaElement
                      ).value;
                      await handleComment(content);
                      form.reset();
                    }}
                  >
                    <textarea
                      name="content"
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                      rows={3}
                      placeholder="コメントを入力..."
                      required
                    ></textarea>
                    <button
                      type="submit"
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      コメントを投稿
                    </button>
                  </form>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-black mb-2">
                    コメントするにはログインが必要です
                  </p>
                  <button
                    onClick={() => signIn()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    ログイン
                  </button>
                </div>
              )}

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      {comment.user.image && (
                        <Image
                          src={comment.user.image}
                          alt={comment.user.name || "User"}
                          width={32}
                          height={32}
                          className="rounded-full mr-3"
                          unoptimized
                        />
                      )}
                      <div>
                        <div className="font-medium text-black">
                          {comment.user.name || "Anonymous"}
                        </div>
                        <div className="text-xs text-black">
                          {new Date(comment.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <p className="text-black whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-black italic">
                    まだコメントはありません。最初のコメントを投稿しましょう！
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params as { id: string };
  const session = await getSession(context);

  try {
    let user = null;
    if (session?.user?.email) {
      user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
    }

    const mc = await prisma.mC.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        image: true,
        description: true,
        hood: true,
        affiliation: true,
        likesCount: true,
        likes: user
          ? {
              where: { userId: user.id },
              select: { id: true },
              take: 1,
            }
          : undefined,
        comments: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!mc) {
      return {
        notFound: true,
      };
    }

    const optimizedSession = session
      ? {
          expires: session.expires,
          user: {
            ...session.user,
            id: user?.id || null,
          },
        }
      : null;

    const serializedMc = {
      id: mc.id,
      name: mc.name,
      image: mc.image,
      description: mc.description,
      hood: mc.hood,
      affiliation: mc.affiliation,
      likesCount: mc.likesCount,
      likes: null,
      isLikedByUser: user ? mc.likes && mc.likes.length > 0 : false,
      comments: mc.comments.map((comment) => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      })),
    };

    return {
      props: {
        mc: serializedMc,
        session: optimizedSession,
      },
    };
  } catch (error) {
    console.error("Error fetching MC details:", error);
    return {
      notFound: true,
    };
  }
};
