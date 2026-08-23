/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const up = async (db, client) => {
  const users = db.collection("users");
  // TODO write your migration here.
  await users.updateMany({ role: "user" }, { $set: { role: "USER" } });
  await users.updateMany({ role: "admin" }, { $set: { role: "ADMIN" } });
};

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const down = async (db, client) => {
  // TODO write the statements to rollback your migration (if possible)
  const users = db.collection("users");

  await users.updateMany({ role: "USER" }, { $set: { role: "user" } });

  await users.updateMany({ role: "ADMIN" }, { $set: { role: "admin" } });
};
