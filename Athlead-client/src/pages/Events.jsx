import { Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { sports } from "../assets/assets";
import EventCard from "../Components/EventCard";
import EventDetails from "../Components/EventDetails";
import { eventService } from "../api";
import EventCardSkeleton from "../Components/EventCardSkelton";
import toast from "react-hot-toast";

const Events = () => {
  const [type, setType] = useState("All");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("");
  const [location, setLocation] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, type, level, location, dateFrom, dateTo, status]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setHasLoadError(false);

    const timeoutId = setTimeout(async () => {
      try {
        const res = await eventService.getAll(
          {
            q: search.trim() || undefined,
            sport: type === "All" ? undefined : type,
            level: level.trim() || undefined,
            location: location.trim() || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
            status: status || undefined,
            page,
            limit: 24,
          },
          { signal: controller.signal },
        );
        setEvents(res.data.events);
        setPagination(res.data.pagination);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(error);
          setEvents([]);
          setPagination(null);
          setHasLoadError(true);
          toast.error("Could not load events");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [search, type, level, location, dateFrom, dateTo, status, page]);

  return (
    <section className=" relative min-h-screen w-full flex flex-col p-5 gap-5">
      <div className="flex flex-col items-center justify-start min-h-screen w-full">
        <div className=" flex items-center text-start bg-teal-500/7 border border-teal-950 gap-3 rounded-lg w-full max-w-4xl h-12 px-12">
          <Search size={20} className="text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Events..."
            aria-label="Search events by title"
            className="w-full outline-none text-white font-segoe "
          />
        </div>
        <div className="flex items-start gap-3 mt-5 w-full max-w-4xl flex-wrap">
          {sports.map((sport) => (
            <button
              key={sport}
              type="button"
              aria-pressed={type === sport}
              onClick={() => {
                setPage(1);
                setType(sport);
              }}
              className={` border border-gray-700 px-5 py-1 rounded-lg cursor-pointer ${type === sport ? "bg-[#2596be] text-white border-green-400/20" : "bg-[#c3d4dc] text-black"}`}
            >
              {sport}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-5 w-full max-w-4xl">
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Level
            <input
              type="text"
              value={level}
              onChange={(event) => {
                setPage(1);
                setLevel(event.target.value);
              }}
              placeholder="Any level"
              className="rounded-lg border border-gray-700 bg-neutral-900 px-3 py-2 text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Location
            <input
              type="text"
              value={location}
              onChange={(event) => {
                setPage(1);
                setLocation(event.target.value);
              }}
              placeholder="Any location"
              className="rounded-lg border border-gray-700 bg-neutral-900 px-3 py-2 text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            From
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => {
                setPage(1);
                setDateFrom(event.target.value);
              }}
              className="rounded-lg border border-gray-700 bg-neutral-900 px-3 py-2 text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            To
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => {
                setPage(1);
                setDateTo(event.target.value);
              }}
              className="rounded-lg border border-gray-700 bg-neutral-900 px-3 py-2 text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Status
            <select
              value={status}
              onChange={(event) => {
                setPage(1);
                setStatus(event.target.value);
              }}
              className="rounded-lg border border-gray-700 bg-neutral-900 px-3 py-2 text-white"
            >
              <option value="">Any status</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="past">Past</option>
            </select>
          </label>
        </div>

        {/* events */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 my-8 w-full lg:px-20">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <EventCardSkeleton key={i} />
            ))
          ) : events.length > 0 ? (
            events.map((event) => (
              <EventCard
                key={event._id}
                e={event}
                setSelected={setSelected}
                setIsOpen={setIsOpen}
                isLoading={isLoading}
              />
            ))
          ) : hasLoadError ? (
            <p className="col-span-full text-center text-rose-400" role="alert">
              Events could not be loaded. Please try again.
            </p>
          ) : (
            <p className="col-span-full text-center text-slate-400">
              No events match your search and filters.
            </p>
          )}
        </div>
        {pagination && (page > 1 || pagination.hasMore) && (
          <div className="flex items-center gap-4 pb-8">
            <button
              type="button"
              disabled={isLoading || page === 1}
              onClick={() => setPage((currentPage) => currentPage - 1)}
              className="rounded-lg border border-gray-700 px-4 py-2 text-white disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-300">Page {page}</span>
            <button
              type="button"
              disabled={isLoading || !pagination.hasMore}
              onClick={() => setPage((currentPage) => currentPage + 1)}
              className="rounded-lg border border-gray-700 px-4 py-2 text-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
      {isOpen && <EventDetails selected={selected} setIsOpen={setIsOpen} />}
    </section>
  );
};

export default Events;
