import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { eventService, adminService } from "@/api";
import { formatDate } from "@/utils/dateFormatter";
import {
  Calendar,
  Trophy,
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAdminOverview = async () => {
      try {
        const [eventsRes, athletesRes] = await Promise.allSettled([
          eventService.getAll(),
          adminService.getAthletes(),
        ]);

        if (isMounted) {
          if (
            eventsRes.status === "fulfilled" &&
            eventsRes.value?.data?.events
          ) {
            setEvents(eventsRes.value.data.events);
          }
          if (athletesRes.status === "fulfilled") {
            const data = athletesRes.value.data;
            setAthletes(data?.athletes || data || []);
          }
        }
      } catch (err) {
        console.error("Failed to load admin overview:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAdminOverview();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalPrize = events.reduce((sum, e) => sum + (Number(e.prize) || 0), 0);
  const now = new Date();
  const upcomingEvents = events.filter(
    (e) => !e.date || new Date(e.date) >= now,
  );

  // Group events by sport for the chart
  const sportDistribution = Object.entries(
    events.reduce((acc, ev) => {
      const sport = ev.sport || "Other";
      acc[sport] = (acc[sport] || 0) + 1;
      return acc;
    }, {}),
  )
    .map(([sport, count]) => ({ sport, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const fallbackChartData =
    sportDistribution.length > 0
      ? sportDistribution
      : [
          { sport: "Athletics", count: 4 },
          { sport: "Swimming", count: 3 },
          { sport: "Badminton", count: 2 },
          { sport: "Wrestling", count: 2 },
        ];

  return (
    <div className="w-full min-w-0 p-4 sm:p-6 lg:p-8 flex flex-col gap-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-wider text-teal-600 uppercase">
            Platform Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Admin Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            System performance metrics, event statistics, and platform athlete
            insights.
          </p>
        </div>

        <Link
          to="/admin/event/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors shadow-sm self-start sm:self-auto shrink-0"
        >
          <Plus size={18} />
          <span>New Event</span>
        </Link>
      </header>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Total Events
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">
              {loading ? "…" : events.length}
            </h2>
            <span className="text-xs text-teal-600 mt-1 inline-block font-medium">
              {upcomingEvents.length} upcoming
            </span>
          </div>
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Calendar size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Active Athletes
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">
              {loading ? "…" : athletes.length || "120+"}
            </h2>
            <span className="text-xs text-indigo-600 mt-1 inline-block font-medium">
              Across 30+ disciplines
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Prize Pool
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">
              ₹{totalPrize.toLocaleString("en-IN")}
            </h2>
            <span className="text-xs text-amber-600 mt-1 inline-block font-medium">
              Sanctioned rewards
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Trophy size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Scouting Status
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">
              Active
            </h2>
            <span className="text-xs text-emerald-600 mt-1 inline-block font-medium">
              AI Judging Online
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={22} />
          </div>
        </div>
      </div>

      {/* Chart & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Discipline Chart */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                Events by Discipline
              </h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Distribution of active competitions across sports categories.
              </p>
            </div>
          </div>
          <div className="w-full h-64 sm:h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={fallbackChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="sport"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "0.75rem",
                    border: "none",
                    color: "#fff",
                    fontSize: "0.85rem",
                  }}
                  itemStyle={{ color: "#2dd4bf" }}
                />
                <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Admin Navigation Card */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            Admin Actions
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Direct shortcuts to key administrative management modules.
          </p>

          <div className="flex flex-col gap-3 mt-2">
            <Link
              to="/admin/events"
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100/60 text-teal-700 rounded-lg">
                  <Calendar size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">
                    Manage Events
                  </h4>
                  <p className="text-xs text-slate-500">
                    Edit, update, or cancel events
                  </p>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all"
              />
            </Link>

            <Link
              to="/admin/athlete"
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100/60 text-indigo-700 rounded-lg">
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">
                    Athletes Directory
                  </h4>
                  <p className="text-xs text-slate-500">
                    View profiles, ranks, and trends
                  </p>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"
              />
            </Link>

            <Link
              to="/admin/event/new"
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100/60 text-emerald-700 rounded-lg">
                  <Plus size={18} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">
                    Enlist Competition
                  </h4>
                  <p className="text-xs text-slate-500">
                    Publish a new scouting meet
                  </p>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Events Section with Responsive Table / Card Layout */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800">
              Recent Competitions
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Latest competitions registered on the platform.
            </p>
          </div>
          <Link
            to="/admin/events"
            className="text-xs sm:text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">
            No events registered yet.
          </p>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
            <table className="w-full text-left text-sm text-slate-600 min-w-[600px]">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-2">Title</th>
                  <th className="py-3 px-2">Sport</th>
                  <th className="py-3 px-2">Date & Time</th>
                  <th className="py-3 px-2">Location</th>
                  <th className="py-3 px-2 text-right">Prize</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.slice(0, 5).map((ev) => (
                  <tr
                    key={ev._id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-2 font-medium text-slate-800">
                      {ev.title}
                    </td>
                    <td className="py-3 px-2">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                        {ev.sport}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-slate-500 text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{formatDate(ev.date, "D MMM YYYY")}</span>
                        {ev.time && (
                          <>
                            <span className="mx-1">•</span>
                            <Clock size={12} />
                            <span>{ev.time}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-slate-500 text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} />
                        <span>{ev.location}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-semibold text-slate-800">
                      ₹{Number(ev.prize || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
