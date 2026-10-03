/**
 * Migration: add-refresh-token-indexes
 *
 * Creates the `refreshtokens` collection with indexes for:
 * - tokenHash  (unique) — fast lookup during refresh
 * - user       — fast revocation on logout
 * - family     — fast family-wide revocation on reuse detection
 * - expiresAt  (TTL, 0s) — MongoDB auto-deletes expired documents
 */

export const up = async (db) => {
  const collection = await db.createCollection("refreshtokens");

  await collection.createIndex({ tokenHash: 1 }, { unique: true });
  await collection.createIndex({ user: 1 });
  await collection.createIndex({ family: 1 });
  await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
};

export const down = async (db) => {
  await db.collection("refreshtokens").drop();
};
