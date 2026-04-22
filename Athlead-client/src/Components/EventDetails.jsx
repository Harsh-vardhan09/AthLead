import React from "react";
import { sportIcon } from "../assets/assets";
import { Calendar, Clock, MapPin, Medal } from "lucide-react";

const EventDetails = ({ selected, setIsOpen }) => {
  return (
    <section onClick={() => setIsOpen(false)} className="fixed inset-0 z-10 min-h-screen h-full w-full bg-black/60 backdrop-blur-md flex items-center justify-center">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl h-full max-h-4/6 bg-[#040e1a]/95 rounded-4xl border border-[rgba(6,182,212,0.2)] shadow-[0_0_60px_rgba(6,182,212,0.15)]">
        <div className="flex flex-col  justify-start my-5 gap-5 mx-5">
          <div className="text-3xl">{sportIcon(selected.sport)}</div>
          <div>
            <p className="text-white text-xl font-bold font-akkurat">
              {selected.title}
            </p>
            <p className="basic text-sm">
              {selected.sport} • {selected.category}
            </p>
          </div>
          <div>
            <p className="basic text-sm">{selected.desc}</p>
          </div>

          <div className=" basic flex  justify-around gap-5  ">
            <div className=" text-xs  ">
              <div className="flex flex-col gap-1 items-start bg-white/5 border border-teal-200/10   w-auto lg:w-50  h-12 justify-center rounded-xl mb-3 p-3">
                <p className="flex">
                  <Calendar className="text-teal-600 h-4 w-4 mr-1" />
                  Date
                </p>
                <p className="text-md text-white font-bold">{selected.date}</p>
              </div>
              <div className="flex flex-col gap-1 items-start bg-white/5 border border-teal-200/10   w-auto lg:w-50  h-12 justify-center rounded-xl  p-3">
                <p className="flex">
                  <MapPin className="text-teal-600 h-4 w-4 mr-1" />
                  Location
                </p>
                <p className="text-md text-white font-bold">
                  {selected.location}
                </p>
              </div>
            </div>
            <div className="text-xs">
              <div className="flex flex-col gap-1 items-start bg-white/5 border border-teal-200/10   w-auto lg:w-50  h-12 justify-center rounded-xl mb-3 p-3">
                <p className="flex">
                  <Clock className="text-teal-600 h-4 w-4 mr-1" />
                  Time
                </p>
                <p className="text-md text-white font-bold">{selected.time}</p>
              </div>
              <div className="flex flex-col gap-1 items-start bg-white/5 border border-teal-200/10   w-auto lg:w-50  h-12 justify-center rounded-xl  p-3">
                <p className="flex">
                  <Medal className="text-teal-600 h-4 w-4 mr-1" />
                  Prize Pool
                </p>
                <p className="text-md text-white font-bold">{selected.prize}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center max-w-3xl">
          <button className="text-center bg-linear-to-br from-cyan-400 to-cyan-600 w-full rounded-xl h-10 max-w-120 hover:from-cyan-600 hover:to-cyan-800 mx-4">
            Register Now
          </button>
        </div>
      </div>
    </section>
  );
};

export default EventDetails;
