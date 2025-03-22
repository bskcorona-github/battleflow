import { ReactNode } from "react";
import Navbar from "./Navbar";
import Link from "next/link";
import BackToTopButton from "./BackToTopButton";

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 pt-20 pb-6 sm:px-6 md:pt-24 md:pb-8">
        {children}
      </main>
      <footer className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-inner">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-purple-600 to-sky-500 text-transparent bg-clip-text">
                BattleFlow
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                日本最大のMCバトル情報プラットフォーム。
                UMB、フリースタイルダンジョン、高校生ラップ選手権など、
                国内の主要なバトルイベントの情報を提供しています。
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
                リンク
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/mcs"
                    className="text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    MC一覧
                  </Link>
                </li>
                <li>
                  <Link
                    href="/battles"
                    className="text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    バトル一覧
                  </Link>
                </li>
                <li>
                  <Link
                    href="/ranking"
                    className="text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    ランキング
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
                お問い合わせ
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                ご質問、ご意見、お問い合わせはこちらまで。
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Email: pochiness@gmail.com
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} BattleFlow. All rights reserved.
          </div>
        </div>
      </footer>
      <BackToTopButton />
    </div>
  );
}
