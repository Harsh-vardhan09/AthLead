import React from "react";
import { sportIcon } from "../assets/assets";
import { Calendar, Clock, Locate, MapPin, Medal, Watch } from "lucide-react";
import { useNavigate } from "react-router";


const EventCard = ({ e, setSelected, setIsOpen }) => {
  const navigate=useNavigate()
  return (
      <div
        key={e.id}
        className=" h-65 w-auto bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:scale-[1.01] transition overflow-hidden "
        onClick={() => {
          (setSelected(e), setIsOpen(true));
        }}
      >
        <div className="realtive top-0 left-0 right-0 h-0.75 bg-linear-to-r from-cyan-400 to-cyan-600 rounded-t-2xl " />
        {/* Header */}
        <div className="flex gap-3 my-3 ">
          <div className="text-3xl">{sportIcon(e.sport)}</div>
          <div>
            <h1 className="text-white font-bold font-akkurat text-md">
              {e.title}
            </h1>
            <p className="basic text-sm">
              {e.sport} • {e.category}
            </p>
          </div>
        </div>

        <div className=" basic flex  justify-around my-6 ">
          <div className=" text-xs ">
            <p className="flex gap-1 mb-2">
              <Calendar className="text-teal-600 h-4 w-4" />
              {e.date}
            </p>
            <p className="flex gap-1">
              <MapPin className="text-teal-600 h-4 w-4" />
              {e.location}
            </p>
          </div>
          <div className="text-xs">
            <p className="flex gap-1 mb-2">
              <Clock className="text-teal-600 h-4 w-4" />
              {e.time}
            </p>
            <p className="flex gap-1">
              <Medal className="text-teal-600 h-4 w-4" />
              {e.prize}
            </p>
          </div>
        </div>
        <div className="flex justify-start items-center text-xs px-3">
          {e.tags.map((tag) => (
            <div className="border border-gray-100/5 w-15 h-5 text-teal-600 text-center rounded-full mx-1 bg-gray-800 overflow-hidden">
              {tag}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center ">
          <button
            onClick={() => {setSelected(e);navigate('/events/:eventId')}}
            className="my-6 text-center bg-linear-to-br from-cyan-400 to-cyan-600 w-full rounded-xl h-10 max-w-70 hover:from-cyan-600 hover:to-cyan-800"
          >
            Register Now
          </button>
        </div>
      </div>
  );
};

export default EventCard;
