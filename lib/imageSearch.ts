import { google } from "googleapis";
import axios from "axios";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import imageSize from "image-size"; // require()の代わりにimport文を使用

const API_KEYS = [
  process.env.GOOGLE_API_KEY,
  process.env.GOOGLE_API_KEY2,
  process.env.GOOGLE_API_KEY3,
].filter((key): key is string => !!key);

let currentKeyIndex = 0;

// 次のAPIキーを取得する関数
function getNextApiKey(): string {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  return API_KEYS[currentKeyIndex];
}

// 保存済み画像のハッシュを保持する配列
const usedImageUrls: Set<string> = new Set();

// 目標とする画像サイズ
const TARGET_WIDTH = 390;
const TARGET_HEIGHT = 220;
const SIZE_TOLERANCE = 0.3; // 許容誤差（30%）

// 画像サイズをチェックする関数
async function checkImageDimensions(url: string): Promise<boolean> {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    const dimensions = imageSize(buffer);
    if (!dimensions || !dimensions.width || !dimensions.height) {
      return false;
    }

    // 目標サイズとの差異を計算
    const widthDiff = Math.abs(dimensions.width - TARGET_WIDTH) / TARGET_WIDTH;
    const heightDiff =
      Math.abs(dimensions.height - TARGET_HEIGHT) / TARGET_HEIGHT;

    // 許容範囲内かチェック
    return widthDiff <= SIZE_TOLERANCE && heightDiff <= SIZE_TOLERANCE;
  } catch (error) {
    console.warn("Error checking image dimensions:", error);
    return false;
  }
}

interface QueryError {
  code?: number;
  message?: string;
}

export async function searchImages(
  query: string,
  skipUrls: string[] = []
): Promise<string | null> {
  const customsearch = google.customsearch("v1");
  const usedImageUrls = new Set(skipUrls);

  try {
    if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID) {
      throw new Error("Required environment variables are not set");
    }

    const response = await customsearch.cse.list({
      auth: process.env.GOOGLE_API_KEY,
      cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
      q: query,
      searchType: "image",
      num: 10,
      safe: "active",
    });

    if (!response.data.items) {
      console.log("No images found for query:", query);
      return null;
    }

    // 使用可能な画像URLを探す
    for (const item of response.data.items) {
      const imageUrl = item.link;
      if (imageUrl && !usedImageUrls.has(imageUrl)) {
        // 画像の有効性を確認
        try {
          const imageResponse = await fetch(imageUrl, { method: "HEAD" });
          if (
            imageResponse.ok &&
            imageResponse.headers.get("content-type")?.startsWith("image/")
          ) {
            return imageUrl;
          }
        } catch (error) {
          console.error("Error checking image URL:", error);
          continue;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error searching images:", error);
    return null;
  }
}

export async function searchAndSaveImage(
  mcName: string,
  attemptCount = 0,
  startIndex = 1,
  skipUrls: string[] = []
): Promise<string> {
  try {
    if (attemptCount >= API_KEYS.length) {
      throw new Error("QUOTA_EXCEEDED");
    }

    if (!process.env.GOOGLE_SEARCH_ENGINE_ID) {
      throw new Error("GOOGLE_SEARCH_ENGINE_ID is not set");
    }

    const customSearch = google.customsearch("v1");
    const currentKey = API_KEYS[currentKeyIndex];

    // 検索キーワードを「アー写」に変更
    const searchQueries = [
      `${mcName} アー写`,
      `${mcName} アーティスト写真`,
      `${mcName} プロフィール写真`,
      `${mcName} ラッパー`, // バックアップとして残す
    ];

    // 各検索キーワードで試行
    for (const query of searchQueries) {
      try {
        const response = await customSearch.cse.list({
          auth: currentKey,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
          q: query,
          searchType: "image",
          num: 10,
          fileType: "jpg,png",
          safe: "active",
          start: startIndex,
          imgSize: "MEDIUM",
          exactTerms: mcName,
          rights: "cc_publicdomain,cc_attribute,cc_sharealike",
        });

        const items = response.data.items;
        if (!items || items.length === 0) continue;

        // 有効な画像を見つけるまでループ
        for (const item of items) {
          try {
            const imageUrl = item.link;
            if (!imageUrl) continue;

            // スキップすべきURLかチェック
            if (skipUrls.includes(imageUrl) || usedImageUrls.has(imageUrl)) {
              continue;
            }

            const imageExtension = path.extname(imageUrl).toLowerCase();

            // 許可された拡張子かチェック
            if (![".jpg", ".jpeg", ".png"].includes(imageExtension)) {
              continue;
            }

            // 画像サイズをチェック
            const isValidSize = await checkImageDimensions(imageUrl);
            if (!isValidSize) {
              console.log(
                `Skipping image with invalid dimensions: ${imageUrl}`
              );
              continue;
            }

            // 画像をダウンロード
            const imageResponse = await axios.get(imageUrl, {
              responseType: "arraybuffer",
            });
            const buffer = Buffer.from(imageResponse.data, "binary");

            // 保存先ディレクトリの確認と作成
            const saveDir = path.join(process.cwd(), "public", "images", "mcs");
            if (!fs.existsSync(saveDir)) {
              fs.mkdirSync(saveDir, { recursive: true });
            }

            // ファイル名を生成（スペースをアンダースコアに変換）
            const fileName = `${mcName.replace(/\s+/g, "_")}${imageExtension}`;
            const filePath = path.join(saveDir, fileName);

            // 画像を保存
            fs.writeFileSync(filePath, buffer);

            // DBに画像パスを保存
            await prisma.mC.update({
              where: { name: mcName },
              data: { image: `/images/mcs/${fileName}` },
            });

            // 使用済みURLを記録
            usedImageUrls.add(imageUrl);

            return `/images/mcs/${fileName}`;
          } catch (itemError) {
            console.warn(`Failed to process image for ${mcName}:`, itemError);
            continue;
          }
        }
      } catch (error) {
        const queryError = error as QueryError;
        if (
          queryError.code === 429 ||
          queryError.message?.includes("Quota exceeded") ||
          queryError.message?.includes("quota")
        ) {
          console.log(
            `API key ${currentKeyIndex} quota exceeded, switching to next key...`
          );
          getNextApiKey();
          // 同じクエリを新しいAPIキーで再試行
          return searchAndSaveImage(
            mcName,
            attemptCount + 1,
            startIndex,
            skipUrls
          );
        }

        console.warn(`Failed search with query "${query}":`, error);
        continue;
      }
    }

    // 全ての検索キーワードが失敗した場合、次のページを試す
    return searchAndSaveImage(mcName, attemptCount, startIndex + 10, skipUrls);
  } catch (error) {
    console.error(
      `Error with API key ${currentKeyIndex} for ${mcName}:`,
      error
    );

    // 一般的なエラーの場合も、APIキーの切り替えを試みる
    if (error instanceof Error) {
      if (
        error.message.includes("quota") ||
        error.message.includes("limit") ||
        (error as QueryError).code === 429
      ) {
        console.log(`Switching to next API key, attempt ${attemptCount + 1}`);
        getNextApiKey();
        return searchAndSaveImage(
          mcName,
          attemptCount + 1,
          startIndex,
          skipUrls
        );
      }
    }

    throw error;
  }
}
