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
};

module.exports = nextConfig;
