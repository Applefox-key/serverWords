import { db_run, db_get, db_all } from "../helpers/dbAsync.js";

// ── Tags CRUD ────────────────────────────────────────────────────────

// Get all tags for a user
export const getAll = async (user) => {
  return await db_all(
    `SELECT * FROM entry_tags WHERE userid = ? ORDER BY name COLLATE NOCASE ASC`,
    [user.id]
  );
};

// Create a new tag
export const createTag = async (user, name) => {
  return await db_get(
    `INSERT INTO entry_tags (name, userid) VALUES (?, ?) RETURNING id`,
    [name, user.id]
  );
};

// Rename a tag
export const editTag = async (user, id, name) => {
  return await db_run(
    `UPDATE entry_tags SET name = ? WHERE id = ? AND userid = ?`,
    [name, id, user.id]
  );
};

// Delete a tag (entries_to_tags rows cascade automatically)
export const deleteTag = async (user, id) => {
  return await db_run(
    `DELETE FROM entry_tags WHERE id = ? AND userid = ?`,
    [id, user.id]
  );
};

// ── Tag ↔ Entry binding ───────────────────────────────────────────────

// Get all tags attached to a specific entry
export const getByEntry = async (entryId) => {
  return await db_all(
    `SELECT et.id, et.name
     FROM entry_tags et
     JOIN entries_to_tags ett ON ett.tagid = et.id
     WHERE ett.entryid = ?
     ORDER BY et.name COLLATE NOCASE ASC`,
    [entryId]
  );
};

// Replace all tags for an entry with a new set of tagIds
// Deletes existing links then inserts the new ones
export const setEntryTags = async (entryId, tagIds) => {
  await db_run(
    `DELETE FROM entries_to_tags WHERE entryid = ?`,
    [entryId]
  );

  if (!tagIds || tagIds.length === 0) return { message: "success" };

  const placeholders = tagIds.map(() => "(?, ?)").join(", ");
  const values = tagIds.flatMap((tagId) => [entryId, tagId]);

  return await db_run(
    `INSERT INTO entries_to_tags (entryid, tagid) VALUES ${placeholders}`,
    values
  );
};

// Get all entries with their tags for a user (used to enrich getAll response)
export const getTagsForEntries = async (user) => {
  const rows = await db_all(
    `SELECT ett.entryid, et.id, et.name
     FROM entries_to_tags ett
     JOIN entry_tags et ON et.id = ett.tagid
     JOIN entries e ON e.id = ett.entryid
     WHERE e.userid = ?`,
    [user.id]
  );

  // Group by entryid → { [entryid]: [{ id, name }] }
  const map = {};
  for (const row of rows) {
    if (!map[row.entryid]) map[row.entryid] = [];
    map[row.entryid].push({ id: row.id, name: row.name });
  }
  return map;
};
