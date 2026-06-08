import { cn } from "../utility/cn.js";
import React from "react";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid.jsx";

export function BentoGridDemo({ items, isLoading }) {
  if (isLoading)
    return (
      <BentoGrid className="w-4xl mx-auto my-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className={i === 3 || i === 6 ? "md:col-span-2" : ""}
          />
        ))}
      </BentoGrid>
    );
  return (
    <BentoGrid className="max-w-4xl mx-auto my-6">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          header={item.header}
          image={item.image}
          link={item.url}
          className={i === 3 || i === 6 ? "md:col-span-2" : ""}
        />
      ))}
    </BentoGrid>
  );
}
const Skeleton = ({ className }) => (
  <div
    className={cn(
      "animate-pulse space-y-4 flex flex-1 flex-col w-full h-60 min-h-24 rounded-xl bg-linear-to-b from-neutral-200 to-neutral-100 p-8",
      className,
    )}
  >
    <div className="h-48 w-full rounded-lg bg-neutral-800" />
    <div className="h-4 w-3/4 rounded bg-neutral-800" />
    <div className="h-3 w-full rounded bg-neutral-800" />
    <div className="h-3 w-5/6 rounded bg-neutral-800" />
  </div>
);
