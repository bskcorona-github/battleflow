import React from "react";
import { UpdateItem } from "../utils/updateHistory";

interface UpdateHistoryProps {
  items: UpdateItem[];
  maxItems?: number;
}

const UpdateHistory: React.FC<UpdateHistoryProps> = ({
  items,
  maxItems = 5,
}) => {
  // 表示する更新履歴の数を制限
  const displayItems = items.slice(0, maxItems);

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
    </div>
  );
};

export default UpdateHistory;
