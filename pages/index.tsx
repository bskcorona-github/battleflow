import Head from "next/head";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
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

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          MCバトルビューワー - 日本最大のMCバトル情報サイト
        </h1>

        <section className="mb-12 text-center">
          <p className="text-xl mb-6 text-gray-700">
            日本全国のMCバトル情報、選手プロフィール、ライブ結果を網羅した総合プラットフォーム
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Link
              href="/mcs"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              MC一覧を見る
            </Link>
            <Link
              href="/ranking"
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              ランキングをチェック
            </Link>
            <Link
              href="/battles"
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              バトル動画を観る
            </Link>
          </div>
        </section>

        {/* MCバトルに関する説明セクション（SEO対策） */}
        <section className="bg-white p-6 rounded-lg shadow-md mb-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            MCバトルとは？
          </h2>
          <p className="mb-4 text-gray-700">
            MCバトル（ラップバトル）は、2人のラッパーが即興で韻を踏んだ言葉を紡ぎ出し、互いの技術や表現力を競い合う言葉の格闘技です。日本では「UMB」「フリースタイルダンジョン」「高校生ラップ選手権」など様々な大会が開催され、多くの才能あるMCが活躍しています。
          </p>
          <p className="text-gray-700">
            当サイト「MCバトルビューワー」では、日本全国の有名MCのプロフィール、バトル動画、ユーザー投票によるランキングなど、MCバトルに関する情報を総合的に提供しています。あなたの好きなMCを応援し、最新のバトル情報をチェックしましょう！
          </p>
        </section>
      </main>
    </div>
  );
}
