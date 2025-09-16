import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
const Events = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const params = useParams();
  console.log(params);

  const events = [
    {
      id: 1,
      name: "Soccer Championship",
      theme: ["Soccer", "Sport", "Competition"],
      participants: "+2000 participating",
      date: "2025-10-25",
      isFeatured: false,
    },
    {
      id: 2,
      name: "Basketball Tournament",
      theme: ["Basketball", "Sport", "Tournament"],
      participants: "+1500 participating",
      date: "2025-11-15",
      isFeatured: true,
    },
    {
      id: 3,
      name: "Tennis Open",
      theme: ["Tennis", "Sport", "Open"],
      participants: "+1000 participating",
      date: "2025-12-05",
      isFeatured: false,
    },
    {
      id: 4,
      name: "Volleyball Finals",
      theme: ["Volleyball", "Sport", "Finals"],
      participants: "+800 participating",
      date: "2025-12-18",
      isFeatured: false,
    },
    {
      id: 5,
      name: "Cricket World Cup",
      theme: ["Cricket", "Sport", "World Cup"],
      participants: "+3000 participating",
      date: "2026-01-10",
      isFeatured: true,
    },
    {
      id: 6,
      name: "Marathon Run",
      theme: ["Running", "Marathon", "Endurance"],
      participants: "+5000 participating",
      date: "2025-09-20",
      isFeatured: false,
    },
    {
      id: 7,
      name: "Swimming Gala",
      theme: ["Swimming", "Sport", "Gala"],
      participants: "+1200 participating",
      date: "2025-08-12",
      isFeatured: false,
    },
    {
      id: 8,
      name: "Badminton League",
      theme: ["Badminton", "Sport", "League"],
      participants: "+900 participating",
      date: "2025-11-30",
      isFeatured: false,
    },
    {
      id: 9,
      name: "Table Tennis Cup",
      theme: ["Table Tennis", "Sport", "Cup"],
      participants: "+700 participating",
      date: "2025-10-10",
      isFeatured: false,
    },
    {
      id: 10,
      name: "Hockey Invitational",
      theme: ["Hockey", "Sport", "Invitational"],
      participants: "+1100 participating",
      date: "2025-12-22",
      isFeatured: true,
    },
  ];

  const featuredEvents = events.filter((event) => event.isFeatured);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % featuredEvents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredEvents.length]);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4 font-sans ">
      <div className="w-full max-w-4xl mb-8 overflow-hidden relative">
        <h1 className="text-6xl font-bold text-gray-800 mb-8 text-center">
          Upcoming Sports Events
        </h1>

        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {featuredEvents.map((event) => (
            <div key={event.id} className="w-full flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-center bg-white p-6 rounded-3xl shadow-lg border-2 border-transparent">
                <div className="relative w-full sm:w-1/2 rounded-2xl overflow-hidden mb-4 sm:mb-0">
                  <img
                    src="https://www.navhindtimes.in/wp-content/uploads/2022/02/31Ranji-Trophy.jpg"
                    alt="Featured Event"
                    className="w-full h-auto object-cover"
                  />
                  <span className="absolute top-4 left-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                    FEATURED
                  </span>
                </div>
                <div className="w-full sm:w-1/2 sm:pl-8 ">
                  <div className="flex justify-between items-start mb-2 ">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      {event.name}
                    </h2>
                    <div className="flex space-x-2 text-gray-500">
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
                        🔗
                      </span>
                      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
                        ❌
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Sports Event</p>
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-500">
                      THEME
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2 ">
                      {event.theme.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-4 ">
                    <div className="flex -space-x-2 overflow-hidden">
                      <img
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                        src="https://placehold.co/32x32/ff69b4/ffffff?text=P1"
                        alt="Participant 1"
                      />
                      <img
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                        src="https://placehold.co/32x32/87ceeb/ffffff?text=P2"
                        alt="Participant 2"
                      />
                      <img
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                        src="https://placehold.co/32x32/90ee90/ffffff?text=P3"
                        alt="Participant 3"
                      />
                    </div>
                    <span className="ml-2 font-medium text-green-600">
                      {event.participants}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <span className="block text-xs text-gray-500 uppercase mb-2">
                      Starts {event.date}
                    </span>
                    <button className="w-full bg-blue-600 text-white font-semibold py-2 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md">
                      Join Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        
        <div className="flex justify-center mt-4 space-x-2">
          {featuredEvents.map((_, index) => (
            <span
              key={index}
              className={`block w-3 h-3 rounded-full cursor-pointer ${
                currentIndex === index ? "bg-blue-600" : "bg-gray-400"
              }`}
              onClick={() => setCurrentIndex(index)}
            ></span>
          ))}
        </div>
      </div>

     
      <div className="flex flex-wrap justify-center gap-6 grid lg:grid-cols-3 sm:grid-cols-1 ">
        {events
          .filter((event) => !event.isFeatured)
          .map((event) => (
            <div
              key={event.id}
              className="w-full sm:w-80 bg-white p-6 rounded-3xl shadow-lg border-2 border-transparent hover:border-blue-500 transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {event.name}
                </h2>
                <div className="flex space-x-2 text-gray-500">
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
                    🔗
                  </span>
                  <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
                    ❌
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">Sports Event</p>
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-500">THEME</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {event.theme.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full  "
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center text-sm text-gray-600 mb-4">
                <div className="flex -space-x-2 overflow-hidden">
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                    src="https://placehold.co/32x32/ff69b4/ffffff?text=P1"
                    alt="Participant 1"
                  />
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                    src="https://placehold.co/32x32/87ceeb/ffffff?text=P2"
                    alt="Participant 2"
                  />
                  <img
                    className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                    src="https://placehold.co/32x32/90ee90/ffffff?text=P3"
                    alt="Participant 3"
                  />
                </div>
                <span className="ml-2 font-medium text-green-600">
                  {event.participants}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <span className="block text-xs text-gray-500 uppercase mb-2">
                  Starts {event.date}
                </span>
                <button className="w-full bg-blue-600 text-white font-semibold py-2 rounded-xl hover:bg-blue-700 transition-all duration-300 shadow-md">
                  Join Now
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Events;
