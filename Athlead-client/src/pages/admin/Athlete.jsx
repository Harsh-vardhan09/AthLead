import React, { useEffect, useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown, Trophy } from "lucide-react";
import { api } from "../../api/axios";

const Athlete = () => {
  const [athletes, setAthletes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortDir, setSortDir] = useState("desc");
  const PAGE_SIZE = 20;

  useEffect(() => {
    const fetchAthletes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get("/api/score/rank", {
          params: { page: 1, limit: 200 },
        });
        setAthletes(res.data.rank || []);
      } catch (err) {
        console.error("Failed to load athletes", err);
        setError("Could not load athlete rankings. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAthletes();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return athletes
      .filter((a) =>
        !q ||
        (a.user?.fullname || "").toLowerCase().includes(q) ||
        (a.user?.role || "").toLowerCase().includes(q),
      )
      .sort((a, b) =>
        sortDir === "desc" ? b.score - a.score : a.score - b.score,
      );
  }, [athletes, search, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = () => {
    setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    setPage(1);
  };

  return (
    <section className="min-h-screen w-full p-5 sm:p-8 bg-slate-50">
      <header className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Athlete Management</h1>
          <p className="text-sm text-slate-500">{filtered.length} athletes</p>
        </div>

        <div className="sm:ml-auto relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-slate-400 w-64"
          />
        </div>
      </header>

      {isLoading && (
        <div className="py-16 text-center text-slate-400 text-sm">Loading athletes…</div>
      )}

      {error && (
        <div className="py-16 text-center text-red-500 text-sm">{error}</div>
      )}

      {!isLoading && !error && (
        <>
          <div className="overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    #
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Athlete
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Role
                  </th>
                  <th
                    className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer select-none"
                    onClick={toggleSort}
                  >
                    <span className="flex items-center gap-1">
                      Score
                      {sortDir === "desc" ? (
                        <ChevronDown size={13} />
                      ) : (
                        <ChevronUp size={13} />
                      )}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageSlice.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      No athletes match your search.
                    </td>
                  </tr>
                )}
                {pageSlice.map((item, idx) => {
                  const globalRank = (page - 1) * PAGE_SIZE + idx + 1;
                  const name = item.user?.fullname || "Unknown";
                  const role = item.user?.role || "USER";
                  const score = typeof item.score === "number" ? item.score.toFixed(2) : "—";
                  return (
                    <tr key={item._id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-slate-500 font-mono text-xs w-12">
                        {globalRank === 1 ? (
                          <Trophy size={14} className="text-amber-400" />
                        ) : (
                          globalRank
                        )}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-800">{name}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500">
                          {role}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-emerald-600 font-semibold">
                        {score}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default Athlete;
