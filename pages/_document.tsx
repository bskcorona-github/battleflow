import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo192.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "MCバトルビューワー",
              url: "https://your-domain.com",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://your-domain.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
              description:
                "日本のMCバトルシーンを見やすく整理したプラットフォーム。バトル結果、MC情報、ランキングなどを提供します。",
              keywords:
                "MCバトル,ラップバトル,フリースタイル,日本語ラップ,ヒップホップ",
            }),
          }}
        />
      </Head>
      <body className="antialiased">
        {/* ダークモードフラッシュ防止のためのスクリプト（改良版） */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getThemePreference() {
                  if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
                    return localStorage.getItem('theme');
                  }
                  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                
                const theme = getThemePreference();
                
                // Explicitly set the theme class on HTML element
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }
                
                // Set as a data attribute for additional CSS targeting
                document.documentElement.setAttribute('data-theme', theme);
                
                // Prevent transition flashes
                document.documentElement.style.colorScheme = theme;
              })();
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
