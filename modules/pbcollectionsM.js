import { db_get, db_all } from "../helpers/dbAsync.js";
import { getTagsForPublicCollections } from "./collectionTagsM.js";

//get  all collections with content
export const getAllWithContent = async () => {
  const rows = await db_all(
    `SELECT collections.id, collections.name AS name, collections.note, isPublic, isFavorite, categoryid, collections.userid, collections.layout,
      categories.name AS category,
      content.note as note_cont, content.id as id_cont, question, answer
       FROM collections  LEFT JOIN  content 
       ON collections.id = content.collectionid
       LEFT JOIN  categories  
       ON collections.categoryid = categories.id
       WHERE isPublic = ${true}
       ORDER BY categories.name ASC, collections.name ASC, content.question ASC;
       `
  );

  if (!rows) return [];
  const tagsMap = await getTagsForPublicCollections();
  return rows.map(row => ({ ...row, collectionTags: tagsMap[row.id] ?? [] }));
};
//get  all collections with count of cards
export const getAllWithCount = async (pagination = {}) => {
  const { page, limit, search } = pagination;
  const isPaged = page != null && limit != null;

  const searchClause = search
    ? `AND (LOWER(collections.name) LIKE LOWER(?) OR LOWER(collections.note) LIKE LOWER(?))`
    : "";
  const searchTerm = search ? `%${search}%` : null;
  const params = [
    ...(search ? [searchTerm, searchTerm] : []),
    ...(isPaged ? [limit, (page - 1) * limit] : []),
  ];

  const rows = await db_all(
    `SELECT collections.id, collections.name AS name, collections.note, isPublic, isFavorite, categoryid,
      categories.name AS category,
      COUNT(content.id) AS content_count
       FROM collections
       LEFT JOIN content ON collections.id = content.collectionid
       LEFT JOIN categories ON collections.categoryid = categories.id
       WHERE isPublic = ${true}
       ${searchClause}
       GROUP BY collections.id
       ORDER BY categories.name COLLATE NOCASE ASC, collections.name COLLATE NOCASE ASC
       ${isPaged ? "LIMIT ? OFFSET ?" : ""}`,
    params
  );

  if (!rows) return isPaged ? { data: [], total: 0, page, limit } : [];

  const ids = rows.map((r) => r.id);
  const tagsMap = await getTagsForPublicCollections(isPaged ? ids : null);
  const data = rows.map((row) => ({ ...row, tags: tagsMap[row.id] ?? [] }));

  if (!isPaged) return data;

  const countRow = await db_get(
    `SELECT COUNT(*) AS total FROM collections
     WHERE isPublic = ${true} ${searchClause}`,
    search ? [searchTerm, searchTerm] : []
  );
  return { data, total: countRow.total, page, limit };
};
//get  one collection with content
export const getOneWithContent = async (id) => {
  const rows = await db_all(
    `SELECT collections.id, collections.note, isPublic, isFavorite, collections.userid as userid, collections.name as name, categoryid, collections.layout,
          categories.name as category,
          question, answer, imgA, imgQ, content.note as note_cont, content.id as id_cont
    FROM collections  
    LEFT JOIN  content  
    ON collections.id = content.collectionid
    LEFT JOIN  categories  
    ON collections.categoryid = categories.id
    WHERE collections.id = ? 
          AND isPublic = ${true}
    ORDER BY collections.name ASC, content.question ASC;`,
    [id]
  );

  if (!rows) return [];
  const tagsMap = await getTagsForPublicCollections();
  return rows.map(row => ({ ...row, collectionTags: tagsMap[row.id] ?? [] }));
};

//get users all public collections (list)
export const getAll = async (user, pagination = {}) => {
  const userid = user.id;
  const { page, limit, search } = pagination;
  const isPaged = page != null && limit != null;

  const searchClause = search
    ? `AND (LOWER(name) LIKE LOWER(?) OR LOWER(note) LIKE LOWER(?))`
    : "";
  const searchTerm = search ? `%${search}%` : null;
  const params = [
    ...(search ? [searchTerm, searchTerm] : []),
    ...(isPaged ? [limit, (page - 1) * limit] : []),
  ];

  const rows = await db_all(
    `SELECT *,
      CASE WHEN userid = ${userid} THEN 1 ELSE 0 END AS isMy
    FROM collections
    WHERE isPublic = ${true}
    ${searchClause}
    ORDER BY name COLLATE NOCASE ASC
    ${isPaged ? "LIMIT ? OFFSET ?" : ""}`,
    params
  );

  if (!rows) return isPaged ? { data: [], total: 0, page, limit } : [];

  const ids = rows.map((r) => r.id);
  const tagsMap = await getTagsForPublicCollections(isPaged ? ids : null);
  const data = rows.map((row) => ({ ...row, tags: tagsMap[row.id] ?? [] }));

  if (!isPaged) return data;

  const countRow = await db_get(
    `SELECT COUNT(*) AS total FROM collections
     WHERE isPublic = ${true} ${searchClause}`,
    search ? [searchTerm, searchTerm] : []
  );
  return { data, total: countRow.total, page, limit };
};

//get one collection by id
export const getOne = async (id) => {
  const row = await db_get(
    "SELECT * FROM collections WHERE isPublic = ${true} AND id = ? ",
    [id]
  );
  if (!row) return [];
  return row;
};
