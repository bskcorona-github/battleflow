/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com", // Google認証用
      "i.ytimg.com", // YouTubeのサムネイル用
      "img.youtube.com", // YouTubeのサムネイル用
      // 他の必要なドメインがあれば追加
    ],
    unoptimized: process.env.NODE_ENV === "development",
  },
  reactStrictMode: true,
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
  async headers() {
    return [
      {
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
    ];
  },
};

module.exports = nextConfig;
