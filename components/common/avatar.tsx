"use client";

import Image from "next/image";
import { useState } from "react";

interface AvatarProps {
  src: string;
  alt: string;
  size: number;
  fallbackText: string;
}

export function Avatar({ src, alt, size, fallbackText }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div
        className="rounded-full bg-background flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span
          className="font-bold theme-gradient-text"
          style={{ fontSize: size / 4 }}
        >
          {fallbackText}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
      onError={() => setImageError(true)}
      priority
    />
  );
}
