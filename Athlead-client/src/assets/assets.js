import Logo from "./Logo.png";
import basketball from "./basketball.webp";
import court from "./court.jpg";
import { Brain, Globe, Calendar } from "lucide-react";

export const assets = {
  Logo,
  basketball,
  court,
};

export const navItems = [
  { name: "Events", path: "/Events" },
  { name: "Announcements", path: "/news" },
  { name: "Dashboard", path: "/dashboard" },
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