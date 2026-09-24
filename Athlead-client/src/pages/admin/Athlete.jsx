import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/useAuth";
import { Navigate } from "react-router-dom";
import { 
  Search, Filter, Activity, Trophy, Calendar, MapPin, 
  ChevronRight, Star, X, Mail, Phone, Info, Award 
} from "lucide-react";

// Dummy data to simulate athletes based on Issue #25 requirements
const mockAthletes = [
  {
    id: "1",
    fullname: "Sarah Chen",
    email: "sarah.chen@example.com",
    phone: "+1 (555) 012-3456",
    gender: "Female",
    state: "California",
    DOB: "1998-05-14",
    status: "Active",
    scoreSummary: { potentialScore: 85, currentRank: 12, trend: "+5" },
    eventParticipation: [
      { id: "e1", title: "National Summer Games", date: "2026-08-15", result: "Gold" },
      { id: "e2", title: "Regional Qualifiers", date: "2026-06-20", result: "Silver" }
    ],
    accountType: "Pro Athlete",
    joinDate: "2025-02-10",
    image: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    id: "2",
    fullname: "Marcus Johnson",
    email: "m.johnson@example.com",
    phone: "+1 (555) 098-7654",
    gender: "Male",
    state: "Texas",
    DOB: "2001-11-22",
    status: "Injured",
    scoreSummary: { potentialScore: 78, currentRank: 45, trend: "-2" },
    eventParticipation: [
      { id: "e3", title: "Winter Classics", date: "2025-12-05", result: "Participant" }
    ],
    accountType: "Amateur",
    joinDate: "2025-08-01",
    image: "https://i.pravatar.cc/150?u=marcus"
  },
  {
    id: "3",
    fullname: "Elena Rodriguez",
    email: "elena.r@example.com",
    phone: "+1 (555) 345-6789",
    gender: "Female",
    state: "Florida",
    DOB: "1995-03-08",
    status: "Active",
    scoreSummary: { potentialScore: 92, currentRank: 3, trend: "+12" },
    eventParticipation: [
      { id: "e1", title: "National Summer Games", date: "2026-08-15", result: "Bronze" },
      { id: "e4", title: "Miami Open", date: "2026-04-10", result: "Gold" }
    ],
    accountType: "Elite",
    joinDate: "2024-11-15",
    image: "https://i.pravatar.cc/150?u=elena"
  },
  {
    id: "4",
    fullname: "David Kim",
    email: "dkim99@example.com",
    phone: "+1 (555) 876-5432",
    gender: "Male",
    state: "New York",
    DOB: "1999-07-30",
    status: "Inactive",
    scoreSummary: { potentialScore: 65, currentRank: 112, trend: "0" },
    eventParticipation: [],
    accountType: "Amateur",
    joinDate: "2026-01-20",
    image: "https://i.pravatar.cc/150?u=david"
  },
  {
    id: "5",
    fullname: "Aisha Patel",
    email: "apatel.sports@example.com",
    phone: "+1 (555) 222-3333",
    gender: "Female",
    state: "Illinois",
    DOB: "2000-01-12",
    status: "Active",
    scoreSummary: { potentialScore: 88, currentRank: 24, trend: "+3" },
    eventParticipation: [
      { id: "e5", title: "Chicago Marathon", date: "2025-10-10", result: "Top 10" }
    ],
    accountType: "Pro Athlete",
    joinDate: "2025-05-11",
    image: "https://i.pravatar.cc/150?u=aisha"
  }
];

const maskPhone = (phone) => {
  if (!phone) return "N/A";
  // Masks all but the last 4 digits
  return phone.replace(/.(?=.{4})/g, '*');
};

const StatusBadge = ({ status }) => {
  const styles = {
    Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Injured: "bg-amber-100 text-amber-700 border-amber-200",
    Inactive: "bg-slate-100 text-slate-700 border-slate-200"
  };
  
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${styles[status] || styles.Inactive}`}>
      {status}
    </span>
  );
};
const Athlete = () => {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedAthlete, setSelectedAthlete] = useState(null);

  if (user && user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  const filteredAthletes = useMemo(() => {
    return mockAthletes.filter(athlete => {
      const matchesSearch = athlete.fullname.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            athlete.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || athlete.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  return (
    <section className="min-h-screen w-full flex flex-col p-5 sm:p-8 gap-6 bg-slate-50">
      {/* Header Area */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Athlete Management</h1>
          <p className="text-sm text-slate-500 mt-1">View, search, and manage athlete profiles and scores.</p>
        </div>
        
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
          <div className="relative flex-shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Injured">Injured</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </header>

      {/* Athletes Grid */}
      {filteredAthletes.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 border-dashed">
          <Info className="text-slate-400 mb-3" size={32} />
          <p className="text-slate-600 font-medium">No athletes found</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAthletes.map(athlete => (
            <div 
              key={athlete.id} 
              onClick={() => setSelectedAthlete(athlete)}
              className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 cursor-pointer flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="flex justify-between items-start">
                <div className="relative">
                  <img src={athlete.image} alt={athlete.fullname} className="w-14 h-14 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-indigo-100 transition-all" />
                  <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${athlete.status === 'Active' ? 'bg-emerald-500' : athlete.status === 'Injured' ? 'bg-amber-500' : 'bg-slate-400'}`}></div>
                </div>
                <StatusBadge status={athlete.status} />
              </div>

              <div>
                <h3 className="font-semibold text-slate-800 text-lg">{athlete.fullname}</h3>
                <p className="text-sm text-slate-500 truncate">{athlete.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 py-3 border-y border-slate-100">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Score</span>
                  <div className="flex items-center gap-1.5">
                    <Activity size={14} className="text-indigo-500" />
                    <span className="font-semibold text-slate-700">{athlete.scoreSummary.potentialScore}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rank</span>
                  <div className="flex items-center gap-1.5">
                    <Trophy size={14} className="text-amber-500" />
                    <span className="font-semibold text-slate-700">#{athlete.scoreSummary.currentRank}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500 mt-auto">
                <span className="flex items-center gap-1"><MapPin size={14} /> {athlete.state}</span>
                <span className="flex items-center gap-1 font-medium text-indigo-600 group-hover:translate-x-1 transition-transform">
                  View <ChevronRight size={16} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Athlete Profile Modal */}
      {selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div 
            className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header with Gradient */}
            <div className="relative bg-gradient-to-r from-indigo-600 to-purple-700 p-8 pb-12 text-white">
              <button 
                onClick={() => setSelectedAthlete(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-end gap-6">
                <img 
                  src={selectedAthlete.image} 
                  alt={selectedAthlete.fullname} 
                  className="w-24 h-24 rounded-full border-4 border-white/20 shadow-xl object-cover bg-white"
                />
                <div className="mb-2">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-bold">{selectedAthlete.fullname}</h2>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-xs font-semibold rounded-full border border-white/10">
                      {selectedAthlete.accountType}
                    </span>
                  </div>
                  <p className="text-indigo-100 flex items-center gap-2 text-sm">
                    <MapPin size={16} /> {selectedAthlete.state} &bull; {selectedAthlete.gender}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 -mt-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
                
                {/* Score Summary */}
                <div className="flex flex-col items-center justify-center p-4 bg-indigo-50 rounded-xl text-indigo-900">
                  <Activity className="mb-2 text-indigo-500" size={24} />
                  <span className="text-3xl font-bold">{selectedAthlete.scoreSummary.potentialScore}</span>
                  <span className="text-xs font-medium uppercase tracking-wider text-indigo-600/70 mt-1">Potential Score</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-4 bg-amber-50 rounded-xl text-amber-900">
                  <Trophy className="mb-2 text-amber-500" size={24} />
                  <span className="text-3xl font-bold">#{selectedAthlete.scoreSummary.currentRank}</span>
                  <span className="text-xs font-medium uppercase tracking-wider text-amber-600/70 mt-1">Current Rank</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-4 bg-emerald-50 rounded-xl text-emerald-900">
                  <Star className="mb-2 text-emerald-500" size={24} />
                  <span className="text-3xl font-bold">{selectedAthlete.scoreSummary.trend}</span>
                  <span className="text-xs font-medium uppercase tracking-wider text-emerald-600/70 mt-1">Recent Trend</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact & Status Information */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Info className="text-slate-400" size={20} /> Account Details
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Mail size={16} /></div>
                      <div>
                        <p className="text-sm text-slate-800 font-medium">{selectedAthlete.email}</p>
                        <p className="text-xs text-slate-500">Email Address</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Phone size={16} /></div>
                      <div>
                        <p className="text-sm text-slate-800 font-medium">
                          {/* Masking phone to satisfy "Sensitive fields are not unnecessarily displayed" */}
                          {maskPhone(selectedAthlete.phone)}
                        </p>
                        <p className="text-xs text-slate-500">Phone Number (Masked)</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Calendar size={16} /></div>
                      <div>
                        <p className="text-sm text-slate-800 font-medium">{selectedAthlete.DOB}</p>
                        <p className="text-xs text-slate-500">Date of Birth</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Participation */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Award className="text-slate-400" size={20} /> Event History
                  </h3>
                  {selectedAthlete.eventParticipation.length === 0 ? (
                    <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      No event participation recorded yet.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {selectedAthlete.eventParticipation.map(event => (
                        <li key={event.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{event.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{event.date}</p>
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                            event.result === 'Gold' ? 'bg-amber-100 text-amber-700' :
                            event.result === 'Silver' ? 'bg-slate-200 text-slate-700' :
                            event.result === 'Bronze' ? 'bg-orange-100 text-orange-800' :
                            'bg-indigo-50 text-indigo-700'
                          }`}>
                            {event.result}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedAthlete(null)}
                className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Athlete;
