import { ArrowRight, Calendar, MapPin, Trophy } from "lucide-react";
import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { useNavigate } from "react-router";
import { useEffect, useCallback } from "react";
import { eventService, rankingService, scoreService } from "../api";
import { useAuth } from "../context/useAuth";
import { formatDate } from "../utils/dateFormatter";
import { millisecondsUntilNextIstMidnight } from "../utils/istDate";
import EditForm from "../Components/EditForm";
import {
  ProfileSkeleton,
  LeaderboardSkeleton,
  ChartSkeleton,
} from "../Components/DashboardSkeleton";
import { EmptyState, ErrorState } from "../Components/AsyncState";

const placeholderScores = [
  { date: "Day 1", score: 50 },
  { date: "Day 2", score: 50 },
  { date: "Day 3", score: 50 },
  { date: "Day 4", score: 50 },
  { date: "Day 5", score: 50 },
];

const Dashboard = () => {
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [scores, setScores] = useState([]);
  const [scoresError, setScoresError] = useState(null);
  const [radarChartData, setRadarChartData] = useState([]);
  const navigate = useNavigate();
  const [editForm, setEditForm] = useState(false);
  // const { user, loading, fetchUser } = useAuth();
  const { user } = useAuth();
  const [rank, setRank] = useState([]);
  const [rankError, setRankError] = useState(null);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [eventsError, setEventsError] = useState(null);
  const [compactCharts, setCompactCharts] = useState(
    () => window.matchMedia("(max-width: 639px)").matches,
  );
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.image]);

  const getInitials = (fullname) => {
    if (!fullname) return "U";
    const parts = fullname.trim().split(" ").filter(Boolean);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const updateChartSize = (event) => setCompactCharts(event.matches);

    mediaQuery.addEventListener("change", updateChartSize);
    return () => mediaQuery.removeEventListener("change", updateChartSize);
  }, []);

  const buildRadarData = (data) => {
    if (!data || typeof data !== "object") return [];
    return [
      { metric: "VO2 Max", value: Number(data.vo2_max) || 0 },
      { metric: "HRV", value: Number(data.hrv) || 0 },
      {
        metric: "Lactate Threshold",
        value: Number(data.lactate_threshold) || 0,
      },
      { metric: "Stride Length", value: Number(data.stride_length) || 0 },
      { metric: "Cadence", value: Number(data.cadence) || 0 },
      {
        metric: "Force Application",
        value: Number(data.force_application) || 0,
      },
      {
        metric: "Performance Score",
        value: Number(data.performance_score) || 0,
      },
      {
        metric: "Adaptability Score",
        value: Number(data.adaptability_score) || 0,
      },
    ];
  };

  useEffect(() => {
    if (!user?._id) {
      setRadarChartData([]);
      return;
    }

    const scoreStorageKey = `athlead_score_data:${user._id}`;

    const loadRadarData = async () => {
      let serverLoaded = false;
      try {
        const res = await scoreService.getScoreInput();
        if (res.data?.success && res.data?.data) {
          const scoreData = res.data.data;
          const radarData = buildRadarData(scoreData);
          if (radarData.length > 0) {
            setRadarChartData(radarData);
            localStorage.setItem(scoreStorageKey, JSON.stringify(scoreData));
            serverLoaded = true;
          }
        }
      } catch (error) {
        console.error("Failed to fetch score input from server:", error);
      }

      if (!serverLoaded) {
        const storedScore = localStorage.getItem(scoreStorageKey);
        if (storedScore) {
          try {
            const scoreData = JSON.parse(storedScore);
            setRadarChartData(buildRadarData(scoreData));
          } catch (error) {
            console.error("Failed to parse stored score data:", error);
            setRadarChartData([]);
          }
        } else {
          setRadarChartData([]);
        }
      }
    };

    loadRadarData();
  }, [user]);

  const fetchScores = useCallback(async () => {
    setScoresError(null);
    try {
      const scoresRes = await scoreService.getMyScores();
      const formattedScores = (scoresRes.data.scores || []).map((item) => ({
        ...item,
        date: formatDate(item.date, "DD MMM YY"),
      }));
      setScores(formattedScores);
    } catch (error) {
      console.error("Failed to load scores:", error);
      setScoresError(error?.response?.data?.message || "Failed to load scores");
    }
  }, []);

  const fetchRank = useCallback(async () => {
    setRankError(null);
    try {
      const rankRes = await rankingService.getRanking();
      const rankWithIsMe = (rankRes.data.rank || []).map((item, index) => ({
        ...item,
        originalRank: index + 1,
        isMe: item.user?._id === user?._id || item.isMe,
      }));
      setRank(rankWithIsMe);
    } catch (error) {
      console.error("Failed to load rankings:", error);
      setRankError(error?.response?.data?.message || "Failed to load rankings");
    }
  }, [user]);

  const fetchRegisteredEvents = useCallback(async () => {
    setEventsError(null);
    try {
      const myEventsRes = await eventService.getMyEvents();
      setRegisteredEvents(
        Array.isArray(myEventsRes.data) ? myEventsRes.data : [],
      );
    } catch (error) {
      console.error("Failed to load registered events:", error);
      setEventsError(
        error?.response?.data?.message || "Failed to load registered events",
      );
      setRegisteredEvents([]);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setDashboardLoading(false);
      return;
    }

    const initDashboard = async () => {
      setDashboardLoading(true);
      await Promise.allSettled([
        fetchScores(),
        fetchRank(),
        fetchRegisteredEvents(),
      ]);
      setDashboardLoading(false);
    };

    initDashboard();
  }, [user, fetchScores, fetchRank, fetchRegisteredEvents]);

  useEffect(() => {
    if (!user?._id) return undefined;

    let active = true;
    let refreshTimeout;
    const scheduleRefresh = () => {
      if (!active) return;

      refreshTimeout = window.setTimeout(() => {
        fetchRegisteredEvents();
        scheduleRefresh();
      }, millisecondsUntilNextIstMidnight());
    };

    scheduleRefresh();

    return () => {
      active = false;
      window.clearTimeout(refreshTimeout);
    };
  }, [user?._id, fetchRegisteredEvents]);

  // if (loading) return null;

  const getDisplayRankings = () => {
    const topFive = rank.slice(0, 5);
    const isMeInTopFive = topFive.some((p) => p.isMe);

    if (isMeInTopFive || rank.length <= 5) {
      return topFive;
    }

    const myData = rank.find((p) => p.isMe);
    if (myData) {
      return [...topFive, myData];
    }

    return topFive;
  };

  return (
    <section className="dark-bg relative max-w-screen min-h-screen flex flex-col items-start justify-center">
      {/* Profile + Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-5 p-4 sm:p-6 lg:p-10">
        {/* Profile Card */}
        <div className="w-full min-w-0 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-linear-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027] border border-[#1d9e75]/40 text-start text-white rounded-2xl shadow-xl">
          <div className="flex min-w-0 w-full items-center gap-3">
            {dashboardLoading ? (
              <ProfileSkeleton />
            ) : (
              <>
                {user?.image && !avatarError ? (
                  <img
                    src={user.image}
                    alt={user.fullname || "Profile"}
                    onError={() => setAvatarError(true)}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-2 shrink-0 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold text-xl flex items-center justify-center shrink-0">
                    {getInitials(user?.fullname)}
                  </div>
                )}

                <div className="flex min-w-0 flex-col items-start justify-center">
                  <h1 className="font-semibold font-segoe text-xl break-words">
                    {user?.fullname}
                  </h1>

                  <div className="flex flex-wrap items-center text-sm sm:text-md basic gap-x-3 gap-y-1">
                    <p className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1 shrink-0" />
                      {user?.state}
                    </p>

                    <p className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 shrink-0" />
                      {formatDate(user?.DOB, "DD MMM")}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-full sm:w-auto flex justify-end items-end">
            <button
              onClick={() => setEditForm(true)}
              className="h-10 w-full sm:w-28 md:h-12 bg-linear-to-r from-teal-300 to-teal-800 rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:from-teal-500 hover:to-blue-600 transition-all hover:ease-in-out"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* ML Leaderboard */}
        <div className="w-full min-w-0 bg-linear-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027] border border-[#1d9e75]/40 text-start text-white rounded-2xl shadow-xl">
          <div className="flex items-center justify-center mb-4">
            <div className="font-bold text-[14px] text-white">
              ML Leaderboard
            </div>
          </div>

          <div
            className="w-full max-w-full overflow-x-auto overscroll-x-contain rounded-b-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            role="region"
            aria-label="ML leaderboard, horizontally scrollable"
            tabIndex={0}
          >
            <table className="w-full min-w-[620px] lg:min-w-0 border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="text-[11px] text-slate-200 uppercase tracking-wide">
                  {["#", "Athlete", "Sport", "State", "ML Score", "Δ"].map(
                    (h) => (
                      <th
                        key={h}
                        className={`px-3 py-3 whitespace-nowrap ${
                          h == "#" || h == "ML Score" ? "w-8" : "w-20"
                        } font-semibold border-b border-white/4 ${
                          h === "#" ||
                          h === "Δ" ||
                          h === "score" ||
                          h === "state"
                            ? "text-center"
                            : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                {dashboardLoading ? (
                  <LeaderboardSkeleton />
                ) : rankError ? (
                  <tr>
                    <td colSpan="6" className="py-6">
                      <ErrorState
                        title="Failed to load leaderboard"
                        error={rankError}
                        onRetry={fetchRank}
                      />
                    </td>
                  </tr>
                ) : rank.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6">
                      <EmptyState
                        title="No leaderboard data available"
                        description="Athlete rankings will appear here once scores are generated."
                      />
                    </td>
                  </tr>
                ) : (
                  getDisplayRankings().map((p, i) => (
                    <tr
                      key={p.user?._id || `athlete-${i}`}
                      className={`border-b text-slate-200 border-white/3 transition-colors ${
                        p.isMe ? "bg-teal-500/3" : "hover:bg-white/2"
                      }`}
                    >
                      <td className="px-3 py-3 text-center align-middle">
                        {p.originalRank && p.originalRank <= 4 ? (
                          <div
                            className={`mx-auto w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                              p.originalRank === 1
                                ? "bg-amber-400/20 text-amber-400"
                                : p.originalRank === 2
                                  ? "bg-slate-300/20 text-slate-300"
                                  : p.originalRank === 3
                                    ? "bg-amber-700/20 text-amber-500"
                                    : "bg-slate-500/15 text-slate-400"
                            }`}
                          >
                            {p.originalRank}
                          </div>
                        ) : (
                          <span className="inline-block w-5 text-[11px] text-slate-300">
                            {p.originalRank || "-"}
                          </span>
                        )}
                      </td>

                      <td
                        className={`px-3 py-3 whitespace-nowrap text-[13px] font-medium ${
                          p.isMe ? "text-teal-300" : "text-slate-200"
                        }`}
                      >
                        {p.user?.fullname?.split(" ")[0]}{" "}
                      </td>

                      <td className="px-3 py-3 whitespace-nowrap capitalize">
                        {p.sport || p.user?.sport || "N/A"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {p.user?.state}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{p.score}</td>
                      <td className="px-3 py-3 text-center whitespace-nowrap">
                        {p.trend}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="px-3 pb-3 pt-1 text-xs text-slate-300 sm:hidden">
            Swipe horizontally to see all leaderboard columns.
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-5 px-4 sm:px-6 lg:px-10 mb-5">
        {/* Radar Chart */}
        <div className="min-h-[360px] min-w-0 flex flex-col bg-linear-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027] border border-[#1d9e75]/40 text-start text-white rounded-xl shadow-xl">
          <div className="min-h-[300px] min-w-0 w-full flex-1 flex items-center justify-center p-2 sm:p-5">
            {dashboardLoading ? (
              <ChartSkeleton className="w-full h-[300px]" />
            ) : radarChartData.length === 0 ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center px-6">
                <p className="text-gray-300 font-medium">
                  No score generated yet.
                </p>

                <p className="text-gray-500 text-sm mt-1">
                  Generate a score to view your performance metrics.
                </p>
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={compactCharts ? 270 : 300}
              >
                <RadarChart
                  outerRadius={compactCharts ? "75%" : "68%"}
                  data={radarChartData}
                  margin={{
                    top: compactCharts ? 8 : 20,
                    left: compactCharts ? 8 : 30,
                    right: compactCharts ? 8 : 30,
                    bottom: compactCharts ? 8 : 20,
                  }}
                >
                  <PolarGrid />

                  <PolarAngleAxis
                    dataKey="metric"
                    tick={
                      compactCharts ? false : { fontSize: 12, fill: "#cbd5e1" }
                    }
                    tickLine={false}
                  />

                  <PolarRadiusAxis tick={!compactCharts} />

                  <Radar
                    name="aarsh"
                    dataKey="value"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>

          {!dashboardLoading && radarChartData.length > 0 && (
            <div
              className="grid grid-cols-2 gap-2 px-4 pb-3 sm:hidden"
              aria-label="Performance metric values"
            >
              {radarChartData.map(({ metric, value }) => (
                <div
                  key={metric}
                  className="min-w-0 rounded-lg border border-white/10 bg-white/5 px-2 py-2"
                >
                  <p className="break-words text-[11px] leading-snug text-slate-300">
                    {metric}
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {value ?? "—"}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center px-3">
            <button
              onClick={() => navigate("/score")}
              className="flex justify-center w-full sm:w-2/3 bg-linear-to-r from-teal-500 via-blue-900 to-blue-200 cursor-pointer my-2 rounded-md p-2 hover:scale-105"
            >
              Get Score
            </button>
          </div>
        </div>

        {/* Line Chart */}
        <div className="min-h-[360px] min-w-0 flex items-center py-5 px-3 sm:p-5 bg-linear-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027] border border-[#1d9e75]/40 text-start text-white rounded-2xl shadow-xl overflow-hidden">
          {dashboardLoading ? (
            <ChartSkeleton className="w-full h-[300px]" />
          ) : scoresError ? (
            <div className="w-full h-[300px] flex items-center justify-center">
              <ErrorState
                title="Failed to load performance scores"
                error={scoresError}
                onRetry={fetchScores}
              />
            </div>
          ) : scores.length === 0 ? (
            <div className="relative h-[300px] w-full min-w-0">
              <div aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={placeholderScores}>
                    <XAxis
                      dataKey="date"
                      className="text-xs"
                      stroke="#444"
                      interval={compactCharts ? "preserveStartEnd" : 0}
                      angle={compactCharts ? -25 : 0}
                      textAnchor={compactCharts ? "end" : "middle"}
                      height={compactCharts ? 50 : 30}
                    />
                    <YAxis className="text-xs" stroke="#444" />

                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#6366f1"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      strokeOpacity={0.3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 bg-black/20 rounded-xl">
                <p className="text-gray-300 font-medium">
                  No performance data available yet.
                </p>

                <p className="text-gray-500 text-sm mt-1">
                  Data will appear here once sufficient activity has been
                  recorded.
                </p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height={compactCharts ? 250 : 300}
            >
              <LineChart data={scores}>
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  stroke="#888"
                  interval={compactCharts ? "preserveStartEnd" : 0}
                  angle={compactCharts ? -25 : 0}
                  textAnchor={compactCharts ? "end" : "middle"}
                  height={compactCharts ? 50 : 30}
                />
                <YAxis className="text-xs" stroke="#888" />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#2d3748",
                    borderColor: "#4a5568",
                    color: "#fff",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#a0aec0" }}
                />

                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Registered Events */}
      <div className="w-full px-4 sm:px-10 pb-10">
        <div className="w-full min-w-0 bg-linear-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027] border border-[#1d9e75]/40 text-start text-white rounded-2xl shadow-xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-3">
            <div className="min-w-0">
              <h2 className="font-bold text-lg">My Registered Events</h2>

              <p className="basic text-sm">
                Upcoming commitments from your event registrations
              </p>
            </div>

            <button
              onClick={() => navigate("/events")}
              className="hidden sm:flex items-center gap-2 rounded-lg border border-[#1d9e75]/40 px-4 py-2 text-sm text-teal-200 hover:bg-[#1d9e75]/15 transition cursor-pointer"
            >
              Browse Events
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {dashboardLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 rounded-xl bg-white/5 border border-white/10 animate-pulse"
                />
              ))}
            </div>
          ) : eventsError ? (
            <div className="mt-4">
              <ErrorState
                title="Failed to load registered events"
                error={eventsError}
                onRetry={fetchRegisteredEvents}
              />
            </div>
          ) : registeredEvents.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="No events registered yet"
                description="Upcoming commitments from your event registrations will appear here."
                action={
                  <button
                    onClick={() => navigate("/events")}
                    className="flex items-center gap-2 rounded-lg bg-linear-to-r from-teal-500 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-teal-600 hover:to-cyan-700 transition cursor-pointer"
                  >
                    Browse Events
                    <ArrowRight className="h-4 w-4" />
                  </button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              {registeredEvents.map((registration) => {
                const event = registration.event || {};

                const formattedDate = event.date
                  ? formatDate(event.date)
                  : "Date TBD";

                return (
                  <div
                    key={registration._id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/8 transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-lg bg-[#1d9e75]/15 border border-[#1d9e75]/30 flex items-center justify-center text-teal-200">
                        <Trophy className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-base text-white truncate">
                          {event.name || "Untitled Event"}
                        </h3>

                        <p className="basic text-sm">
                          {event.sport || "Sport"} &bull; {formattedDate}
                        </p>

                        <p className="basic text-sm flex items-center gap-1 mt-2 break-words">
                          <MapPin className="h-4 w-4 text-teal-400 shrink-0" />
                          {event.location || "Location TBD"}
                        </p>

                        <div className="mt-3 inline-flex rounded-full border border-[#1d9e75]/40 bg-[#1d9e75]/15 px-3 py-1 text-xs font-medium text-teal-200">
                          Status: {registration.status || "Registered"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editForm && <EditForm setEditForm={setEditForm} />}
    </section>
  );
};

export default Dashboard;
