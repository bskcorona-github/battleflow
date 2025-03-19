import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../lib/prisma";
import { MC, Battle } from "@prisma/client";

const generateSitemap = (mcs: MC[], battles: Battle[]) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>https://your-domain.com</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>https://your-domain.com/ranking</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>
      ${mcs
        .map(
          (mc) => `
        <url>
          <loc>https://your-domain.com/mcs/${mc.id}</loc>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `
        )
        .join("")}
      ${battles
        .map(
          (battle) => `
        <url>
          <loc>https://your-domain.com/battles/${battle.id}</loc>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>
      `
        )
        .join("")}
    </urlset>`;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const mcs = await prisma.mc.findMany();
    const battles = await prisma.battle.findMany();

    const sitemap = generateSitemap(mcs, battles);

    res.setHeader("Content-Type", "text/xml");
    res.write(sitemap);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generating sitemap" });
  }
}
