import { useState, useEffect } from "react";
import { ChevronUpIcon } from "@heroicons/react/24/solid";

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  // スクロール位置に応じてボタンの表示・非表示を切り替え
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // トップに戻る処理
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary-dark transition-colors duration-300 z-50"
      aria-label="トップに戻る"
    >
      <ChevronUpIcon className="h-6 w-6" />
    </button>
  );
}
