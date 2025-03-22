import { ReactNode } from "react";
import Navigation from "./Navigation";
import Link from "next/link";
import BackToTopButton from "./BackToTopButton";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 py-6 sm:px-6 md:py-8">
        {children}
      </main>
      <footer className="bg-primary-dark text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">BattleFlow</h3>
              <p className="text-sm text-gray-300">
                日本最大のMCバトル情報プラットフォーム。
                UMB、フリースタイルダンジョン、高校生ラップ選手権など、
                国内の主要なバトルイベントの情報を提供しています。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">リンク</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/mcs"
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    MC一覧
                  </Link>
                </li>
                <li>
                  <Link
                    href="/battles"
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    バトル一覧
                  </Link>
                </li>
                <li>
                  <Link
                    href="/ranking"
                    className="text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    ランキング
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">お問い合わせ</h3>
              <p className="text-sm text-gray-300">
                ご質問、ご意見、お問い合わせはこちらまで。
              </p>
              <p className="text-sm text-gray-300 mt-2">
                Email: pochiness@gmail.com
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} BattleFlow. All rights reserved.
          </div>
        </div>
      </footer>
      <BackToTopButton />
    </div>
  );
}
