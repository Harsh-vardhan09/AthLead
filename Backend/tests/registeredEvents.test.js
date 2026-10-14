import assert from "node:assert/strict";
import test from "node:test";
import { isEventOnOrAfterIstToday } from "../utils/registeredEvents.js";

test("keeps today's event visible until IST midnight", () => {
  const eventDate = new Date("2026-10-13T00:00:00.000Z");

  assert.equal(
    isEventOnOrAfterIstToday(eventDate, new Date("2026-10-13T18:29:59.999Z")),
    true,
  );
  assert.equal(
    isEventOnOrAfterIstToday(eventDate, new Date("2026-10-13T18:30:00.000Z")),
    false,
  );
});

test("rejects missing and invalid event dates", () => {
  const now = new Date("2026-10-13T10:00:00.000Z");

  assert.equal(isEventOnOrAfterIstToday(null, now), false);
  assert.equal(isEventOnOrAfterIstToday(undefined, now), false);
  assert.equal(isEventOnOrAfterIstToday("not-a-date", now), false);
});
