"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type LandingImageSlotProps = {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
};

export function LandingImageSlot({
  src,
  alt,
  className,
  aspectRatio = "aspect-video",
}: LandingImageSlotProps) {
  const [hasError, setHasError] = useState(false);

  // Extract filename for display in placeholder
  const filename = src.split("/").pop() || "";

  if (hasError) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 p-4 text-center border border-slate-200/60 shadow-sm min-h-[140px] w-full",
          aspectRatio,
          className
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-400 mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Image Slot
        </span>
        <span className="mt-1 text-xs font-semibold text-slate-600 truncate max-w-full px-2">
          {filename}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-slate-100/50 w-full", aspectRatio, className)}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setHasError(true)}
        sizes="(max-w-768px) 100vw, (max-w-1200px) 50vw, 33vw"
      />
    </div>
  );
}
