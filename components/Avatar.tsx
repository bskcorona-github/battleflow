import React from "react";
import Image from "next/image";

interface AvatarProps {
  src: string | null;
  alt: string;
  size?: number;
  className?: string;
  fallbackClassName?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 40,
  className = "rounded-full object-cover",
  fallbackClassName = "flex items-center justify-center bg-gray-200 text-gray-600 rounded-full font-medium",
}) => {
  const [error, setError] = React.useState(false);

  // 頭文字を取得する関数
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (!src || error) {
    // 画像がない場合またはロード失敗時、頭文字を表示
    return (
      <div className={fallbackClassName} style={{ width: size, height: size }}>
        {getInitials(alt || "NO")}
      </div>
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        className={className}
        onError={() => setError(true)}
      />
    </div>
  );
};

export default Avatar;
