import { useEffect } from "react";
import { useRouter } from "next/router";

export const usePageView = () => {
  const router = useRouter();

  useEffect(() => {
    // 管理者ページとAPIルートはスキップ
    if (
      router.pathname.startsWith("/api") ||
      router.pathname.startsWith("/admin") ||
      router.pathname.startsWith("/_next") ||
      router.pathname === "/favicon.ico"
    ) {
      return;
    }

    const recordPageView = async () => {
      try {
        const response = await fetch("/api/pageviews", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: router.pathname || "/",
          }),
        });

        if (!response.ok) {
          console.error("Failed to record page view:", await response.text());
        }
      } catch (error) {
        console.error("Error recording page view:", error);
      }
    };

    recordPageView();
  }, [router.pathname]);
};
