"use client";

import * as React from "react";
import { X } from "lucide-react";

interface ImageZoomProps {
  children: React.ReactNode;
}

export function ImageZoom({ children }: ImageZoomProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState<string>("");
  const [imageAlt, setImageAlt] = React.useState<string>("");

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const img = target.tagName === "IMG" ? target : target.querySelector("img");

    if (img) {
      const imgElement = img as HTMLImageElement;
      setImageSrc(imgElement.src);
      setImageAlt(imgElement.alt || "");
      setIsOpen(true);
    }
  };

  return (
    <>
      <div onClick={handleClick} className="cursor-zoom-in">
        {children}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            aria-label="닫기"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="relative max-w-[90vw] max-h-[90vh] p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageSrc}
              alt={imageAlt}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
