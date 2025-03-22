import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  UserGroupIcon,
  FireIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

const Navigation = () => {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // クリックイベントのハンドラーを追加して、ドロップダウン以外をクリックした時に閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-gradient-to-r from-primary-dark to-secondary text-white py-3 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between px-4">
        <Link
          href="/"
          className="text-2xl font-bold tracking-wider hover:text-purple-200 flex items-center gap-2 transition-colors duration-200"
        >
          <FireIcon className="h-8 w-8 text-accent" />
          <span className="hidden sm:inline">BattleFlow</span>
        </Link>

        <div className="flex items-center space-x-4 sm:space-x-8">
          <Link href="/mcs" className="nav-link">
            <UserGroupIcon className="h-5 w-5" />
            <span className="hidden md:inline">MC一覧</span>
          </Link>
          <Link href="/battles" className="nav-link">
            <FireIcon className="h-5 w-5" />
            <span className="hidden md:inline">バトル一覧</span>
          </Link>
          <Link href="/ranking" className="nav-link">
            <ChartBarIcon className="h-5 w-5" />
            <span className="hidden md:inline">ランキング</span>
          </Link>
        </div>

        <div className="flex items-center">
          {session ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none group"
                aria-label="ユーザーメニュー"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white group-hover:border-accent transition-colors duration-200">
                  <Image
                    src={session.user?.image || "/default-avatar.png"}
                    alt={session.user?.name || "ユーザー"}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 min-w-[12rem] max-w-md bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-slate-700 animate-fadeIn">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {session.user?.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-all">
                      {session.user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors duration-150"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="btn btn-ghost border border-white hover:border-purple-300 text-white hidden sm:block"
            >
              Googleでログイン
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
