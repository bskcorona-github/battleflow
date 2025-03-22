import React, { useState } from "react";
import { UpdateItem } from "../utils/updateHistory";

interface UpdateHistoryProps {
  items: UpdateItem[];
  maxItems?: number;
}

const UpdateHistory: React.FC<UpdateHistoryProps> = ({
  items,
  maxItems = 7,
}) => {
  const [expanded, setExpanded] = useState(false);

  // 表示する更新履歴の数を制限
  const displayItems = expanded ? items : items.slice(0, maxItems);

  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        更新履歴
      </h3>
      <ul className="space-y-3">
        {displayItems.map((item, index) => (
          <li
            key={index}
            className="flex items-start gap-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
          >
            <div className="min-w-[110px] text-sm text-gray-500 dark:text-gray-400">
              {item.date}
            </div>
            <div className="text-gray-700 dark:text-gray-300">
              {item.content}
            </div>
          </li>
        ))}
      </ul>

      {items.length > maxItems && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300"
          >
            {expanded ? (
              <>
                <span>折りたたむ</span>
                <svg
                  className="ml-1 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 15l7-7 7 7"
                  ></path>
                </svg>
              </>
            ) : (
              <>
                <span>もっと見る</span>
                <svg
                  className="ml-1 w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default UpdateHistory;
