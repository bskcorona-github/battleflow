import { GetServerSideProps } from "next";
import { prisma } from "@/lib/prisma";

function SiteMap() {
  // ダミーコンポーネント - getServerSidePropsのみが実行される
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    // 日付フォーマットヘルパー関数
    const formatDate = (date: Date) => {
      return date.toISOString().split("T")[0];
    };

    // 現在の日付（最終更新日として使用）
    const today = formatDate(new Date());

    // 固定ページとその優先度を設定
    const staticPages = [
      { url: "", priority: "1.0", changefreq: "daily" },
      { url: "mcs", priority: "0.9", changefreq: "daily" },
      { url: "ranking", priority: "0.9", changefreq: "daily" },
      { url: "battles", priority: "0.8", changefreq: "daily" },
      { url: "about", priority: "0.5", changefreq: "monthly" },
    ];

    // すべてのMCを取得
    const allMCs = await prisma.mC.findMany({
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // XMLヘッダー
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // 固定ページをXMLに追加
    staticPages.forEach((page) => {
      xml += `
  <url>
    <loc>https://battleflow.vercel.app/${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    // 動的な個別MCページをXMLに追加
    allMCs.forEach((mc) => {
      const mcLastMod = formatDate(mc.updatedAt);
      xml += `
  <url>
    <loc>https://battleflow.vercel.app/mcs/${mc.id}</loc>
    <lastmod>${mcLastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // XMLのクロージングタグ
    xml += `
</urlset>`;

    // XML形式でレスポンスを返す
    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "public, max-age=86400"); // 24時間キャッシュ
    res.write(xml);
    res.end();

    return {
      props: {},
    };
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return {
      props: {},
      notFound: true,
    };
  }
};

export default SiteMap;
