import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

import "@/styles/globals.css";
import Layout from "@/components/Layout";
import { ThemeProvider } from "@/utils/ThemeContext";

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

    // ページロードが完了してから記録する - 初期表示速度に影響しないように設計
    const recordPageView = () => {
      // 優先度の低いタスクとしてページビュー記録をキューに入れる
      if (window.requestIdleCallback) {
        window.requestIdleCallback(
          () => {
            sendPageViewRecord();
          },
          { timeout: 5000 }
        ); // 5秒後には強制実行
      } else {
        // 非対応ブラウザ用フォールバック
        setTimeout(sendPageViewRecord, 2000); // 2秒遅延
      }
    };

    // ページビュー記録を送信する関数
    const sendPageViewRecord = () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒でタイムアウト

      fetch("/api/pageviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: router.pathname || "/",
        }),
        signal: controller.signal,
      })
        .then((response) => {
          clearTimeout(timeoutId);
          if (!response.ok) {
            console.warn("Failed to record page view:", response.status);
          }
        })
        .catch((err) => {
          if (err.name === "AbortError") {
            console.warn("Page view recording timed out");
          } else {
            console.warn("Error recording page view:", err);
          }
        });
    };

    // DOMの読み込みが完了してから実行
    if (document.readyState === "complete") {
      recordPageView();
    } else {
      window.addEventListener("load", recordPageView, { once: true });
    }

    // クリーンアップ関数
    return () => {
      window.removeEventListener("load", recordPageView);
    };
  }, [router.pathname]);

  return (
    <SessionProvider session={session}>
      <ThemeProvider>
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
      </ThemeProvider>
    </SessionProvider>
  );
}
