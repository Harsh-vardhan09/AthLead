const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export const millisecondsUntilNextIstMidnight = (now = new Date()) => {
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const nextMidnightUtc = Date.UTC(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    istNow.getUTCDate() + 1,
  );

  return nextMidnightUtc - IST_OFFSET_MS - now.getTime();
};
