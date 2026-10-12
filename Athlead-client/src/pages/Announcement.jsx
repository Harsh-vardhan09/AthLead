import React, { useEffect, useState, useMemo } from "react";
import { newsService } from "../api";
import NewsCard from "../Components/NewsCard";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { BentoGridDemo } from "../Components/Bento";
import { announcements as localAnnouncements } from "../assets/assets.js";
import { EmptyState, ErrorState, LoadingState } from "../Components/AsyncState";

const Announcement = () => {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const getNews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await newsService.getAll();
      if (data.success && data.message.length > 0) {
        setNews(data.message);
      } else if (localAnnouncements && localAnnouncements.length > 0) {
        setNews(localAnnouncements);
      } else {
        setNews([]);
      }
    } catch {
      console.warn("API unavailable, using local announcements fallback");
      setNews(localAnnouncements);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getNews();
  }, []);

  // Build category list dynamically from type + tags fields (case-insensitive dedup)
  const categories = useMemo(() => {
    const map = new Map(); // lowercase -> original display casing
    news.forEach((item) => {
      if (item.type) map.set(item.type.toLowerCase(), item.type);
      if (Array.isArray(item.tags)) {
        item.tags.forEach((t) => map.set(t.toLowerCase(), t));
      }
    });
    return ["All", ...Array.from(map.values())];
  }, [news]);

  // Apply search + category filter together
  const filteredNews = useMemo(() => {
    return news.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        activeCategory === "All" ||
        item.type?.toLowerCase() === activeCategory.toLowerCase() ||
        (Array.isArray(item.tags) &&
          item.tags.some(
            (t) => t.toLowerCase() === activeCategory.toLowerCase(),
          ));

      return matchesSearch && matchesCategory;
    });
  }, [news, searchQuery, activeCategory]);

  if (!isLoading && error) {
    return (
      <section className="relative min-h-screen flex flex-col items-center justify-center mt-10 mx-6">
        <div className="w-full max-w-4xl bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <ErrorState
            title="Failed to Load Announcements"
            error={error}
            onRetry={getNews}
          />
        </div>
      </section>
    );
  }

  if (!isLoading && news.length === 0) {
    return (
      <section className="relative min-h-screen flex flex-col items-center justify-center mt-10 mx-6">
        <div className="w-full max-w-4xl bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <EmptyState
            title="No announcements available"
            description="Check back later for recent news and updates."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center mt-10 mx-6">
      <div className="flex item-start w-full max-w-4xl text-lg lg:text-2xl mb-6">
        <p className="bg-linear-to-b from-teal-600 to-blue-500 font-extrabold mx-1 bg-clip-text text-transparent">
          |
        </p>
        <p className="bg-linear-to-r from-teal-400 to-blue-600 font-extrabold mx-1 bg-clip-text text-transparent">
          All Announcements
        </p>
      </div>

      {/* Search + Filter Bar */}
      {!isLoading && (
        <div className="w-full max-w-4xl flex flex-col gap-4 mb-6">
          <input
            type="text"
            aria-label="Search announcements by title"
            placeholder="Search announcements by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-teal-500 transition-colors"
          />

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  activeCategory === cat
                    ? "bg-teal-500 text-black border-teal-500"
                    : "bg-transparent text-neutral-300 border-neutral-700 hover:border-teal-500"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {!isLoading && filteredNews.length === 0 ? (
        <div className="w-full max-w-4xl bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-6">
          <EmptyState
            title="No announcements match your search"
            description="Try clearing your search query or switching categories."
            action={
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
                className="mt-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/30 hover:bg-teal-500/20 transition-colors cursor-pointer"
              >
                Reset filters
              </button>
            }
          />
        </div>
      ) : (
        <BentoGridDemo items={filteredNews} isLoading={isLoading} />
      )}
    </section>
  );
};

export default Announcement;
