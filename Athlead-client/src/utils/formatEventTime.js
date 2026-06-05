export const formatEventTime = (time) => {
  if (!time) return "TBA";

  const trimmedTime = String(time).trim();
  if (!trimmedTime) return "TBA";

  if (/am|pm/i.test(trimmedTime)) {
    return trimmedTime.replace(/\s?(am|pm)$/i, " $1").toUpperCase();
  }

  const [hourValue, minuteValue = "00"] = trimmedTime.split(":");
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return trimmedTime;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  const displayMinute = String(minute).padStart(2, "0");

  return `${displayHour}:${displayMinute} ${period}`;
};
