const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const getDateKey = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

export const isEventOnOrAfterIstToday = (eventDate, now = new Date()) => {
  const eventDateKey = getDateKey(eventDate);
  const todayKey = getDateKey(new Date(now.getTime() + IST_OFFSET_MS));

  return eventDateKey !== null && todayKey !== null && eventDateKey >= todayKey;
};

export const filterCurrentAndUpcomingRegistrations = (
  participations,
  now = new Date(),
) =>
  participations.filter(
    (participation) =>
      participation.event &&
      isEventOnOrAfterIstToday(participation.event.date, now),
  );
