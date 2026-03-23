import { db_run, db_get, db_all } from "../helpers/dbAsync.js";

// ── Tags CRUD ────────────────────────────────────────────────────────

// Get all tags for a user
export const getAll = async (user) => {
  return await db_all(
    `SELECT * FROM collection_tags WHERE userid = ? ORDER BY name COLLATE NOCASE ASC`,
    [user.id]
  );
};

// Create a new tag
export const createTag = async (user, name) => {
  return await db_get(
    `INSERT INTO collection_tags (name, userid) VALUES (?, ?) RETURNING id`,
    [name, user.id]
  );
};

// Rename a tag
export const editTag = async (user, id, name) => {
  return await db_run(
    `UPDATE collection_tags SET name = ? WHERE id = ? AND userid = ?`,
    [name, id, user.id]
  );
};

// Delete a tag (collections_to_tags rows cascade automatically)
export const deleteTag = async (user, id) => {
  return await db_run(
    `DELETE FROM collection_tags WHERE id = ? AND userid = ?`,
    [id, user.id]
  );
};

// ── Tag ↔ Collection binding ─────────────────────────────────────────

// Get all tags for a specific collection
export const getByCollection = async (collectionId) => {
  return await db_all(
    `SELECT ct.id, ct.name
     FROM collection_tags ct
     JOIN collections_to_tags ctt ON ctt.tagid = ct.id
     WHERE ctt.collectionid = ?
     ORDER BY ct.name COLLATE NOCASE ASC`,
    [collectionId]
  );
};

// Replace all tags for a collection with a new set of tagIds
// Deletes existing links then inserts the new ones in one transaction
export const setCollectionTags = async (collectionId, tagIds) => {
  // Remove existing links
  await db_run(
    `DELETE FROM collections_to_tags WHERE collectionid = ?`,
    [collectionId]
  );

  // Nothing to insert
  if (!tagIds || tagIds.length === 0) return { message: "success" };

  const placeholders = tagIds.map(() => "(?, ?)").join(", ");
  const values = tagIds.flatMap((tagId) => [collectionId, tagId]);

  return await db_run(
    `INSERT INTO collections_to_tags (collectionid, tagid) VALUES ${placeholders}`,
    values
  );
};

// Get all collections with their tags for a user (used to enrich getAll response)
export const getTagsForCollections = async (user) => {
  const rows = await db_all(
    `SELECT ctt.collectionid, ct.id, ct.name
     FROM collections_to_tags ctt
     JOIN collection_tags ct ON ct.id = ctt.tagid
     JOIN collections c ON c.id = ctt.collectionid
     WHERE c.userid = ?`,
    [user.id]
  );

  // Group by collectionid → { [collectionid]: [{ id, name }] }
  const map = {};
  for (const row of rows) {
    if (!map[row.collectionid]) map[row.collectionid] = [];
    map[row.collectionid].push({ id: row.id, name: row.name });
  }
  return map;
};
