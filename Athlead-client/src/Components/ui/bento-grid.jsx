import { ExternalLink } from "lucide-react";
import { cn } from "../../utility/cn.js";

export const BentoGrid = ({
  className,
  children
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-6 md:auto-rows-[18rem] md:grid-cols-3",
        className
      )}>
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  image,
  link
}) => {
  return (
    <div
      className={cn(
        "group/bento shadow-input row-span-1 flex flex-col justify-between space-y-4 rounded-xl bg-linear-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027]  border border-[rgba(6,182,212,0.2)] hover:shadow-[0_0_60px_rgba(6,182,212,0.10)] p-4 transition duration-200 ",
        className
      )}>
      {header}
      <div className=" relative transition duration-200 group-hover/bento:translate-z-2">
        <img src={image} alt="" className="rounded-lg w-full h-48" />
        <div
          className="mt-2 mb-2 font-sans text-xs font-bold text-neutral-200">
          {title}
        </div>
        <div onClick={()=>window.open(link, "_blank")} className="absolute top-3 left-6 font-sans text-xs font-normal text-neutral-300 opacity-0 transition-opacity group-hover/bento:opacity-100">
          <ExternalLink />
        </div>
      </div>
    </div>
  );
};
