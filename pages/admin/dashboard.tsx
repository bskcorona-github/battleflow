import { GetServerSideProps } from "next";
import { getSession } from "next-auth/react";
import { useState } from "react";
import Head from "next/head";
import { prisma } from "../../lib/prisma";
import { useRouter } from "next/router";

type PageView = {
  id: number;
  path: string;
  count: number;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  initialPageViews: PageView[];
};

export default function AdminDashboard({ initialPageViews }: Props) {
  const [pageViews, setPageViews] = useState<PageView[]>(initialPageViews);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const refreshPageViews = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/pageviews");
      if (response.ok) {
        const data = await response.json();
        setPageViews(data);
      } else if (response.status === 401) {
        router.push("/api/auth/signin");
      } else if (response.status === 403) {
        alert("管理者権限が必要です");
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching page views:", error);
      alert("ページビューの取得に失敗しました");
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>管理者ダッシュボード - MCバトルビューワー</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">管理者ダッシュボード</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">ページビュー統計</h2>
            <button
              onClick={refreshPageViews}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "更新中..." : "更新"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ページパス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクセス数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終更新
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pageViews.map((view) => (
                  <tr key={view.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {view.path}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {view.count.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(view.updatedAt).toLocaleString("ja-JP")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const session = await getSession(context);

    if (!session?.user?.email) {
      return {
        redirect: {
          destination: "/api/auth/signin?callbackUrl=/admin/dashboard",
          permanent: false,
        },
      };
    }

    // 管理者チェック
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        isAdmin: true,
      },
    });

    if (!user?.isAdmin) {
      return {
        redirect: {
          destination: "/",
          permanent: false,
        },
      };
    }

    // ページビューデータの取得
    const pageViews = await prisma.pageView.findMany({
      orderBy: {
        count: "desc",
      },
    });

    return {
      props: {
        initialPageViews: JSON.parse(JSON.stringify(pageViews)),
      },
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      redirect: {
        destination: "/error",
        permanent: false,
      },
    };
  }
};
