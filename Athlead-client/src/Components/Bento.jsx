import { cn } from "../utility/cn.js";
import React from "react";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid.jsx";

export function BentoGridDemo({ items, isLoading }) {
  if (isLoading)
    return (
      <BentoGrid className="mx-auto my-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} />
        ))}
      </BentoGrid>
    );
  return (
    <BentoGrid className="mx-auto my-6">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          header={item.header}
          image={item.image}
          link={item.url}
          type={item.type || "announcement"}
        />
      ))}
    </BentoGrid>
  );
}

const Skeleton = ({ className }) => (
  <div
    className={cn(
      "animate-pulse space-y-4 flex flex-1 flex-col w-full h-72 rounded-2xl border border-[rgba(6,182,212,0.2)] bg-gradient-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027] p-5",
      className,
    )}
  >
    <div className="aspect-video w-full rounded-xl bg-neutral-800" />
    <div className="h-5 w-3/4 rounded bg-neutral-800" />
    <div className="h-4 w-full rounded bg-neutral-800" />
    <div className="h-4 w-5/6 rounded bg-neutral-800" />
  </div>
);
