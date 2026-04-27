import { Calendar, ChevronRight, Clock, LocateIcon, MapPin } from "lucide-react";
import React, { useState } from "react";
import { leaderboard, radarData } from "../assets/assets";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { useEffect } from "react";
import { api } from "../api/axios";
import dayjs from "dayjs";
import EditForm from "../Components/EditForm";

const Dashboard = () => {
  const [scores, setScores] = useState([]);
  const navigate = useNavigate();
  const [editForm, setEditForm] = useState(false);
  const [user,setUser]=useState({});
  const [rank,setRank]=useState([])
  useEffect(() => {

    const getScore = async () => {
      const scores = await api.get("/api/my-scores");
      const formattedScores = scores.data.scores.map((item) => ({
        ...item,
        date: dayjs(item.date).format("DD MMM YY"),
      }));
      setScores(formattedScores);
    };
    getScore();

    const getUser=async()=>{
      const resUser=await api.get('/api/user/me');
      setUser(resUser.data.user);
      console.log(resUser);
    }
    getUser()

    const getRank=async()=>{
      const res=await api.get('/api/score/rank');
      setRank(res.data.rank)
      console.log(res.data.rank);
      
    }
    getRank()

  }, []);

  return (
    <section className="dark-bg relative max-w-screen min-h-screen flex flex-col items-start justify-center">
      <div className="grid grid-cols-1 md:grid-cols-2  mt-10 w-full gap-5 p-10">
        <div className=" flex items-center justify-around gap-3 max-w-full bg-linear-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027] border border-[#1d9e75]/40 text-start text-white rounded-2xl shadow-xl">
          <div className="flex gap-3">
            <img
              src={user.image}
              alt=""
              className="w-25 h-25 rounded-full p-2"
            />

            <div className="flex flex-col items-start justify-center">
              <h1 className="font-semibold font-segoe text-xl ">{user.fullname}</h1>
              <div className="flex  text-md basic gap-3">
                
                <p className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" /> {user.state}
                </p>
                <p className="flex items-center ">
                  <Calendar className="h-4 w-4 mr-1" />
                  {dayjs(user.DOB).format('DD MMM ')}
                </p>
              </div>
            </div>
          </div>

          <div className=" flex justify-end items-end">
            <button
              onClick={() => setEditForm(true)}
              className="h-5 w-20 md:h-12 bg-linear-to-r from-teal-300 to-teal-800 rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:from-teal-500 hover:to-blue-600 transition-all hover:ease-in-out"
            >
              Edit Form
            </button>
          </div>
        </div>
        <div className="max-w-full bg-linear-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027] border border-[#1d9e75]/40 text-start text-white rounded-2xl shadow-xl">
          <div className="flex items-center justify-center mb-4">
            <div className="font-bold text-[14px] text-white">
              ML Leaderboard
            </div>
          </div>
          <table className="w-full  border-collapse ">
            <thead>
              <tr className="text-[10px] text-white uppercase ">
                {["#", "Athlete", "Sport", "State", "ML Score", "Δ"].map(
                  (h) => (
                    <th
                      key={h}
                      className={`pb-2.5 ${h == "#" || h == "ML Score" ? "w-8" : "w-20"} font-semibold border-b border-white/4  ${h === "#" || h === "Δ" || h === "score" || h === "state" ? "text-center" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {rank.map((p,i) => (
                <tr
                  key={p}
                  className={`border-b basic border-white/3 transition-colors ${p.isMe ? "bg-teal-500/3" : "hover:bg-white/2"}`}
                >
                  <td className="flex items-center justify-center">
                    {i <= 3 ? (
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center  text-[10px] font-black ${i === 1 ? "bg-amber-400/15 text-amber-400" : i ? "bg-slate-400/15 text-slate-400" : "bg-orange-800/15 text-orange-700"}`}
                      >
                        {i+1}
                      </div>
                    ) : (
                      <span className="text-[11px] w-5 h-5 text-slate-600 pl-1">
                        {i+1}
                      </span>
                    )}
                  </td>
                  <td
                    className={`mr-3 text-[13px] font-medium ${p.isMe ? "text-teal-300" : "text-slate-200"}`}
                  >
                    {p.user.fullname}{" "}
                  </td>
                  <td className="text-sm pl-1">cycling</td>
                  <td className="text-sm">{p.user.state}</td>
                  <td>{p.score}</td>
                  <td className="text-center">{p.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="w-full grid grid-cols-1 lg:grid-cols-3 px-10 mb-5 gap-5">
        <div className=" bg-linear-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027] border border-[#1d9e75]/40 text-start text-white rounded-xl shadow-xl">
          <div className="flex items-start justify-center">
            <RadarChart
              style={{
                width: "100%",
                height: "100%",
                maxWidth: "500px",
                maxHeight: "80vh",
                aspectRatio: 1,
              }}
              responsive
              outerRadius="80%"
              data={radarData}
              margin={{
                top: 20,
                left: 20,
                right: 20,
                bottom: 20,
              }}
            >
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis />
              <Radar
                name="aarsh"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
            </RadarChart>
          </div>
          <div></div>
          <div className="flex items-center justify-center">
            <button
              onClick={() => navigate("/score")}
              className="flex justify-center  w-2/3 bg-linear-to-r from-teal-500 via-blue-900 to-blue-200 cursor-pointer my-2 rounded-md p-2 hover:scale-105"
            >
              Get Score
            </button>
          </div>
        </div>
        <div className="col-span-2  py-10  px-3 bg-linear-to-br from-[#0f2027] via-[#1a3a4a] to-[#0f2027] border border-[#1d9e75]/40 text-start text-white rounded-2xl shadow-xl">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={scores}>
              <XAxis dataKey="date" className="text-xs" stroke="#888" />
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
        </div>
      </div>
      {editForm && <EditForm setEditForm={setEditForm} />}
    </section>
  );
};

export default Dashboard;
