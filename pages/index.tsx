import Head from "next/head";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>BattleFlow - MCバトル情報プラットフォーム</title>
        <meta name="description" content="MCバトルの最新情報をチェック" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          MCバトルビューワー
        </h1>
        {/* ここにホームページのコンテンツを配置 */}
      </main>
    </div>
  );
}
