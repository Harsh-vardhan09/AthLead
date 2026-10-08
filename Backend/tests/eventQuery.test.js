import assert from "node:assert/strict";
import test from "node:test";
import { ZodError } from "zod";
import {
  EVENT_SEARCH_INDEX_DEFINITION,
  EVENT_SEARCH_INDEX_NAME,
} from "../config/eventSearchIndex.js";
import Event from "../models/Event.js";
import { buildEventQuery } from "../utils/eventQuery.js";

const fixedNow = new Date("2026-10-06T08:00:00.000Z");
const istTodayStart = new Date("2026-10-05T18:30:00.000Z");
const istTomorrowStart = new Date("2026-10-06T18:30:00.000Z");

test("returns an empty filter when no query parameters are supplied", () => {
  assert.deepEqual(buildEventQuery({}, fixedNow), {
    searchStage: null,
    pagination: null,
  });
});

test("uses Atlas Search for independent exact and partial text filters", () => {
  assert.deepEqual(
    buildEventQuery({ sport: "Athletics" }).searchStage.$search.compound,
    {
      filter: [
        {
          text: {
            path: "sport",
            query: "Athletics",
          },
        },
      ],
    },
  );
  assert.deepEqual(
    buildEventQuery({ level: "National" }).searchStage.$search.compound,
    {
      filter: [
        {
          text: {
            path: "level",
            query: "National",
          },
        },
      ],
    },
  );
  assert.deepEqual(
    buildEventQuery({ location: "Delhi" }).searchStage.$search.compound,
    {
      must: [
        {
          wildcard: {
            path: "location",
            query: "*Delhi*",
            allowAnalyzedField: true,
          },
        },
      ],
    },
  );
  assert.deepEqual(
    buildEventQuery({ q: "sprint" }).searchStage.$search.compound,
    {
      must: [
        {
          wildcard: {
            path: "title",
            query: "*sprint*",
            allowAnalyzedField: true,
          },
        },
      ],
    },
  );
});

test("escapes Atlas Search wildcard control characters", () => {
  assert.deepEqual(
    buildEventQuery({ q: "A*B?C\\D" }).searchStage.$search.compound.must[0]
      .wildcard,
    {
      path: "title",
      query: "*A\\*B\\?C\\\\D*",
      allowAnalyzedField: true,
    },
  );
});

test("combines supplied text and exact-match filters in one Atlas Search stage", () => {
  const { searchStage } = buildEventQuery({
    sport: "athletics",
    level: "national",
    location: "Delhi",
    q: "sprint",
  });

  assert.deepEqual(searchStage, {
    $search: {
      index: EVENT_SEARCH_INDEX_NAME,
      sort: { date: 1, _id: 1 },
      compound: {
        must: [
          {
            wildcard: {
              path: "title",
              query: "*sprint*",
              allowAnalyzedField: true,
            },
          },
          {
            wildcard: {
              path: "location",
              query: "*Delhi*",
              allowAnalyzedField: true,
            },
          },
        ],
        filter: [
          { text: { path: "sport", query: "athletics" } },
          { text: { path: "level", query: "national" } },
        ],
      },
    },
  });
});

test("uses inclusive India-local date range boundaries", () => {
  const { searchStage } = buildEventQuery(
    { dateFrom: "2026-10-06", dateTo: "2026-10-07" },
    fixedNow,
  );

  assert.deepEqual(searchStage.$search.compound.filter, [
    {
      range: {
        path: "date",
        gte: new Date("2026-10-05T18:30:00.000Z"),
        lt: new Date("2026-10-07T18:30:00.000Z"),
      },
    },
  ]);
});

test("derives upcoming, ongoing, and past using Asia/Kolkata calendar days", () => {
  assert.deepEqual(
    buildEventQuery({ status: "upcoming" }, fixedNow).searchStage.$search
      .compound.filter,
    [{ range: { path: "date", gte: istTomorrowStart } }],
  );
  assert.deepEqual(
    buildEventQuery({ status: "ongoing" }, fixedNow).searchStage.$search
      .compound.filter,
    [{ range: { path: "date", gte: istTodayStart, lt: istTomorrowStart } }],
  );
  assert.deepEqual(
    buildEventQuery({ status: "past" }, fixedNow).searchStage.$search.compound
      .filter,
    [{ range: { path: "date", lt: istTodayStart } }],
  );
});

test("intersects date ranges with status filters", () => {
  const { searchStage } = buildEventQuery(
    {
      dateFrom: "2026-10-06",
      dateTo: "2026-10-08",
      status: "ongoing",
    },
    fixedNow,
  );

  assert.deepEqual(searchStage.$search.compound.filter, [
    {
      range: {
        path: "date",
        gte: istTodayStart,
        lt: istTomorrowStart,
      },
    },
  ]);
});

test("Atlas Search index covers all searchable and filter fields", () => {
  assert.deepEqual(EVENT_SEARCH_INDEX_DEFINITION, {
    analyzers: [
      {
        name: "caseInsensitiveKeyword",
        tokenizer: { type: "keyword" },
        tokenFilters: [{ type: "lowercase" }],
      },
    ],
    mappings: {
      dynamic: false,
      fields: {
        title: { type: "string", analyzer: "caseInsensitiveKeyword" },
        location: { type: "string", analyzer: "caseInsensitiveKeyword" },
        sport: { type: "string", analyzer: "caseInsensitiveKeyword" },
        level: { type: "string", analyzer: "caseInsensitiveKeyword" },
        date: { type: "date" },
        _id: { type: "objectId" },
      },
    },
  });
});

test("keeps a MongoDB index for stable unfiltered pagination", () => {
  assert.ok(
    Event.schema
      .indexes()
      .some(
        ([keys, options]) =>
          options.name === "events_date_id" &&
          keys.date === 1 &&
          keys._id === 1,
      ),
  );
});

test("enables pagination for filtered requests but preserves unfiltered defaults", () => {
  assert.equal(buildEventQuery({}, fixedNow).pagination, null);
  assert.deepEqual(buildEventQuery({ sport: "Athletics" }).pagination, {
    page: 1,
    limit: 50,
  });
  assert.deepEqual(buildEventQuery({ page: "2", limit: "24" }).pagination, {
    page: 2,
    limit: 24,
  });
});

test("rejects invalid dates, reversed ranges, and unsupported statuses", () => {
  assert.throws(() => buildEventQuery({ dateFrom: "2026-13-01" }), ZodError);
  assert.throws(() => buildEventQuery({ dateFrom: "2026-02-30" }), ZodError);
  assert.throws(
    () =>
      buildEventQuery({
        dateFrom: "2026-10-07",
        dateTo: "2026-10-06",
      }),
    ZodError,
  );
  assert.throws(() => buildEventQuery({ status: "cancelled" }), ZodError);
  assert.throws(() => buildEventQuery({ page: "0" }), ZodError);
  assert.throws(() => buildEventQuery({ limit: "101" }), ZodError);
});
