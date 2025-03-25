// @ts-ignore - Prismaクライアントのインポートエラーを無視
import { PrismaClient, Prisma } from "@prisma/client";

// Node.jsのグローバル変数を明示的に宣言
declare const global: {
  prisma?: PrismaClient;
  [key: string]: any;
};

// Node.jsのProcess型を明示的に宣言する
declare const process: {
  env: {
    NODE_ENV: "development" | "production" | "test"
  }
};

/**
 * PrismaClientのシングルトンインスタンスを管理するクラス
 */
export class PrismaInstance {
  private static instance: PrismaClient;
  
  /**
   * PrismaClientのシングルトンインスタンスを取得
   */
  public static getInstance(): PrismaClient {
    if (!PrismaInstance.instance) {
      // Prismaクライアントの設定
      const prismaClientOptions: Prisma.PrismaClientOptions = {
        log:
          process.env.NODE_ENV === "development"
            ? [{ emit: "event", level: "query" }, "error", "warn"]
            : ["error"],
      };
      
      // グローバルにキャッシュされているインスタンスを使用するか、新しいインスタンスを作成
      PrismaInstance.instance = global.prisma || new PrismaClient(prismaClientOptions);
      
      // 開発環境の場合のみグローバル変数に保存（開発時のホットリロード対策）
      if (process.env.NODE_ENV !== "production") {
        global.prisma = PrismaInstance.instance;
        
        // 開発環境でのみクエリのパフォーマンスモニタリング
        const prismaEventHandler = (e: Prisma.QueryEvent) => {
          // 100ms以上かかるクエリをログ出力（パフォーマンス問題の早期発見）
          if (e.duration >= 100) {
            console.log(`slow-query: ${e.duration}ms ${e.query}`);
          }
        };
        
        // Prismaのイベントハンドラを登録
        // @ts-ignore - PrismaのAPIの型定義の問題を回避
        PrismaInstance.instance.$on("query", prismaEventHandler);
      }
    }
    
    return PrismaInstance.instance;
  }
}

// 後方互換性のためにprismaオブジェクトをエクスポート
export const prisma = PrismaInstance.getInstance();
