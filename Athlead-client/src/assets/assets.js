import Logo from "./Logo.png";
import court from "./court.jpg";
import { Brain, Globe, Calendar } from "lucide-react";

export const assets = {
  Logo,
  court,
};

export const navItems = [
  { name: "Events", path: "/Events" },
  { name: "Announcements", path: "/news" },
];
export const HiddenItems = [
  { name: "Events", path: "/Events" },
  { name: "Program", path: "/Program" },
  { name: "profile", path: "/Dashboard" },
];

export const features = [
  {
    Icon: Brain,
    title: "AI Player Judging",
    desc: "Computer vision + ML models assess biomechanics, reaction time, and performance in real-time from video uploads.",
    tag: "ML-Powered",
    border: "border-teal-500/20",
    bg: "bg-teal-500/5",
    ic: "text-teal-400",
    iconBg: "bg-teal-500/10",
  },
  {
    Icon: Globe,
    title: "Global Rankings",
    desc: "Dynamic leaderboards updated daily across 30+ disciplines. Compare athletes across states, age groups, and categories.",
    tag: "Live Data",
    border: "border-blue-600/20",
    bg: "bg-blue-600/5",
    ic: "text-blue-400",
    iconBg: "bg-blue-600/10",
  },
  {
    Icon: Calendar,
    title: "Event Management",
    desc: "End-to-end scouting event lifecycle — registration, scheduling, judging panels, and automated result publishing.",
    tag: "Full Stack",
    border: "border-purple-600/20",
    bg: "bg-purple-600/5",
    ic: "text-purple-400",
    iconBg: "bg-purple-600/10",
  },
];

export const sportsSupported = [
  "🏃 Athletics", "🏸 Badminton", "🏑 Hockey", "🏊 Swimming",
  "🤼 Wrestling", "🏹 Archery", "🏓 Table Tennis", "🏋️ Weightlifting",
  "⚽ Football", "🏏 Cricket", "🥊 Boxing", "🤸 Gymnastics",
  "🚴 Cycling", "🏄 Rowing", "🎯 Shooting", "🤺 Fencing",
];

export const faqs = [
  {
    q: "How does the AI scoring system work?",
    a: "Our ML models analyse video submissions using computer vision to assess biomechanics, reaction time, stamina patterns, and technique consistency — generating a composite score across 12 metrics calibrated for each sport.",
  },
  {
    q: "Who can register as an athlete?",
    a: "Any Indian citizen aged 10–35 with a valid Aadhaar ID can register. Athletes are grouped into U-14, U-17, U-21, and Senior categories automatically based on their date of birth.",
  },
  {
    q: "Is the platform free for athletes?",
    a: "Yes. Basic registration, profile creation, and event discovery are completely free. Coaches and academies have a premium plan for bulk assessments and analytics dashboards.",
  },
  {
    q: "How often are rankings updated?",
    a: "Rankings are recalculated every 24 hours based on new assessment results, event outcomes, and coach endorsements. Live event scores update in real-time during competitions.",
  },
  {
    q: "Can coaches and scouts access athlete data?",
    a: "Yes. Verified coaches and scouts from registered academies can view public profiles and request full assessment reports. Athletes control privacy settings from their profile.",
  },
];

export const events = [
  {
    id: 1, title: "National Hockey Trials", sport: "Hockey", category: "National",
    date: "Oct 20, 2024", time: "09:00 AM", location: "Mumbai", state: "Maharashtra",
    status: "open", registered: 234, capacity: 300, prize: "₹5,00,000",
    desc: "Annual national-level hockey trials to identify top youth talent for the Indian junior squad. Open to athletes aged 16–22.",
    tags: ["Youth", "Selection", "National"],
  },
  {
    id: 2, title: "Inter-State Athletics Meet", sport: "Athletics", category: "Inter-State",
    date: "Nov 05, 2024", time: "08:00 AM", location: "Delhi", state: "Delhi",
    status: "open", registered: 412, capacity: 500, prize: "₹3,00,000",
    desc: "Multi-discipline athletics competition bringing together athletes from all 28 states. Track, field, and road events included.",
    tags: ["Track", "Field", "Open"],
  },
  {
    id: 3, title: "AI Scouting Camp – Swimming", sport: "Swimming", category: "Scouting",
    date: "Nov 18, 2024", time: "07:30 AM", location: "Bangalore", state: "Karnataka",
    status: "upcoming", registered: 89, capacity: 150, prize: "₹2,00,000",
    desc: "AI-assisted talent identification camp using computer vision analysis for stroke efficiency and biomechanics scoring.",
    tags: ["AI-Powered", "Scouting", "Youth"],
  },
  {
    id: 4, title: "State Badminton Championship", sport: "Badminton", category: "State",
    date: "Dec 01, 2024", time: "10:00 AM", location: "Hyderabad", state: "Telangana",
    status: "upcoming", registered: 178, capacity: 256, prize: "₹1,50,000",
    desc: "Telangana state badminton championship with singles, doubles, and mixed doubles categories.",
    tags: ["Singles", "Doubles", "State"],
  },
  {
    id: 5, title: "Winter Wrestling Championship", sport: "Wrestling", category: "National",
    date: "Dec 15, 2024", time: "09:00 AM", location: "Chandigarh", state: "Punjab",
    status: "closed", registered: 300, capacity: 300, prize: "₹4,00,000",
    desc: "National-level freestyle and Greco-Roman wrestling championship. All weight categories included.",
    tags: ["Freestyle", "National", "Senior"],
  },
  {
    id: 6, title: "Youth Cricket Talent Hunt", sport: "Cricket", category: "Scouting",
    date: "Jan 10, 2025", time: "08:30 AM", location: "Pune", state: "Maharashtra",
    status: "upcoming", registered: 56, capacity: 200, prize: "₹2,50,000",
    desc: "AI and coaching panel combined assessment for youth cricketers under 19. Batting, bowling, and fielding evaluations.",
    tags: ["U-19", "AI-Powered", "Cricket"],
  },
];
 
export const announcements = [
  {
    id: 1, type: "policy", priority: "high",
    title: "New ML Scoring Framework v2.0 Released",
    body: "The Ministry of Youth Affairs & Sports has officially released the updated ML Scoring Framework v2.0. All new assessments from November 1st will use the enhanced 12-metric model with improved accuracy of 96.4%. Coaches and athletes are advised to review the updated guidelines.",
    date: "Oct 15, 2024", time: "11:30 AM", author: "Ministry of Youth Affairs & Sports",
    tags: ["Policy", "ML Update"],
    image: null, pinned: true,
  },
  {
    id: 2, type: "event", priority: "medium",
    title: "India Wins Asia Cup — Hockey Team Celebrates",
    body: "The Indian hockey team clinched the Asia Cup title defeating Pakistan 3-1 in a thrilling final. Three PlayerAI-tracked athletes — Rohan Singh, Harpreet Bedi, and Mandeep Tomar — were among the top performers identified through our platform last year.",
    date: "Oct 14, 2024", time: "06:00 PM", author: "Sports News Desk",
    tags: ["Hockey", "Achievement"],
    image: "hockey", pinned: false,
  },
  {
    id: 3, type: "recruitment", priority: "high",
    title: "Upcoming Olympics Trials — Registration Open",
    body: "Registration for the Paris 2028 preliminary trials is now open. Athletes across 18 disciplines can apply through the portal. The selection process will involve a combination of ML scoring, coach assessment, and live trials. Deadline: November 30, 2024.",
    date: "Oct 13, 2024", time: "10:00 AM", author: "Olympic Committee India",
    tags: ["Olympics", "Registration"],
    image: null, pinned: true,
  },
  {
    id: 4, type: "technology", priority: "low",
    title: "ML Model Achieves 96% Accuracy in Player Analysis",
    body: "Our computer vision model has reached a new benchmark of 96% accuracy in player biomechanics analysis. This improvement is based on 50,000+ hours of training data across 30 sports disciplines. The update will roll out automatically to all live evaluations.",
    date: "Oct 12, 2024", time: "02:15 PM", author: "Tech Team — PlayerAI",
    tags: ["Tech News", "AI"],
    image: null, pinned: false,
  },
  {
    id: 5, type: "event", priority: "medium",
    title: "National Sports Awards 2024 — Nominations Open",
    body: "The Ministry has opened nominations for the National Sports Awards 2024. Athletes with top ML scores and coaches with highest development ratings are automatically shortlisted. Final selection by the awards committee in December.",
    date: "Oct 10, 2024", time: "09:00 AM", author: "Ministry of Youth Affairs & Sports",
    tags: ["Awards", "Recognition"],
    image: null, pinned: false,
  },
  {
    id: 6, type: "policy", priority: "medium",
    title: "Revised Age Category Guidelines for Scouting Events",
    body: "Effective January 2025, the age categories for scouting events have been revised to align with international standards: U-14, U-17, U-21, and Senior. All event organizers must update their registration forms accordingly.",
    date: "Oct 8, 2024", time: "03:45 PM", author: "Ministry of Youth Affairs & Sports",
    tags: ["Policy", "Guideline"],
    image: null, pinned: false,
  },
];
 
export const recentNews = [
  { title: "India wins Asia Cup!", category: "Soccer", gradient: "from-emerald-500 to-teal-600" },
  { title: "Upcoming Olympics trials announced", category: "Athletics", gradient: "from-blue-600 to-indigo-700" },
  { title: "ML Model achieves 96% accuracy", category: "Tech News", gradient: "from-violet-600 to-purple-700" },
];
 
export const sports = ["All", "Hockey", "Athletics", "Swimming", "Badminton", "Wrestling", "Cricket"];

export const sportIcon = (s) => {
    const icons = {
      Hockey: "🏑",
      Athletics: "🏃",
      Swimming: "🏊",
      Badminton: "🏸",
      Wrestling: "🤼",
      Cricket: "🏏",
      Football: "⚽",
    };
    return icons[s] || "🏅";
  };