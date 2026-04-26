import mongoose from "mongoose";
import Event from "../models/Event.js";
import dotenv from 'dotenv';
dotenv.config();



const seed = async () => {
  try {

    await mongoose.connect();
   
    

    await Event.deleteMany(); // optional: clears old data

    const eventsData = [
      {
        title: "Inter-State Athletics Meet",
        sport: "Athletics",
        description: "Multi-discipline athletics competition",
        level: "Inter-State",
        prize: 300000,
        location: "Delhi",
        date: "2026-11-05",
        tags: "national",
      },
      {
        title: "National Swimming Championship",
        sport: "Swimming",
        description: "Top swimmers across the country",
        level: "National",
        prize: 500000,
        location: "Mumbai",
        date: "2026-12-10",
        tags: "Freestyle",
      },
      {
        title: "Youth Badminton Cup",
        sport: "Badminton",
        description: "Singles and doubles youth tournament",
        level: "Youth",
        prize: 100000,
        location: "Bangalore",
        date: "2026-10-20",
        tags: "singles",
      },
      {
        title: "State Football League",
        sport: "Football",
        description: "Top teams compete at state level",
        level: "State",
        prize: 200000,
        location: "Kolkata",
        date: "2026-09-15",
        tags: "doubles",
      },
    ];

    const eventsWithTTL = eventsData.map((event) => {
      const eventDate = new Date(event.date);

      const deleteAt = new Date(eventDate);
      deleteAt.setDate(deleteAt.getDate() - 3);

      return {
        ...event,
        date: eventDate,
        deleteAt,
      };
    });

    await Event.insertMany(eventsWithTTL);

    console.log("✅ 4 Events Seeded Successfully");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed()