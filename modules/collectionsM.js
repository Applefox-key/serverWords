import { db_run, db_get, db_all } from "../helpers/dbAsync.js";
import { sendError } from "../helpers/responseHelpers.js";
import { deleteImgs } from "./images.js";
import { getTagsForCollections, getByCollection } from "./collectionTagsM.js";

//all by admin
export const getAllUsersCollections = async () => {
  try {
    const res = await db_all("SELECT * FROM collections");
    if (res) return res;
    return "";
  } catch (error) {
    sendError(res, error.message);
  }
};
//get users one collection by id
export const getByID_forImg = async (id) => {
  try {
    const res = await db_get("SELECT * FROM collections WHERE id = ?", [id]);
    if (res) return res;
    return "";
  } catch (error) {
    console.log(error.message);
    return "";
  }
};
//get users all collections without content
export const getAll = async (user, pagination = {}) => {
  const userid = user.id;
  const { page, limit, search, isFavorite, isPublic, tagId } = pagination;
  const isPaged = page != null && limit != null;

  const tagJoin = tagId
    ? `JOIN collections_to_tags ctt ON ctt.collectionid = collections.id AND ctt.tagid = ?`
    : "";

  const filterClauses = [
    isFavorite ? `AND isFavorite = ${true}` : "",
    isPublic ? `AND isPublic = ${true}` : "",
  ].join(" ");

  const searchClause = search
    ? `AND (LOWER(collections.name) LIKE LOWER(?) OR LOWER(collections.note) LIKE LOWER(?))`
    : "";
  const searchTerm = search ? `%${search}%` : null;
  const params = [
    ...(tagId ? [tagId] : []),
    ...(search ? [searchTerm, searchTerm] : []),
    ...(isPaged ? [limit, (page - 1) * limit] : []),
  ];

  const rows = await db_all(
    `SELECT collections.id, collections.note, collections.name AS name, isPublic, collections.categoryid, isFavorite,
    categories.name AS category,
    (SELECT ROUND(AVG(CASE WHEN typeof(rate) IN ('integer','real') THEN rate END), 2) FROM content WHERE collectionid = collections.id) AS avgRate,
    (SELECT COUNT(*) FROM content WHERE collectionid = collections.id AND typeof(rate) IN ('integer','real') AND rate <= 1) AS toLearn,
    (SELECT COUNT(*) FROM content WHERE collectionid = collections.id AND typeof(rate) IN ('integer','real') AND rate >= 2 AND rate <= 3) AS inProgress,
    (SELECT COUNT(*) FROM content WHERE collectionid = collections.id AND typeof(rate) IN ('integer','real') AND rate >= 4) AS learned
    FROM collections
    ${tagJoin}
    LEFT JOIN categories ON collections.categoryid = categories.id
    WHERE collections.userid = ${userid}
    ${filterClauses}
    ${searchClause}
    ORDER BY collections.name COLLATE NOCASE ASC
    ${isPaged ? "LIMIT ? OFFSET ?" : ""}`,
    params
  );
  if (!rows) return isPaged ? { data: [], total: 0, page, limit } : [];

  const ids = rows.map((r) => r.id);
  const tagsMap = await getTagsForCollections(user, isPaged ? ids : null);
  const data = rows.map(({ avgRate, toLearn, inProgress, learned, ...row }) => ({
    ...row,
    tags: tagsMap[row.id] ?? [],
    stats: { avgRate, toLearn, inProgress, learned },
  }));

  if (!isPaged) return data;

  const countRow = await db_get(
    `SELECT COUNT(*) AS total FROM collections
     ${tagJoin}
     WHERE userid = ${userid} ${filterClauses} ${searchClause}`,
    [
      ...(tagId ? [tagId] : []),
      ...(search ? [searchTerm, searchTerm] : []),
    ]
  );
  return { data, total: countRow.total, page, limit };
};

export const deleteAll = async (user) => {
  const userid = user.id;
  return await db_all(
    `DELETE 
    FROM collections  
    WHERE userid = ?`,
    [userid]
  );
};
//get users one collection by id
export const getOne = async (user, id) => {
  const userid = user.id;
  const row = await db_get(
    `SELECT collections.name AS name, note, isPublic, isFavorite, categoryid, categories.name AS category,
    (SELECT ROUND(AVG(CASE WHEN typeof(rate) IN ('integer','real') THEN rate END), 2) FROM content WHERE collectionid = collections.id) AS avgRate,
    (SELECT COUNT(*) FROM content WHERE collectionid = collections.id AND typeof(rate) IN ('integer','real') AND rate <= 1) AS toLearn,
    (SELECT COUNT(*) FROM content WHERE collectionid = collections.id AND typeof(rate) IN ('integer','real') AND rate >= 2 AND rate <= 3) AS inProgress,
    (SELECT COUNT(*) FROM content WHERE collectionid = collections.id AND typeof(rate) IN ('integer','real') AND rate >= 4) AS learned
    FROM collections
    LEFT JOIN categories
    ON collections.categoryid = categories.id WHERE userid = ? AND id = ?`,
    [userid, id]
  );
  if (!row) return [];
  const { avgRate, toLearn, inProgress, learned, ...rest } = row;
  const tags = await getByCollection(id);
  return { ...rest, tags, stats: { avgRate, toLearn, inProgress, learned } };
};
//create users one collection without content
export const createCollection = async (user, set) => {
  const userid = user.id;
  return await db_get(
    `INSERT INTO collections (name, note, userid, categoryid, isPublic, isFavorite) VALUES (?,?,?,?,?,?) RETURNING id`,
    [
      set.name,
      set.note,
      userid,
      set.categoryid ? set.categoryid : null,
      false,
      false,
    ]
  );
};
//delete users one collection
export const deleteCollection = async (id) => {
  deleteImgs(id);
  return await db_run(`DELETE FROM collections WHERE id = ${id}`);
};

//edit name and category of ones users collection
export const editCollection = async (set, id) => {
  let queryCat = " COALESCE(?,categoryid)";
  if (set.hasOwnProperty("categoryid")) queryCat = "?"; //if it is  - set even enpty value
  let queryisPublic = " COALESCE(?,isPublic)";
  if (set.hasOwnProperty("isPublic")) queryisPublic = "?"; //if it is  - set even enpty value
  let queryisFavorite = " COALESCE(?,isFavorite)";
  if (set.hasOwnProperty("isFavorite")) queryisFavorite = "?"; //if it is  - set even enpty value
  return await db_run(
    `UPDATE collections set
    name = COALESCE(?,name),
    note = COALESCE(?,note),
    categoryid = ${queryCat},
    isPublic = ${queryisPublic},
    isFavorite = ${queryisFavorite}
                 WHERE id = ?`,
    [set.name, set.note, set.categoryid, set.isPublic, set.isFavorite, id]
  );
};

//switch  collection attribute isPublic
export const switchIsPublic = async (user, isPublic, collectionId) => {
  const userid = user.id;
  const update_query = `
    UPDATE collections
    SET isPublic = ?
    WHERE id = ?;`;
  const delete_query = `
    DELETE FROM playlistsItems
    WHERE collectionid = ?
    AND playlistid IN (
      SELECT id
      FROM playlists
      WHERE userid != ?
    )
    AND ? = 0;
  `;

  const updateParams = [isPublic, collectionId];
  const deleteParams = [collectionId, userid, isPublic];

  await db_run(update_query, updateParams);
  return await db_run(delete_query, deleteParams);
};
