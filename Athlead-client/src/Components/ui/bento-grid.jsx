import { ExternalLink } from "lucide-react";
import { cn } from "../../utility/cn.js";

export const BentoGrid = ({ className, children }) => {
  return (
    <div
      className={cn(
        "mx-auto max-w-7xl columns-1 md:columns-3 gap-6 space-y-6",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({ className, title, image, link }) => {
  return (
    <div
      className={cn(
        "break-inside-avoid mb-6 rounded-xl overflow-hidden shadow-md bg-[#0f2027] group relative",
        className,
      )}
    >
      {/* IMAGE */}
      <img src={image} alt={`Preview image for ${title}`} className="w-full h-auto" loading="lazy" />

      {/* TITLE */}
      <div className="p-3 text-white text-sm font-bold">{title}</div>

      {/* LINK ICON */}
      {link && (
        <button
          type="button"
          onClick={() => window.open(link, "_blank", "noopener,noreferrer")}
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer bg-black/40 p-2 rounded-md"
        >
          <ExternalLink size={16} className="text-white" />
        </button>
      )}
    </div>
  );
};
