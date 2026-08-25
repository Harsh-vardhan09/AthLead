import { api } from "@/api/axios";
import { formatDate } from "@/utils/dateFormatter";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Signal,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

const fields = [
  { name: "title", label: "Title", type: "text" },
  { name: "sport", label: "Sport", type: "text" },
  { name: "level", label: "Level", type: "text" },
  { name: "location", label: "Location", type: "text" },
  { name: "prize", label: "Prize", type: "number" },
  { name: "date", label: "Date", type: "date" },
  { name: "time", label: "Time", type: "time" },
];

const AllEvents = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const res = await api.get("/api/events");
        setEvents(res.data.events);
      } catch (error) {
        console.log(error);
        toast.error("Could not load events");
      }
      setIsLoading(false);
    };
    fetchEvents();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    setBusyId(id);
    try {
      const res = await api.delete(`/api/events/${id}`);
      if (res.data.success) {
        setEvents((prev) => prev.filter((e) => e._id !== id));
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Delete failed");
    }
    setBusyId(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const id = editing._id;
    const data = Object.fromEntries(new FormData(e.target));
    data.prize = Number(data.prize);
    setBusyId(id);
    try {
      const res = await api.patch(`/api/events/${id}`, { data });
      if (res.data.success) {
        setEvents((prev) =>
          prev.map((ev) => (ev._id === id ? res.data.event : ev)),
        );
        setEditing(null);
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Update failed");
    }
    setBusyId(null);
  };

  return (
    <section className="min-h-screen w-full flex flex-col p-5 sm:p-8 gap-6 bg-slate-50">
      <header className="flex items-baseline gap-3">
        <h1 className="text-2xl font-bold text-slate-800">All Events</h1>
        <span className="text-sm text-slate-500">{events.length} total</span>
      </header>

      {isLoading && <p className="text-slate-500">Loading events…</p>}
      {!isLoading && events.length === 0 && (
        <p className="text-slate-500">No events yet.</p>
      )}

      <ul className="flex flex-col gap-4">
        {events.map((event) => (
          <li
            key={event._id}
            className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {event.title}
                </h2>
                <p className="text-sm text-slate-500">{event.sport}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(event)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(event._id)}
                  disabled={busyId === event._id}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>

            <p className="text-sm text-slate-600">{event.description}</p>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-400" />
                {formatDate(event.date, "D MMM YYYY")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-slate-400" />
                {event.time}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-400" />
                {event.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Signal size={14} className="text-slate-400" />
                {event.level}
              </span>
              <span className="flex items-center gap-1.5">
                <Trophy size={14} className="text-slate-400" />₹{event.prize}
              </span>
            </div>

            {event.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {editing && (
        <dialog
          ref={(el) => el?.showModal()}
          onClose={() => setEditing(null)}
          onClick={(e) => e.target.tagName === "DIALOG" && setEditing(null)}
          className="m-auto w-[92vw] max-w-2xl rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-sm"
        >
          <form onSubmit={handleUpdate} className="flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800">
                  Edit event
                </h2>
                <p className="text-sm text-slate-500">{editing.title}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setEditing(null)}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fields.map((f) => (
                <label key={f.name} className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    {f.label}
                  </span>
                  <input
                    name={f.name}
                    type={f.type}
                    required
                    defaultValue={
                      f.name === "date"
                        ? editing.date?.slice(0, 10)
                        : editing[f.name]
                    }
                    className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
                  />
                </label>
              ))}
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Description
              </span>
              <textarea
                name="description"
                rows={3}
                required
                defaultValue={editing.description}
                className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-500 focus:bg-white"
              />
            </label>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyId === editing._id}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {busyId === editing._id ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </dialog>
      )}
    </section>
  );
};

export default AllEvents;
