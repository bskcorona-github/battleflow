/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "avatars.githubusercontent.com",
      "platform-lookaside.fbsbx.com",
      "i.ytimg.com",
    ],
    unoptimized: process.env.NODE_ENV === "production",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  poweredByHeader: false, // セキュリティのためX-Powered-Byヘッダーを無効化
  compress: true, // Gzip圧縮を有効化
  i18n: {
    locales: ["ja"],
    defaultLocale: "ja",
  },
  swcMinify: true, // SWCによる最適化を有効化
  compiler: {
    // Remove console.log in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },
  // 静的アセットの設定
  assetPrefix:
    process.env.NODE_ENV === "production"
      ? process.env.NEXT_PUBLIC_ASSET_PREFIX || ""
      : "",
  // サーバーの応答ヘッダーを設定
  async headers() {
    return [
      {
        // トップページと静的コンテンツページ
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400", // 1時間キャッシュ、24時間再検証しながら使用
          },
        ],
      },
      {
        // MC一覧ページ
        source: "/mcs",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=600, stale-while-revalidate=3600", // 10分キャッシュ、1時間再検証しながら使用
          },
        ],
      },
      {
        // ランキングページ
        source: "/ranking",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=600, stale-while-revalidate=3600", // 10分キャッシュ、1時間再検証しながら使用
          },
        ],
      },
      {
        // バトル動画ページ
        source: "/battles",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=900, stale-while-revalidate=7200", // 15分キャッシュ、2時間再検証しながら使用
          },
        ],
      },
      {
        // 個別のMC詳細ページ
        source: "/mcs/:id",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=1800, stale-while-revalidate=86400", // 30分キャッシュ、24時間再検証しながら使用
          },
        ],
      },
      {
        // その他全ページ共通の設定
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      // 静的アセットに長期キャッシュを設定
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable", // 1年間キャッシュ（実質無期限）
          },
        ],
      },
      {
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable", // 1年間キャッシュ（実質無期限）
          },
        ],
      },
      // API エンドポイントのキャッシュ設定
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0", // キャッシュなし
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
