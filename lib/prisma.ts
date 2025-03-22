import { PrismaClient, Prisma } from "@prisma/client";

// グローバル型の拡張
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Prismaクライアントの設定
const prismaClientOptions: Prisma.PrismaClientOptions = {
  log:
    process.env.NODE_ENV === "development"
      ? [{ emit: "event", level: "query" }, "error", "warn"]
      : ["error"],
};

// 開発環境ではグローバルにキャッシュ、本番環境では新しいインスタンスを作成
const prisma = global.prisma || new PrismaClient(prismaClientOptions);

// 開発環境の場合のみグローバル変数に保存（開発時のホットリロード対策）
if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;

  // 開発環境でのみクエリのパフォーマンスモニタリング
  const prismaEventHandler = (e: Prisma.QueryEvent) => {
    // 100ms以上かかるクエリをログ出力（パフォーマンス問題の早期発見）
    if (e.duration >= 100) {
      console.log(`slow-query: ${e.duration}ms ${e.query}`);
    }
  };

  // @ts-expect-error - Prismaの型定義の問題を回避
  prisma.$on("query", prismaEventHandler);
}

export { prisma };
