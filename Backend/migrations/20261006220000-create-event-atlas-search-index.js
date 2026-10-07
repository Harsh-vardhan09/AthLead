import {
  EVENT_SEARCH_INDEX_DEFINITION,
  EVENT_SEARCH_INDEX_NAME,
} from "../config/eventSearchIndex.js";

const getSearchIndex = async (events) => {
  const indexes = await events.listSearchIndexes().toArray();
  return indexes.find((index) => index.name === EVENT_SEARCH_INDEX_NAME);
};

const waitForSearchIndex = async (
  events,
  { timeoutMs = 5 * 60 * 1000, pollIntervalMs = 2000 } = {},
) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const index = await getSearchIndex(events);

    if (index?.status === "READY" && index.queryable) {
      return index;
    }

    if (index?.status === "FAILED") {
      throw new Error(
        `Atlas Search index "${EVENT_SEARCH_INDEX_NAME}" failed to build`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(
    `Timed out waiting for Atlas Search index "${EVENT_SEARCH_INDEX_NAME}"`,
  );
};

const waitForSearchIndexRemoval = async (
  events,
  { timeoutMs = 5 * 60 * 1000, pollIntervalMs = 2000 } = {},
) => {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (!(await getSearchIndex(events))) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(
    `Timed out waiting for Atlas Search index "${EVENT_SEARCH_INDEX_NAME}" to be removed`,
  );
};

export const ensureEventSearchIndex = async (
  events,
  { timeoutMs = 5 * 60 * 1000, pollIntervalMs = 2000 } = {},
) => {
  let index = await getSearchIndex(events);

  if (index?.status === "FAILED") {
    await events.dropSearchIndex(EVENT_SEARCH_INDEX_NAME);
    await waitForSearchIndexRemoval(events, { timeoutMs, pollIntervalMs });
    index = null;
  }

  if (!index) {
    await events.createSearchIndex({
      name: EVENT_SEARCH_INDEX_NAME,
      definition: EVENT_SEARCH_INDEX_DEFINITION,
    });
  }

  return waitForSearchIndex(events, { timeoutMs, pollIntervalMs });
};

export const up = async (db) => {
  const events = db.collection("events");
  await ensureEventSearchIndex(events);
  const indexes = await events.listIndexes().toArray();
  if (!indexes.some((index) => index.name === "events_date_id")) {
    await events.createIndex({ date: 1, _id: 1 }, { name: "events_date_id" });
  }
};

export const down = async (db) => {
  const events = db.collection("events");
  if (await getSearchIndex(events)) {
    await events.dropSearchIndex(EVENT_SEARCH_INDEX_NAME);
  }

  const indexes = await events.listIndexes().toArray();
  if (indexes.some((index) => index.name === "events_date_id")) {
    await events.dropIndex("events_date_id");
  }
};
