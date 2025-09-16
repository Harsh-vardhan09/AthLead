import React, { useState, useEffect } from "react";
import { getCookie } from "../utility/Utils";
import Scorecard from "./Scorecard";
import { useNavigate } from "react-router";
import { Link } from "react-router";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";




const fetchDashboardData = async () => {

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        user: {
          name: "John Doe",
          sport: "Athlete",
          profilePic: "https://www.mcso.us/sites/default/files/styles/portrait_tall_xs/public/2024-02/cold%20case%20john%20doe.png.webp?itok=FaIf6NJ5",
        },
        performanceData: [
          { name: "Week 1", score: 50 },
          { name: "Week 2", score: 60 },
          { name: "Week 3", score: 70 },
          { name: "Week 4", score: 65 },
          { name: "Week 5", score: 60 },
          { name: "Week 6", score: 70 },
          { name: "Week 7", score: 75 },
          { name: "Week 8", score: 80 },
          { name: "Week 9", score: 70 },
          { name: "Week 10", score: 85 },
          { name: "Week 11", score: 90},
          { name: "Week 12", score: 90 },
        ],
        assessments: [
          { name: "Speed Drill", score: "8.5/10" },
          { name: "Agility Test", score: "9.1/10" },
          { name: "Endurance Test", score: "8.8/10" },
        ],
        schedule: [
          { day: "Monday", time: "5 PM", activity: "Gym" },
          { day: "Wednesday", time: "6 PM", activity: "Field Practice" },
          { day: "Friday", time: "7 PM", activity: "Swimming" },
        ],
        strengthData: [
          { name: "Squat", max: 120 },
          { name: "Bench Press", max: 90 },
          { name: "Deadlift", max: 150 },
          { name: "Pull Up", max: 20 },
        ],
      });
    }, 1000);
  });
};



const Dashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const[username,setUsername]=useState("");

  useEffect(()=>{
      const email=getCookie("userEmail");
      if(email){
        setUsername(email)
      }
  },[]);

  
  useEffect(() => {
    const getData = async () => {
      const fetchedData = await fetchDashboardData();
      setData(fetchedData);
      setIsLoading(false);
    };
    getData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="loading text-lg font-semibold">
          Loading dashboard...
        </div>
      </div>
    );
  }

  const { user, performanceData, assessments, schedule, strengthData } = data;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 lg:p-8 flex flex-col lg:flex-row gap-8 font-sans">
      <div className="lg:w-1/4 w-full flex-shrink-0 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 flex flex-col items-center top-8 self-start">
        <div className="profile text-center space-y-3 ">
          <img
            src={
              username==="dev@123"?"https://media.licdn.com/dms/image/v2/D5603AQGKWSiOUiAdMQ/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1716051519703?e=2147483647&v=beta&t=LPX23NkEt2ve04uyO-yz-bOWibcYE2bzjDpOph2R-Z4":user.profilePic}
            alt="Profile"
            className="profile-pic w-32 h-32 rounded-full border-4 border-indigo-500 shadow-lg mx-auto"
          />
          <h3 className="profile-name text-2xl font-bold text-gray-900 dark:text-gray-100">
            {username}
          </h3>
          <p className="profile-sport text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide text-sm">
            {user.sport}
          </p>
          <Link to="/Scorecard">
          <button className="edit-profile-btn mt-4 w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full shadow-lg transition duration-200" >
            Get Score
          </button>
          </Link>
        </div>
      </div>

      <div className="main-content flex-grow space-y-8">
        <div className="dashboard-header bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Performance Trends</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceData}>
              <XAxis dataKey="name" className="text-xs" stroke="#888" />
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

        <div className="dashboard-widgets grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="assessments-widget bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold mb-4">Recent Assessments</h3>
            <div className="space-y-4">
              {assessments.map((assessment, index) => (
                <div
                  key={index}
                  className="assessment-card bg-gray-100 dark:bg-gray-700 p-4 rounded-xl flex items-center justify-between"
                >
                  <h4 className="font-semibold">{assessment.name}</h4>
                  <p className="font-bold text-indigo-600 dark:text-indigo-400">
                    {assessment.score}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="schedule-widget bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold mb-4">
              Upcoming Training Schedule
            </h3>
            <div className="space-y-4">
              {schedule.map((item, index) => (
                <div
                  key={index}
                  className="schedule-item bg-gray-100 dark:bg-gray-700 p-4 rounded-xl"
                >
                  <p>
                    <strong className="text-gray-900 dark:text-gray-100">
                      {item.day}
                    </strong>
                    : {item.time} - {item.activity}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="strength-widget bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold mb-4">Strength Statistics</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={strengthData}
                margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
              >
                <XAxis dataKey="name" className="text-xs" stroke="#888" />
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
                <Bar dataKey="max" fill="#6366f1" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
