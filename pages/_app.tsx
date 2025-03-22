import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import Head from "next/head";
import Navigation from "../components/Navigation";
import "../styles/globals.css";
import { useRouter } from "next/router";
import { useEffect } from "react";

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
          await fetch("/api/pageviews", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              path: router.pathname || "/",
            }),
          });
        } else {
          // ロード完了を待つ
          window.addEventListener(
            "load",
            async () => {
              await fetch("/api/pageviews", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  path: router.pathname || "/",
                }),
              });
            },
            { once: true }
          );
        }
      } catch (error) {
        console.error("Error recording page view:", error);
      }
    };

    // メインコンテンツのレンダリング後に非同期で記録
    setTimeout(recordPageView, 0);
  }, [router.pathname]);

  return (
    <SessionProvider session={session}>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <title>
          MCバトル | 日本の最新バトル結果・選手情報を網羅 - MCバトルビューワー
        </title>
        <meta
          name="description"
          content="日本国内のMCバトル大会の最新結果、選手情報、ランキングを簡単に閲覧できる専門プラットフォーム。UMB、フリースタイルダンジョン、KING OF KINGSなど主要なMCバトル情報を随時更新中。"
        />
        <meta
          name="keywords"
          content="MCバトル,フリースタイルバトル,UMB,フリースタイルダンジョン,日本語ラップ,ヒップホップ,ラップバトル"
        />
        <meta
          property="og:title"
          content="MCバトル情報総合サイト - MCバトルビューワー"
        />
        <meta
          property="og:description"
          content="MCバトルの全てがここに。最新のバトル結果、選手情報、ランキングをリアルタイムで提供する日本最大のMCバトル情報プラットフォーム。"
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="MCバトルビューワー" />
        <meta
          property="og:image"
          content="https://your-domain.com/og-image.jpg"
        />
        <meta property="og:url" content="https://your-domain.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="MCバトル情報総合サイト - MCバトルビューワー"
        />
        <meta
          name="twitter:description"
          content="日本の最新MCバトル結果、選手情報、ランキングを提供する総合プラットフォーム"
        />
        <meta
          name="twitter:image"
          content="https://your-domain.com/twitter-card.jpg"
        />
        <link rel="canonical" href="https://your-domain.com" />
      </Head>
      <Navigation />
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#333",
            color: "#fff",
          },
          success: {
            style: {
              background: "#22c55e",
            },
          },
          error: {
            style: {
              background: "#ef4444",
            },
          },
        }}
      />
    </SessionProvider>
  );
}
