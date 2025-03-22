import { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import { useSession } from "next-auth/react";
import YouTube from "react-youtube";

type Video = {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
  viewCount: string;
};

type SortOrder = "views" | "date_desc" | "date_asc";

// 表示タイプの定義
type ViewType = "board" | "table";

type PaginationInfo = {
  total: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type ApiResponse = {
  videos: Video[];
  pagination: PaginationInfo;
  error?: string;
};

// キーワード設定の型を定義
type SearchKeyword = {
  name: string;
  query: string;
  channelId: string;
};

const SEARCH_KEYWORDS = [
  {
    name: "戦極",
    query: "vs",
    channelId: "UC15ebOqdhmvl1eb0s0jk5aw",
  },
  {
    name: "UMB",
    query: "vs",
    channelId: "UCLn8FintdYEDCSK6HaX5Q4g",
  },
  {
    name: "KOK",
    query: "vs",
    channelId: "UCQbxh2ft3vw9M6Da_kuIa6A",
  },
  {
    name: "NG",
    query: "vs",
    channelId: "UCyGlD1rZjYGs8IjEfA4Kf3A",
  },
  {
    name: "凱旋",
    query: "vs",
    channelId: "UCe_EvY8GrvYgx8PbwRBc75g",
  },
  {
    name: "ADRENALINE",
    query: "vs",
    channelId: "UCj6aXG5H_fm_RAvxH38REXw",
  },
  {
    name: "FSL",
    query: "vs",
    channelId: "UCXIaUFBW7TrZh_utWNILFDQ",
  },
  {
    name: "罵倒",
    query: "vs",
    channelId: "UCbuC7CWNCGwMT_lqRWvKbDQ",
  },
  {
    name: "口喧嘩祭",
    query: "vs",
    channelId: "UCTGmN6Qt8TGs37BtLSCkinQ",
  },
  {
    name: "BATTLE SUMMIT",
    query: "BATTLE SUMMIT",
    channelId: "", // 空文字列を指定して、すべてのチャンネルから検索
  },
];

// 表示件数のオプション
const ITEMS_PER_PAGE_OPTIONS = {
  board: [12, 24, 36], // 3の倍数
  table: [10, 20, 50],
} as const;

// ソート順のオプション
const SORT_OPTIONS = [
  { value: "views", label: "再生回数順" },
  { value: "date_desc", label: "新しい順" },
  { value: "date_asc", label: "古い順" },
] as const;

// 表示タイプのオプション
const VIEW_TYPE_OPTIONS = [
  { value: "board", label: "ボード" },
  { value: "table", label: "テーブル" },
] as const;

export default function Battles() {
  const { data: session } = useSession();
  const [selectedKeyword, setSelectedKeyword] = useState<SearchKeyword>(
    SEARCH_KEYWORDS[0]
  );
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("views");
  const [viewType, setViewType] = useState<ViewType>("board");
  const [page, setPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(
    null
  );
  const [itemsPerPage, setItemsPerPage] = useState<number>(
    ITEMS_PER_PAGE_OPTIONS.board[0]
  );

  // クライアントサイドでのみレンダリングするための状態
  const [isMounted, setIsMounted] = useState(false);

  // マウント後にのみレンダリングを行うようにする
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      if (session?.user?.email) {
        const isAdminEmail = [
          "pochiness@gmail.com",
          "kanemasa.tatsuro@gmail.com",
        ].includes(session.user.email);
        setIsAdmin(isAdminEmail);
      }
    };

    checkAdmin();
  }, [session]);

  // 表示タイプが変更されたときにデフォルトの表示件数に戻す
  useEffect(() => {
    setItemsPerPage(
      viewType === "board"
        ? ITEMS_PER_PAGE_OPTIONS.board[0]
        : ITEMS_PER_PAGE_OPTIONS.table[0]
    );
    setPage(1);
  }, [viewType]);

  // 選択したキーワードの変更を監視する
  useEffect(() => {
    // キーワードが変更されたら、ページをリセットする
    setPage(1);

    // 変更後にビデオを取得する処理は別のuseEffectで行う
    // これにより、selectedKeywordが変更された後、確実にページが1にリセットされてからビデオが取得される
  }, [selectedKeyword]);

  // ビデオデータ取得のuseEffect
  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log(
          `Fetching videos for tab: ${selectedKeyword.name}, channel: ${selectedKeyword.channelId}`
        );

        // キャッシュを完全に無効化するためにタイムスタンプを利用
        const timestamp = Date.now();

        // URLにタブ情報を含める
        const url = `/api/videos?channelId=${encodeURIComponent(
          selectedKeyword.channelId || ""
        )}&keyword=${encodeURIComponent(
          selectedKeyword.query
        )}&sort=${sortOrder}&page=${page}&limit=${itemsPerPage}&tab=${
          selectedKeyword.name
        }&_t=${timestamp}`;

        console.log(`Requesting URL: ${url}`);

        const response = await fetch(url);
        let data: ApiResponse;

        try {
          data = await response.json();
        } catch (e) {
          console.error("JSON parse error:", e);
          throw new Error("レスポンスの解析に失敗しました");
        }

        if (!response.ok) {
          throw new Error(`API error: ${data.error || "Unknown error"}`);
        }

        // デバッグ用ログ
        console.log(
          `Loaded ${data.videos?.length || 0} videos for tab: ${
            selectedKeyword.name
          }`
        );

        // 状態を更新
        setVideos(data.videos || []);
        setPaginationInfo(data.pagination || null);
      } catch (error) {
        console.error("Error fetching videos:", error);
        setError(
          error instanceof Error ? error.message : "動画の取得に失敗しました"
        );
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    // ビデオデータを取得
    fetchVideos();
  }, [selectedKeyword, sortOrder, page, itemsPerPage]);

  const handleManualUpdate = async () => {
    try {
      const response = await fetch("/api/videos/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": session?.user?.email || "",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Update failed:", data);

        // YouTubeのAPIクォータ制限エラーかどうかをチェック
        if (data.details?.includes("quota")) {
          throw new Error(
            "YouTubeのAPI制限に達しました。しばらく時間をおいてから再度お試しください。"
          );
        }

        // その他のエラー
        throw new Error(
          `更新に失敗しました。${
            data.error === "Partial update failure"
              ? "\n一部のチャンネルの更新に失敗しました。"
              : data.error
          }`
        );
      }

      alert("動画情報を更新しました");
      window.location.reload();
    } catch (error: unknown) {
      console.error("Manual update error:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("不明なエラーが発生しました");
      }
    }
  };

  // 表示タイプに応じたコンポーネントを返す関数
  const renderVideos = () => {
    if (videos.length === 0) {
      return (
        <div className="text-center py-8 text-gray-600">
          <p>動画が見つかりませんでした</p>
        </div>
      );
    }

    switch (viewType) {
      case "board":
        return renderBoardView();

      case "table":
        return renderTableView();

      default:
        return null;
    }
  };

  // ページネーションコンポーネント
  const Pagination = () => {
    if (!paginationInfo) return null;

    const { currentPage, totalPages, hasNextPage, hasPreviousPage } =
      paginationInfo;

    return (
      <div className="flex justify-center items-center gap-2 mt-8">
        <button
          onClick={() => setPage(currentPage - 1)}
          disabled={!hasPreviousPage}
          className={`px-4 py-2 rounded-full ${
            hasPreviousPage
              ? "bg-white text-gray-700 hover:bg-gray-100"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          } transition-colors`}
        >
          前へ
        </button>
        <span className="text-gray-600">
          {currentPage} / {totalPages}ページ
        </span>
        <button
          onClick={() => setPage(currentPage + 1)}
          disabled={!hasNextPage}
          className={`px-4 py-2 rounded-full ${
            hasNextPage
              ? "bg-white text-gray-700 hover:bg-gray-100"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          } transition-colors`}
        >
          次へ
        </button>
      </div>
    );
  };

  // 展開中の動画IDを管理するstate
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);

  // YouTubeプレーヤーのオプション
  const opts = {
    height: "390",
    width: "100%",
    playerVars: {
      autoplay: 1,
    },
  };

  // 動画クリック時のハンドラー
  const handleVideoClick = (videoId: string) => {
    setExpandedVideoId(expandedVideoId === videoId ? null : videoId);
  };

  // renderBoardViewをコンポーネント内に移動
  const renderBoardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <div
          key={video.id}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div
            className="cursor-pointer"
            onClick={() => handleVideoClick(video.id)}
          >
            <div className="relative aspect-video">
              <Image
                src={video.thumbnail}
                alt={video.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity">
                <svg
                  className="w-12 h-12 text-white opacity-0 group-hover:opacity-100"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-black">
              {video.title}
            </h3>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{video.channelTitle}</span>
              <span>{video.viewCount}回視聴</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {new Date(video.publishedAt).toLocaleDateString()}
            </div>
          </div>
          {expandedVideoId === video.id && (
            <div className="p-4">
              <YouTube
                videoId={video.id}
                opts={opts}
                className="w-full"
                onEnd={() => setExpandedVideoId(null)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // renderTableViewもコンポーネント内に移動
  const renderTableView = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-6 py-4 text-left text-sm font-bold text-gray-800">
              サムネイル
            </th>
            <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">
              タイトル
            </th>
            <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">
              公開日
            </th>
            <th className="px-6 py-4 text-left text-sm font-bold text-gray-800 whitespace-nowrap">
              再生回数
            </th>
          </tr>
        </thead>
        <tbody>
          {videos.map((video) => (
            <tr key={video.id} className="border-b">
              <td className="py-4 px-6">
                <div
                  className="flex items-center space-x-4 cursor-pointer"
                  onClick={() => handleVideoClick(video.id)}
                >
                  <div className="relative w-40 aspect-video">
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      fill
                      sizes="160px"
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-black">{video.title}</h3>
                    <p className="text-sm text-gray-500">
                      {video.channelTitle}
                    </p>
                  </div>
                </div>
                {expandedVideoId === video.id && (
                  <div className="mt-4">
                    <YouTube
                      videoId={video.id}
                      opts={opts}
                      className="w-full"
                      onEnd={() => setExpandedVideoId(null)}
                    />
                  </div>
                )}
              </td>
              <td className="py-4 px-6 text-sm text-gray-500">
                {video.viewCount}回視聴
              </td>
              <td className="py-4 px-6 text-sm text-gray-500">
                {new Date(video.publishedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // サーバーサイドレンダリング時は何も表示しない
  if (!isMounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>MCバトル一覧 - BattleFlow</title>
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">
          MCバトル一覧
        </h1>

        <div className="flex flex-col gap-4 mb-8">
          {/* キーワード選択ボタン */}
          <div className="flex flex-wrap gap-2 justify-center">
            {SEARCH_KEYWORDS.map((keyword) => (
              <button
                key={keyword.name}
                onClick={() => setSelectedKeyword(keyword)}
                className={`px-4 py-2 rounded-full ${
                  selectedKeyword.name === keyword.name
                    ? "bg-purple-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                } transition-colors`}
              >
                {keyword.name}
              </button>
            ))}
          </div>

          {/* 表示オプション選択 */}
          <div className="flex gap-4 justify-center items-center">
            {/* ソート順選択 */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="text-gray-700">
                並び順:
              </label>
              <select
                id="sort"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 表示タイプ選択 */}
            <div className="flex items-center gap-2">
              <label htmlFor="viewType" className="text-gray-700">
                表示形式:
              </label>
              <select
                id="viewType"
                value={viewType}
                onChange={(e) => setViewType(e.target.value as ViewType)}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {VIEW_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 表示件数選択 */}
            <div className="flex items-center gap-2">
              <label htmlFor="itemsPerPage" className="text-gray-700">
                表示件数:
              </label>
              <select
                id="itemsPerPage"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {(viewType === "board"
                  ? ITEMS_PER_PAGE_OPTIONS.board
                  : ITEMS_PER_PAGE_OPTIONS.table
                ).map((count) => (
                  <option key={count} value={count}>
                    {count}件
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {renderVideos()}
            {!loading && !error && videos.length > 0 && <Pagination />}
          </>
        )}

        {isAdmin && (
          <button
            onClick={handleManualUpdate}
            className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg"
          >
            動画情報を更新
          </button>
        )}
      </main>
    </div>
  );
}
