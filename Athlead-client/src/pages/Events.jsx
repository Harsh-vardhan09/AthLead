import {
  Search,
  RotateCcw,
  Calendar as CalendarIcon,
  MapPin,
  Signal,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { sports } from "../assets/assets";
import EventCard from "../Components/EventCard";
import EventDetails from "../Components/EventDetails";
import { eventService } from "../api";
import EventCardSkeleton from "../Components/EventCardSkelton";
import toast from "react-hot-toast";
import { EmptyState, ErrorState } from "../Components/AsyncState";

const levels = [
  "All",
  "Youth",
  "National",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Professional",
];

const statuses = ["All", "Upcoming", "Ongoing", "Completed"];

const Events = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 6,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Extract filter state from searchParams
  const sport = searchParams.get("sport") || "All";
  const level = searchParams.get("level") || "All";
  const location = searchParams.get("location") || "";
  const date = searchParams.get("date") || "";
  const status = searchParams.get("status") || "All";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const [searchInput, setSearchInput] = useState(search);
  const [locationInput, setLocationInput] = useState(location);

  const updateFilters = React.useCallback(
    (newFilters) => {
      const nextParams = new URLSearchParams(searchParams);
      Object.entries(newFilters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "All" && val !== "") {
          nextParams.set(key, val);
        } else {
          nextParams.delete(key);
        }
      });
      if (!("page" in newFilters)) {
        nextParams.delete("page");
      }
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams],
  );

  const clearSearch = () => {
    setSearchInput("");
    updateFilters({ search: "" });
  };

  const handleReset = () => {
    setSearchInput("");
    setLocationInput("");
    setSearchParams({});
  };

  useEffect(() => {
    setSearchInput(search);
    setLocationInput(location);
  }, [searchParams, search, location]);

  useEffect(() => {
    if (searchInput === search && locationInput === location) return;
    const timer = setTimeout(() => {
      setSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        if (searchInput) nextParams.set("search", searchInput);
        else nextParams.delete("search");
        if (locationInput) nextParams.set("location", locationInput);
        else nextParams.delete("location");
        nextParams.delete("page");
        return nextParams;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, locationInput, search, location, setSearchParams]);

  useEffect(() => {
    let isCancelled = false;
    const getEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = {};
        if (sport && sport !== "All") params.sport = sport;
        if (level && level !== "All") params.level = level;
        if (location) params.location = location;
        if (date) {
          params.dateFrom = date;
          params.dateTo = date;
        }
        if (status && status !== "All") {
          params.status =
            status.toLowerCase() === "completed"
              ? "past"
              : status.toLowerCase();
        }
        if (search) params.q = search;
        params.page = page;
        params.limit = 6;

        const res = await eventService.getAll(params);
        if (isCancelled) return;
        setEvents(res.data.events || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
        setIsLoading(false);

        if (res.data.status && res.data.status !== 200 && res.data.message) {
          toast.error(res.data.message);
        }
      } catch (err) {
        if (isCancelled) return;
        console.error(err);
        setError(err?.response?.data?.message || err?.message || "Failed to load events. Please try again.");
        setIsLoading(false);
      }
    };
    getEvents();
    return () => {
      isCancelled = true;
    };
  }, [sport, level, location, date, status, search, page, retryTrigger]);

  const hasActiveFilters =
    sport !== "All" ||
    level !== "All" ||
    location !== "" ||
    date !== "" ||
    status !== "All" ||
    search !== "";

  return (
    <section className="relative min-h-screen w-full flex flex-col p-5 gap-6">
      <div className="flex flex-col items-center justify-start min-h-screen w-full max-w-6xl mx-auto">
        {/* Search & Main Filter Section */}
        <div className="w-full flex flex-col gap-4 bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="flex items-center text-start bg-slate-800/80 border border-slate-700 gap-3 rounded-xl w-full h-11 px-4 text-slate-200 focus-within:border-teal-500 transition-colors">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search events by title..."
                className="w-full bg-transparent outline-none text-white text-sm placeholder:text-slate-400"
              />
              {searchInput && (
                <button
                  onClick={clearSearch}
                  className="text-slate-400 hover:text-white"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-medium transition-colors shrink-0"
              >
                <RotateCcw size={16} />
                Reset Filters
              </button>
            )}
          </div>

          {/* Filter Controls Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {/* Level Select */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <Signal size={14} /> Level
              </label>
              <select
                value={level}
                onChange={(e) => updateFilters({ level: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500 transition-colors"
                aria-label="Filter by level"
              >
                {levels.map((lvl) => (
                  <option
                    key={lvl}
                    value={lvl}
                    className="bg-slate-800 text-white"
                  >
                    {lvl === "All" ? "All Levels" : lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <MapPin size={14} /> Location
              </label>
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Filter location..."
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500 transition-colors placeholder:text-slate-500"
                aria-label="Filter by location"
              />
            </div>

            {/* Date Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <CalendarIcon size={14} /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => updateFilters({ date: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500 transition-colors color-scheme-dark"
                aria-label="Filter by date"
              />
            </div>

            {/* Status Select */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-1">
                <Clock size={14} /> Status
              </label>
              <select
                value={status}
                onChange={(e) => updateFilters({ status: e.target.value })}
                className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500 transition-colors"
                aria-label="Filter by status"
              >
                {statuses.map((st) => (
                  <option
                    key={st}
                    value={st}
                    className="bg-slate-800 text-white"
                  >
                    {st === "All" ? "All Statuses" : st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sport Selector Pills */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <Filter size={14} /> Sport
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {sports.map((s) => (
                <button
                  key={s}
                  onClick={() => updateFilters({ sport: s })}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    sport === s
                      ? "bg-[#2596be] text-white font-semibold shadow-md border border-cyan-400/30"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-4 w-full">
            <span className="text-xs text-slate-400">Active filters:</span>
            {sport !== "All" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs">
                Sport: {sport}
                <button onClick={() => updateFilters({ sport: "All" })}>
                  <X size={12} />
                </button>
              </span>
            )}
            {level !== "All" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs">
                Level: {level}
                <button onClick={() => updateFilters({ level: "All" })}>
                  <X size={12} />
                </button>
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs">
                Location: {location}
                <button onClick={() => updateFilters({ location: "" })}>
                  <X size={12} />
                </button>
              </span>
            )}
            {date && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs">
                Date: {date}
                <button onClick={() => updateFilters({ date: "" })}>
                  <X size={12} />
                </button>
              </span>
            )}
            {status !== "All" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs">
                Status: {status}
                <button onClick={() => updateFilters({ status: "All" })}>
                  <X size={12} />
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs">
                Search: {search}
                <button onClick={clearSearch}>
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Events Grid or Empty / Loading / Error State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 my-8 w-full">
            {Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="my-8 w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <ErrorState
              title="Unable to load events"
              error={error}
              onRetry={() => setRetryTrigger((prev) => prev + 1)}
            />
          </div>
        ) : events.length === 0 ? (
          <div className="my-8 w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <EmptyState
              title="No events found"
              description="No events match your selected filters."
              action={
                hasActiveFilters ? (
                  <button
                    onClick={handleReset}
                    className="mt-2 text-sm text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={14} /> Clear all filters
                  </button>
                ) : null
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 my-8 w-full">
            {events.map((event) => (
              <EventCard
                key={event._id}
                e={event}
                setSelected={setSelected}
                setIsOpen={setIsOpen}
                isLoading={isLoading}
              />
            ))}
          </div>
        )}

        {/* Pagination Section */}
        {!isLoading && !error && (pagination.page > 1 || pagination.hasMore) && (
          <div className="flex flex-col sm:flex-row items-center justify-between w-full py-4 border-t border-slate-800 text-slate-300 gap-4">
            <span className="text-xs text-slate-400">
              Showing page {pagination.page}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => updateFilters({ page: pagination.page - 1 })}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <button
                disabled={!pagination.hasMore}
                onClick={() => updateFilters({ page: pagination.page + 1 })}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {isOpen && <EventDetails selected={selected} setIsOpen={setIsOpen} />}
    </section>
  );
};

export default Events;
