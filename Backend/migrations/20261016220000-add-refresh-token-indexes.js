/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const up = async (db) => {
  const collections = await db
    .listCollections({ name: "refreshtokens" })
    .toArray();
  if (collections.length === 0) {
    await db.createCollection("refreshtokens");
  }

  const refreshTokens = db.collection("refreshtokens");
  await refreshTokens.createIndex({ tokenHash: 1 }, { unique: true });
  await refreshTokens.createIndex({ family: 1 });
  await refreshTokens.createIndex({ user: 1 });
  await refreshTokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
};

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const down = async (db) => {
  const collections = await db
    .listCollections({ name: "refreshtokens" })
    .toArray();
  if (collections.length > 0) {
    await db.collection("refreshtokens").drop();
  }
};
