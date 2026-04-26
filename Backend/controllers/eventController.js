import Event from "../models/Event.js";

export const findAllEvent = async (req, res) => {
  const events = await Event.find({});
  console.log(events);
  
  res.json({
    status: 400,
    events,
  });
};

export const postEvent = async (req, res) => {
  const { data } = req.body;

  const { title, level, location, prize, description, sport, date, tags } =
    data;

    const eventDate = new Date(date);

    const deleteAt = new Date(eventDate);
    deleteAt.setDate(deleteAt.getDate() - 3);

  const event = await Event.create({
    title,
    level,
    location,
    prize,
    description,
    sport,
    date,
    tags,
    deleteAt
  });

  res.json({
    success:true,
    message:'Event Registered',
    event
  })

};
