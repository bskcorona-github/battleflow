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
    <nav className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white p-4 shadow-lg">
      <div className="container mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-bold tracking-wider hover:text-purple-200 flex items-center gap-2"
        >
          <FireIcon className="h-8 w-8 text-yellow-400" />
          BattleFlow
        </Link>
        <div className="flex items-center space-x-8">
          <Link
            href="/mcs"
            className="hover:text-purple-200 transition-colors font-medium flex items-center gap-2"
          >
            <UserGroupIcon className="h-5 w-5" />
            MC一覧
          </Link>
          <Link
            href="/battles"
            className="hover:text-purple-200 transition-colors font-medium flex items-center gap-2"
          >
            <FireIcon className="h-5 w-5" />
            バトル一覧
          </Link>
          <Link
            href="/ranking"
            className="hover:text-purple-200 transition-colors font-medium flex items-center gap-2"
          >
            <ChartBarIcon className="h-5 w-5" />
            ランキング
          </Link>
        </div>
        <div className="flex items-center">
          {session ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white hover:border-purple-300 transition-colors">
                  <Image
                    src={session.user?.image || "/default-avatar.png"}
                    alt={session.user?.name || "ユーザー"}
                    fill
                    className="object-cover"
                  />
                </div>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 min-w-[12rem] max-w-md bg-white rounded-md shadow-lg py-1 z-10">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session.user?.name}
                    </p>
                    <p className="text-sm text-gray-500 break-all">
                      {session.user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="bg-white text-indigo-600 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors font-medium"
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
