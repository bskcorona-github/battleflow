import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

import "@/styles/globals.css";
import Layout from "@/components/Layout";

// Google Fontsのインポート
import { Noto_Sans_JP } from "next/font/google";

// Noto Sans JPの設定
const notoSansJP = Noto_Sans_JP({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-jp",
});

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // 管理者ページとAPIルートはスキップ
    if (
      router.pathname.startsWith("/api") ||
      router.pathname.startsWith("/admin") ||
      router.pathname.startsWith("/_next") ||
      router.pathname === "/favicon.ico"
    ) {
      return;
    }

    // ページロードが完了してから記録する
    const recordPageView = async () => {
      try {
        // ウィンドウのロードが完了したタイミングで実行
        if (document.readyState === "complete") {
          const response = await fetch("/api/pageviews", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              path: router.pathname || "/",
            }),
            // タイムアウトを設定
            signal: AbortSignal.timeout(3000), // 3秒でタイムアウト
          }).catch((err) => {
            // フェッチ自体のエラーは静かに処理する（ユーザー体験に影響させない）
            console.warn("Page view tracking failed:", err);
            return null;
          });

          // レスポンスがnullの場合は既にエラー処理済み
          if (!response) return;

          if (!response.ok) {
            console.warn(
              "Failed to record page view:",
              await response.text().catch(() => "Unknown error")
            );
          }
        } else {
          // ロード完了を待つ
          window.addEventListener(
            "load",
            async () => {
              try {
                const response = await fetch("/api/pageviews", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    path: router.pathname || "/",
                  }),
                  // タイムアウトを設定
                  signal: AbortSignal.timeout(3000), // 3秒でタイムアウト
                }).catch((err) => {
                  // フェッチ自体のエラーは静かに処理する
                  console.warn("Page view tracking failed on load:", err);
                  return null;
                });

                // レスポンスがnullの場合は既にエラー処理済み
                if (!response) return;

                if (!response.ok) {
                  console.warn(
                    "Failed to record page view on load:",
                    await response.text().catch(() => "Unknown error")
                  );
                }
              } catch (error) {
                // クライアント側ではエラーを静かに処理する
                console.warn("Error recording page view on load event:", error);
              }
            },
            { once: true }
          );
        }
      } catch (error) {
        // クライアント側ではエラーを静かに処理する（ユーザー体験に影響させない）
        console.warn("Error in recordPageView:", error);
      }
    };

    // メインコンテンツのレンダリング後に非同期で記録
    setTimeout(recordPageView, 0);
  }, [router.pathname]);

  return (
    <SessionProvider session={session}>
      <Head>
        <title>
          MCバトル公式 | 日本最大のバトルMC情報サイト - MCバトルビューワー
        </title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta
          name="description"
          content="日本最大のMCバトル情報プラットフォーム。UMB、フリースタイルダンジョン、KING OF KINGSなど全国のバトルMC、ラップバトル最新結果とランキングをリアルタイムで更新。ユーザー評価による独自のMCランキングも公開中。"
        />
        <meta
          name="keywords"
          content="MCバトル,MCバトル大会,フリースタイルバトル,UMB,フリースタイルダンジョン,高校生ラップ選手権,KING OF KINGS,日本語ラップ,ヒップホップ,ラップバトル,バトルMC"
        />
        <meta
          property="og:title"
          content="MCバトル公式 | 日本最大のバトルMC情報・ランキングサイト - MCバトルビューワー"
        />
        <meta
          property="og:description"
          content="日本最大級のMCバトルデータベース。UMB、フリースタイルダンジョン、高校生ラップ選手権など主要大会の最新情報とMCランキングをファン評価で公開。あなたの好きなMCを応援しよう！"
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:site_name"
          content="MCバトルビューワー（BattleFlow）"
        />
        <meta property="og:image" content="/icons/アイコン1.png" />
        <meta property="og:url" content="https://battleflow.vercel.app" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="MCバトル公式 | 日本最大のバトルMC情報・ランキングサイト"
        />
        <meta
          name="twitter:description"
          content="日本最大級のMCバトルデータベース。全国の人気MC最新情報、ファン投票による独自ランキング、試合結果をリアルタイムで更新中！"
        />
        <meta
          name="twitter:image"
          content="https://battleflow.vercel.app/twitter-card.jpg"
        />
        <link rel="canonical" href="https://battleflow.vercel.app" />
        <link rel="icon" href="/icons/アイコン1.png" />
        <link rel="apple-touch-icon" href="/icons/アイコン1.png" />
        <link rel="mask-icon" href="/icons/アイコン1.png" color="#ff0000" />
      </Head>
      <div className={`${notoSansJP.variable} font-sans`}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "var(--card-bg)",
              color: "var(--foreground)",
              boxShadow: "var(--card-shadow)",
              border: "1px solid var(--card-border)",
            },
            success: {
              style: {
                background: "var(--success)",
                color: "white",
              },
            },
            error: {
              style: {
                background: "var(--danger)",
                color: "white",
              },
            },
          }}
        />
      </div>
    </SessionProvider>
  );
}
