const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const getDateKey = (value, offsetMs = 0) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string" && DATE_ONLY_PATTERN.test(value)) {
    const date = new Date(value + "T00:00:00.000Z");

    if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      return null;
    }

    return value;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return new Date(date.getTime() + offsetMs).toISOString().slice(0, 10);
};

export const isEventOnOrAfterIstToday = (eventDate, now = new Date()) => {
  const eventDateKey = getDateKey(eventDate, IST_OFFSET_MS);
  const todayKey = getDateKey(now, IST_OFFSET_MS);

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
