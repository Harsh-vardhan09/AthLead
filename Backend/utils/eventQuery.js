import { z } from "zod";
import { EVENT_SEARCH_INDEX_NAME } from "../config/eventSearchIndex.js";

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const optionalText = (maxLength) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maxLength).optional(),
  );

const dateParameter = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return (
        Number.isFinite(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    }, "Date must be a valid calendar date")
    .optional(),
);

const eventQuerySchema = z
  .object({
    q: optionalText(100),
    sport: optionalText(80),
    level: optionalText(80),
    location: optionalText(100),
    dateFrom: dateParameter,
    dateTo: dateParameter,
    status: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === "" ? undefined : value,
      z.enum(["upcoming", "ongoing", "past"]).optional(),
    ),
    page: z.coerce.number().int().min(1).max(1000).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .superRefine(({ dateFrom, dateTo }, context) => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      context.addIssue({
        code: "custom",
        path: ["dateTo"],
        message: "dateTo must be on or after dateFrom",
      });
    }
  });

const escapeWildcard = (value) =>
  value.replace(/[\\*?]/g, (character) => `\\${character}`);

const utcMidnight = (year, month, day) => {
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
};

const istMidnight = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(utcMidnight(year, month, day).getTime() - IST_OFFSET_MS);
};

const nextDate = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(utcMidnight(year, month, day + 1).getTime() - IST_OFFSET_MS);
};

const getIstToday = (now) =>
  new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

export const buildEventQuery = (rawQuery, now = new Date()) => {
  const filters = eventQuerySchema.parse(rawQuery);
  const must = [];
  const searchFilters = [];
  const hasFilters = Boolean(
    filters.q ||
    filters.sport ||
    filters.level ||
    filters.location ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.status,
  );
  const pagination =
    hasFilters || filters.page || filters.limit
      ? { page: filters.page ?? 1, limit: filters.limit ?? 50 }
      : null;

  if (filters.q) {
    must.push({
      wildcard: {
        path: "title",
        query: `*${escapeWildcard(filters.q)}*`,
        allowAnalyzedField: true,
      },
    });
  }

  if (filters.sport) {
    searchFilters.push({
      text: {
        path: "sport",
        query: filters.sport,
      },
    });
  }

  if (filters.level) {
    searchFilters.push({
      text: {
        path: "level",
        query: filters.level,
      },
    });
  }

  if (filters.location) {
    must.push({
      wildcard: {
        path: "location",
        query: `*${escapeWildcard(filters.location)}*`,
        allowAnalyzedField: true,
      },
    });
  }

  let lowerBound = filters.dateFrom ? istMidnight(filters.dateFrom) : null;
  let upperBound = filters.dateTo ? nextDate(filters.dateTo) : null;

  if (filters.status) {
    const today = getIstToday(now);
    const todayStart = istMidnight(today);
    const tomorrowStart = nextDate(today);

    if (filters.status === "upcoming") {
      lowerBound =
        !lowerBound || lowerBound < tomorrowStart ? tomorrowStart : lowerBound;
    } else if (filters.status === "ongoing") {
      lowerBound =
        !lowerBound || lowerBound < todayStart ? todayStart : lowerBound;
    }

    if (filters.status === "ongoing") {
      upperBound =
        !upperBound || upperBound > tomorrowStart ? tomorrowStart : upperBound;
    } else if (filters.status === "past") {
      upperBound =
        !upperBound || upperBound > todayStart ? todayStart : upperBound;
    }
  }

  if (lowerBound || upperBound) {
    const dateRange = { path: "date" };
    if (lowerBound) dateRange.gte = lowerBound;
    if (upperBound) dateRange.lt = upperBound;
    searchFilters.push({ range: dateRange });
  }

  if (must.length === 0 && searchFilters.length === 0) {
    return { searchStage: null, pagination };
  }

  return {
    searchStage: {
      $search: {
        index: EVENT_SEARCH_INDEX_NAME,
        sort: { date: 1, _id: 1 },
        compound: {
          ...(must.length > 0 ? { must } : {}),
          ...(searchFilters.length > 0 ? { filter: searchFilters } : {}),
        },
      },
    },
    pagination,
  };
};
