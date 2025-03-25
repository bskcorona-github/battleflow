import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useTheme } from "@/utils/ThemeContext";

const navigation = [
  { name: "MC一覧", href: "/mcs" },
  { name: "バトル動画", href: "/battles" },
  { name: "ランキング", href: "/ranking" },
  // ... 他のナビゲーション項目
];

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // スクロール検出
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-md py-2"
          : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm py-4"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* ロゴ */}
          <Link
            href="/"
            className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"
          >
            <span className="inline-block bg-gradient-to-r from-purple-600 to-sky-500 text-transparent bg-clip-text">
              BattleFlow
            </span>
          </Link>

          {/* デスクトップメニュー */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-link ${
                    router.pathname === item.href ||
                    router.pathname.startsWith(`${item.href}/`)
                      ? "text-purple-600 dark:text-purple-400 after:w-full"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* ユーザーメニュー */}
            <div className="flex items-center space-x-4">
              {/* テーマ切り替えボタン */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 rounded-full focus:outline-none transition-colors"
                aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
              >
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                  </svg>
                )}
              </button>
              
              {session ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 focus:outline-none">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={32}
                        height={32}
                        className="rounded-full border-2 border-purple-400"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-sky-500 flex items-center justify-center text-white">
                        {session.user?.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <span className="text-gray-800 dark:text-gray-200">
                      {session.user?.name?.split(" ")[0]}
                    </span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 origin-top-right glass-card invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-1 p-2">
                    <div className="py-1">
                      <button
                        onClick={() => signOut()}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-slate-700 rounded-md"
                      >
                        ログアウト
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => signIn("google")}
                  className="btn btn-primary text-sm"
                >
                  ログイン
                </button>
              )}
            </div>
          </div>

          {/* モバイルメニューボタン */}
          <div className="md:hidden flex items-center space-x-3">
            {/* モバイル用テーマ切り替えボタン */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 rounded-full focus:outline-none transition-colors"
              aria-label={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                </svg>
              )}
            </button>
            
            <button
              className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* モバイルメニュー */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 glass-card p-4 animate-fadeIn">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-link ${
                    router.pathname === item.href ||
                    router.pathname.startsWith(`${item.href}/`)
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {session ? (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center space-x-3 mb-3">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-sky-500 flex items-center justify-center text-white">
                        {session.user?.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <span className="text-gray-800 dark:text-gray-200">
                      {session.user?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    ログアウト
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn("google")}
                  className="btn btn-primary w-full"
                >
                  ログイン
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
