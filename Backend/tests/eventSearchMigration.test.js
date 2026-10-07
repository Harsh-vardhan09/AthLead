import assert from "node:assert/strict";
import test from "node:test";
import {
  EVENT_SEARCH_INDEX_DEFINITION,
  EVENT_SEARCH_INDEX_NAME,
} from "../config/eventSearchIndex.js";
import {
  down,
  ensureEventSearchIndex,
  up,
} from "../migrations/20261006220000-create-event-atlas-search-index.js";

const createCollection = ({
  searchIndexes = [],
  indexes = [{ name: "_id_" }],
  onCreateSearchIndex,
  onDropSearchIndex,
} = {}) => {
  let currentSearchIndexes = [...searchIndexes];
  let currentIndexes = [...indexes];
  const calls = [];

  const collection = {
    calls,
    listSearchIndexes() {
      return { toArray: async () => [...currentSearchIndexes] };
    },
    createSearchIndex: async (description) => {
      calls.push(["createSearchIndex", description]);
      await onCreateSearchIndex?.(description);
      currentSearchIndexes = [
        {
          name: description.name,
          status: "READY",
          queryable: true,
        },
      ];
    },
    dropSearchIndex: async (name) => {
      calls.push(["dropSearchIndex", name]);
      await onDropSearchIndex?.(name);
      currentSearchIndexes = currentSearchIndexes.filter(
        (index) => index.name !== name,
      );
    },
    listIndexes() {
      return { toArray: async () => [...currentIndexes] };
    },
    createIndex: async (keys, options) => {
      calls.push(["createIndex", keys, options]);
      currentIndexes.push({ name: options.name, key: keys });
      return options.name;
    },
    dropIndex: async (name) => {
      calls.push(["dropIndex", name]);
      currentIndexes = currentIndexes.filter((index) => index.name !== name);
    },
  };

  return collection;
};

test("creates the Atlas Search index when missing and waits for it to be queryable", async () => {
  const events = createCollection();
  await ensureEventSearchIndex(events, { pollIntervalMs: 0 });

  assert.deepEqual(events.calls, [
    [
      "createSearchIndex",
      {
        name: EVENT_SEARCH_INDEX_NAME,
        definition: EVENT_SEARCH_INDEX_DEFINITION,
      },
    ],
  ]);
});

test("reuses a ready Atlas Search index without rebuilding it", async () => {
  const events = createCollection({
    searchIndexes: [
      {
        name: EVENT_SEARCH_INDEX_NAME,
        status: "READY",
        queryable: true,
      },
    ],
  });

  await ensureEventSearchIndex(events, { pollIntervalMs: 0 });
  assert.deepEqual(events.calls, []);
});

test("drops a failed search index before recreating it on retry", async () => {
  const events = createCollection({
    searchIndexes: [
      {
        name: EVENT_SEARCH_INDEX_NAME,
        status: "FAILED",
        queryable: false,
      },
    ],
  });

  await ensureEventSearchIndex(events, { pollIntervalMs: 0 });

  assert.deepEqual(events.calls, [
    ["dropSearchIndex", EVENT_SEARCH_INDEX_NAME],
    [
      "createSearchIndex",
      {
        name: EVENT_SEARCH_INDEX_NAME,
        definition: EVENT_SEARCH_INDEX_DEFINITION,
      },
    ],
  ]);
});

test("waits for a dropped failed index to disappear before recreating it", async () => {
  const events = createCollection({
    searchIndexes: [
      {
        name: EVENT_SEARCH_INDEX_NAME,
        status: "FAILED",
        queryable: false,
      },
    ],
  });
  const listSearchIndexes = events.listSearchIndexes.bind(events);
  let listCount = 0;
  events.listSearchIndexes = () => ({
    toArray: async () => {
      listCount += 1;
      if (listCount === 2) {
        return [{ name: EVENT_SEARCH_INDEX_NAME, status: "DELETING" }];
      }
      return listSearchIndexes().toArray();
    },
  });

  await ensureEventSearchIndex(events, { pollIntervalMs: 0 });

  assert.ok(listCount >= 2);
  assert.equal(events.calls[0][0], "dropSearchIndex");
  assert.equal(events.calls[1][0], "createSearchIndex");
});

test("creates only the required regular date index and preserves existing indexes", async () => {
  const events = createCollection({
    indexes: [{ name: "_id_" }, { name: "unrelated_existing_index" }],
  });
  const db = { collection: () => events };

  await up(db);

  assert.ok(
    events.calls.some(
      ([method, keys, options]) =>
        method === "createIndex" &&
        keys.date === 1 &&
        keys._id === 1 &&
        options.name === "events_date_id",
    ),
  );
  assert.ok(!events.calls.some(([method]) => method === "dropIndex"));
});

test("migration down drops only its own search and date indexes", async () => {
  const events = createCollection({
    searchIndexes: [
      { name: EVENT_SEARCH_INDEX_NAME, status: "READY", queryable: true },
      { name: "other_search_index", status: "READY", queryable: true },
    ],
    indexes: [
      { name: "_id_" },
      { name: "events_date_id" },
      { name: "unrelated_existing_index" },
    ],
  });
  const db = { collection: () => events };

  await down(db);

  assert.deepEqual(events.calls, [
    ["dropSearchIndex", EVENT_SEARCH_INDEX_NAME],
    ["dropIndex", "events_date_id"],
  ]);
});
