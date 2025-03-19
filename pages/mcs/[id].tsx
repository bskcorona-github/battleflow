import { GetServerSideProps } from "next";
import { prisma } from "../../lib/prisma";
import Head from "next/head";
// import { useRouter } from "next/router";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import type { MCWithLikesAndComments, CommentWithUser } from "@/types/mc";
import { getSession /* , useSession */ } from "next-auth/react";
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
  const [likes, setLikes] = useState(mc.likes.length);
  const [isLiked, setIsLiked] = useState(
    mc.likes.some((like) => like.userId === session?.user?.id)
  );
  const [comments, setComments] = useState<CommentWithUser[]>(
    mc.comments as CommentWithUser[]
  );

  const createSanitizedHTML = (html: string) => {
    const sanitized = DOMPurify.sanitize(html);
    return { __html: sanitized };
  };

  const handleLike = async () => {
    if (!session) {
      toast.error("いいねするにはログインが必要です");
      return;
    }

    try {
      const response = await fetch(`/api/mcs/${mc.id}/like`, {
        method: "POST",
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikes(isLiked ? likes - 1 : likes + 1);
        toast.success(isLiked ? "いいねを取り消しました" : "いいねしました");
      }
    } catch (error) {
      console.error("Error liking MC:", error);
      toast.error("エラーが発生しました");
    }
  };

  const handleComment = async (content: string) => {
    if (!session) {
      toast.error("コメントするにはログインが必要です");
      return null;
    }

    try {
      const response = await fetch(`/api/mcs/${mc.id}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments([...comments, newComment]);
        toast.success("コメントを投稿しました");
        return newComment;
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
          content={mc.imageUrl || "https://your-domain.com/default-mc.jpg"}
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
              image: mc.imageUrl || "https://your-domain.com/default-mc.jpg",
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
            <li className="text-gray-500">/</li>
            <li>
              <Link href="/mcs" className="text-blue-500 hover:underline">
                MC一覧
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-gray-700">{mc.name}</li>
          </ol>
        </nav>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 mb-6 md:mb-0">
                {mc.imageUrl ? (
                  <Image
                    src={mc.imageUrl}
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
                <h1 className="text-3xl font-bold mb-2">{mc.name}</h1>
                <div className="flex items-center mb-4">
                  {mc.hood && (
                    <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm mr-3">
                      {mc.hood}
                    </div>
                  )}
                  <div className="flex items-center text-gray-600 mr-4">
                    <span className="mr-1">👍</span>
                    <span>{likes}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <span className="mr-1">💬</span>
                    <span>{comments.length}</span>
                  </div>
                </div>

                {mc.description && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">プロフィール</h2>
                    <div
                      className="text-gray-700 leading-relaxed"
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
                        : "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                  >
                    👍 {isLiked ? "いいね済み" : "いいね"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">
                コメント ({comments.length})
              </h2>
              {session ? (
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
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="コメントを入力..."
                      required
                    ></textarea>
                    <button
                      type="submit"
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      投稿する
                    </button>
                  </form>
                </div>
              ) : (
                <p className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                  コメントするには
                  <Link
                    href="/api/auth/signin"
                    className="text-blue-600 hover:underline mx-1"
                  >
                    ログイン
                  </Link>
                  してください
                </p>
              )}

              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        {comment.user?.image && (
                          <Image
                            src={comment.user.image}
                            alt={comment.user.name || "User"}
                            width={32}
                            height={32}
                            className="rounded-full mr-2"
                          />
                        )}
                        <div>
                          <p className="font-medium">
                            {comment.user?.name || "匿名ユーザー"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString(
                              "ja-JP"
                            )}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    まだコメントはありません
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
  const { id } = context.params!;
  const session = await getSession(context);

  try {
    const mc = await prisma.mc.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        likes: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            replies: {
              include: {
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
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!mc) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        mc: JSON.parse(JSON.stringify(mc)),
        session,
      },
    };
  } catch (error) {
    console.error("Error fetching MC:", error);
    return {
      notFound: true,
    };
  }
};
