import { Search } from "lucide-react";
import React, { useState } from "react";
import { events, sports } from "../assets/assets";
import EventCard from "../Components/EventCard";
import EventDetails from "../Components/EventDetails";

const Events = () => {
  const [type, setType] = useState("All");
  const [search, setSearch] = useState("");
  const [selected,setSelected]=useState(null)
  const [isOpen,setIsOpen]=useState(false);

  const event=async (params) => {
    
  }

  const filtered=events.filter((e)=>(
    (type==='All'||e.sport===type) && (
      e.title.toLowerCase().includes(search.toLowerCase())
    )    
  ))

  return (
    <section className=" relative min-h-screen w-full flex flex-col p-5 gap-5">
        <div className="flex flex-col items-center justify-start min-h-screen w-full">
          <div className=" flex items-center text-start bg-teal-500/7 border border-teal-950 gap-3 rounded-lg w-full max-w-4xl h-12 px-12">
            <Search size={20} className="text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Search Events..."
              className="w-full outline-none text-white font-segoe "
            />
          </div>
          <div className="flex items-start gap-3 mt-5 w-full max-w-4xl flex-wrap">
            
          {
            sports.map((sport)=>(
             
                <div key={sport} className={` border border-gray-700 px-5 py-1 rounded-lg  cursor-pointer ${type===sport?'bg-[#2596be] text-white border-green-400/20':'bg-[#c3d4dc] text-black'}`} onClick={()=>setType(sport)}>
                  {sport}
                </div>
            
            ))
          }
          

          </div >

          {/* events */}         
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 my-8 w-full lg:px-20">
            {
            filtered.map((event)=>(
              <EventCard key={event.title} e={event} setSelected={setSelected} setIsOpen={setIsOpen}/>
            ))
            }
          </div>
        </div>
        {isOpen && <EventDetails selected={selected} setIsOpen={setIsOpen}/>}
    </section>
  );
};

export default Events;
