import { useState } from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import { cn } from "../../utility/cn.js";

export const BentoGrid = ({ className, children }) => {
  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:max-w-[96rem] 2xl:gap-8",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  header,
  image,
  link,
  type = "announcement",
}) => {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = Boolean(image) && failedSrc !== image;

  const content = (
    <div className="flex flex-col flex-1">
      {header}

      {/* Card Image / Placeholder */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-900/80 mb-4 border border-white/5">
        {showImage ? (
          <img
            src={image}
            alt={title}
            loading="lazy"
            onError={() => setFailedSrc(image)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover/bento:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800 text-neutral-500">
            <Newspaper className="h-10 w-10 text-cyan-500/60" aria-hidden="true" />
          </div>
        )}

        {/* External Link Floating Badge */}
        {link && (
          <div className="absolute top-2.5 right-2.5 rounded-full bg-black/60 p-1.5 text-cyan-300 backdrop-blur-sm opacity-0 transition-opacity duration-200 group-hover/bento:opacity-100">
            <ExternalLink className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Card Title */}
      <h3 className="line-clamp-2 text-base font-semibold leading-snug text-neutral-100 transition-colors group-hover/bento:text-cyan-300 sm:text-lg">
        {title}
      </h3>
    </div>
  );

  const cardClasses = cn(
    "group/bento relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[rgba(6,182,212,0.25)] bg-gradient-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027] p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]",
    link && "cursor-pointer",
    className,
  );

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View ${type}: ${title}`}
        className={cardClasses}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={cardClasses}>
      {content}
    </div>
  );
};
