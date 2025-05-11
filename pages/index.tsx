import Head from "next/head";
import Link from "next/link";
import UpdateHistory from "../components/UpdateHistory";
import { updateHistory } from "../utils/updateHistory";
import SearchBar from "../components/SearchBar";

export default function Home() {
  // ダミーの onSearch 関数
  const handleSearch = (query: string) => {
    console.log("Search query:", query);
    // ここに実際の検索処理を実装する (例: /search?q=query へ遷移)
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      <Head>
        <title>
          MCバトル公式 | 日本最大のバトルMC情報・ランキングサイト | BattleFlow
        </title>
        <meta
          name="description"
          content="MCバトル専門の情報プラットフォーム。UMBやフリースタイルダンジョン出演者など日本全国の人気MCプロフィール、バトル動画、ファン投票ランキングを完全網羅。最新のバトル結果やMC情報をリアルタイムで更新中！"
        />
        <meta
          name="keywords"
          content="MCバトル,フリースタイルバトル,ラップバトル,UMB,フリースタイルダンジョン,KING OF KINGS,高校生ラップ選手権,日本語ラップ,ヒップホップ,バトルMC,ラッパー"
        />
      </Head>

      {/* ヒーローセクション */}
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-32">
        {/* 背景グラデーション効果 */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-purple-50 to-sky-50 dark:from-slate-900 dark:to-slate-800"></div>
        <div className="absolute top-0 left-0 right-0 h-96 -z-10 bg-gradient-to-r from-purple-200/30 to-sky-200/30 dark:from-purple-900/20 dark:to-sky-900/20 blur-3xl transform -translate-y-1/2"></div>

        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-sky-500 text-transparent bg-clip-text leading-tight">
              日本最大の
              <br className="md:hidden" />
              MCバトル情報サイト
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-gray-700 dark:text-gray-300 leading-relaxed">
              MC選手のプロフィール、バトル動画、ファン投票まで
              <br className="hidden md:inline" />
              すべてのMCバトル情報を一つのプラットフォームで
            </p>

            {/* 検索バーをここに追加 */}
            <div className="mb-8 max-w-xl mx-auto">
              <SearchBar
                onSearch={handleSearch}
                placeholder="MCの名前やキーワードで検索"
              />
            </div>

            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <Link
                href="/mcs"
                className="btn btn-primary min-w-[160px] text-base py-3"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  MC一覧を見る
                </span>
              </Link>
              <Link
                href="/ranking"
                className="btn btn-secondary min-w-[160px] text-base py-3"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 7V3H6v4" />
                    <path d="M18 21H6a2 2 0 0 1-2-2V7h16v12a2 2 0 0 1-2 2Z" />
                    <path d="M9 15h6" />
                    <path d="M12 11v8" />
                  </svg>
                  ランキングをチェック
                </span>
              </Link>
              <Link
                href="/battles"
                className="btn btn-secondary min-w-[160px] text-base py-3"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  バトル動画を観る
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-20">
        {/* 更新履歴セクション */}
        <section className="mb-16 max-w-3xl mx-auto">
          <UpdateHistory items={updateHistory} />
        </section>

        {/* 特徴セクション */}
        <section className="mb-20">
          <h2 className="section-title text-center mx-auto">
            BattleFlowの特徴
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="glass-card p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-purple-600 dark:text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">
                全国のMC情報
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                日本全国の人気MCのプロフィール、活動履歴、成績などを網羅したデータベース
              </p>
            </div>

            <div className="glass-card p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-sky-600 dark:text-sky-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">
                バトル動画
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                UMB、フリースタイルダンジョン、高校生ラップ選手権などの人気バトル動画を整理して提供
              </p>
            </div>

            <div className="glass-card p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-amber-600 dark:text-amber-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">
                ファン投票
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                リアルタイムで変動するファン投票によるMCランキングで、人気のラッパーをチェック
              </p>
            </div>
          </div>
        </section>

        {/* MCバトルに関する説明セクション（SEO対策） */}
        <section className="glass-card p-8 mb-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
            MCバトルとは？
          </h2>
          <p className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
            MCバトル（ラップバトル）は、2人のラッパーが即興で韻を踏んだ言葉を紡ぎ出し、互いの技術や表現力を競い合う言葉の格闘技です。日本では「UMB」「フリースタイルダンジョン」「高校生ラップ選手権」など様々な大会が開催され、多くの才能あるMCが活躍しています。
          </p>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            当サイトでは、日本全国の有名MCのプロフィール、バトル動画、ユーザー投票によるランキングなど、MCバトルに関する情報を総合的に提供しています。あなたの好きなMCを応援し、最新のバトル情報をチェックしましょう！
          </p>
        </section>
      </div>
    </div>
  );
}
