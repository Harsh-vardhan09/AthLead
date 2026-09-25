import { Search, X } from "lucide-react";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { sports } from "../assets/assets";
import EventCard from "../Components/EventCard";
import EventDetails from "../Components/EventDetails";
import { api } from "../api/axios";
import EventCardSkeleton from "../Components/EventCardSkelton";
import toast from "react-hot-toast";

const DEBOUNCE_MS = 300;

const Events = () => {
  const [type, setType] = useState("All");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef(null);

  useEffect(() => {
    const getEvents = async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/api/events");
        setEvents(res.data.events);
      } catch (error) {
        console.log(error);
        toast.error("Failed to load events");
      } finally {
        setIsLoading(false);
      }
    };
    getEvents();
  }, []);

  // Debounce search input to avoid filtering on every keystroke
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceTimer.current);
  }, [search]);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchesSport = type === "All" || e.sport === type;
      const matchesSearch =
        !debouncedSearch ||
        e.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (e.sport || "").toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (e.location || "").toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === "All" || e.status === statusFilter;
      return matchesSport && matchesSearch && matchesStatus;
    });
  }, [events, type, debouncedSearch, statusFilter]);

  const handleReset = () => {
    setSearch("");
    setDebouncedSearch("");
    setType("All");
    setStatusFilter("All");
  };

  const hasActiveFilters =
    search || type !== "All" || statusFilter !== "All";

  if (isLoading)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 my-8 w-full lg:px-20">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    );

  return (
    <section className="relative min-h-screen w-full flex flex-col p-5 gap-5">
      <div className="flex flex-col items-center justify-start min-h-screen w-full">
        {/* Search bar */}
        <div className="flex items-center bg-teal-500/7 border border-teal-950 gap-3 rounded-lg w-full max-w-4xl h-12 px-4">
          <Search size={20} className="text-slate-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, sport, or location..."
            className="w-full outline-none text-white font-segoe"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="text-slate-400 hover:text-white shrink-0"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Sport filter chips */}
        <div className="flex items-start gap-3 mt-5 w-full max-w-4xl flex-wrap">
          {sports.map((sport) => (
            <button
              key={sport}
              className={`border border-gray-700 px-5 py-1 rounded-lg cursor-pointer ${
                type === sport
                  ? "bg-[#2596be] text-white border-green-400/20"
                  : "bg-[#c3d4dc] text-black"
              }`}
              onClick={() => setType(sport)}
            >
              {sport}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-3 mt-3 w-full max-w-4xl">
          <span className="text-slate-400 text-sm">Status:</span>
          {["All", "upcoming", "ongoing", "completed"].map((s) => (
            <button
              key={s}
              className={`border px-4 py-1 rounded-lg text-sm cursor-pointer capitalize ${
                statusFilter === s
                  ? "bg-[#2596be] text-white border-blue-400"
                  : "border-gray-600 text-slate-300 hover:border-gray-400"
              }`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="ml-auto text-sm text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <X size={14} />
              Reset filters
            </button>
          )}
        </div>

        {/* Events grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 my-8 w-full lg:px-20">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-16 text-slate-400">
              <p className="text-lg font-semibold">No events found</p>
              <p className="text-sm mt-1">
                {hasActiveFilters
                  ? "Try adjusting your filters or search query."
                  : "No events have been added yet."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleReset}
                  className="mt-4 px-4 py-2 bg-[#2596be] text-white rounded-lg text-sm hover:bg-[#1a7fa8]"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            filtered.map((event) => (
              <EventCard
                key={event._id}
                e={event}
                setSelected={setSelected}
                setIsOpen={setIsOpen}
                isLoading={isLoading}
              />
            ))
          )}
        </div>
      </div>
      {isOpen && <EventDetails selected={selected} setIsOpen={setIsOpen} />}
    </section>
  );
};

export default Events;
