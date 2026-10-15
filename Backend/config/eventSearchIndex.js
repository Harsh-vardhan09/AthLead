export const EVENT_SEARCH_INDEX_NAME = "events_search";

export const EVENT_SEARCH_INDEX_DEFINITION = {
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
};
