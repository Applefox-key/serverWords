import { db_get, db_all } from "../helpers/dbAsync.js";
import { getTagsForPublicCollections } from "./collectionTagsM.js";

//get  all collections with content
export const getAllWithContent = async () => {
  const rows = await db_all(
    `SELECT collections.id, collections.name AS name, collections.note, isPublic, isFavorite, categoryid,  collections.userid,
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
export const getAllWithCount = async () => {
  const rows = await db_all(
    `SELECT collections.id, collections.name AS name, collections.note, isPublic, isFavorite, categoryid, 
      categories.name AS category,  
      COUNT(content.id) AS content_count
       FROM collections  
       LEFT JOIN content ON collections.id = content.collectionid
       LEFT JOIN categories ON collections.categoryid = categories.id
       WHERE isPublic = ${true}
       GROUP BY collections.id
       ORDER BY categories.name ASC, collections.name ASC;
       `
  );

  if (!rows) return [];
  const tagsMap = await getTagsForPublicCollections();
  return rows.map(row => ({ ...row, tags: tagsMap[row.id] ?? [] }));
};
//get  one collection with content
export const getOneWithContent = async (id) => {
  const rows = await db_all(
    `SELECT collections.id, collections.note, isPublic, isFavorite, collections.userid as userid, collections.name as name,categoryid,
          categories.name as category, 
          question, answer, imgA, imgQ , content.note as note_cont, content.id as id_cont 
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
export const getAll = async (user) => {
  const userid = user.id;
  const rows = await db_all(`
  SELECT *,
    CASE WHEN userid = ${userid} THEN 1 ELSE 0 END AS isMy
  FROM collections
  WHERE isPublic = ${true}
`);

  if (!rows) return [];
  const tagsMap = await getTagsForPublicCollections();
  return rows.map(row => ({ ...row, tags: tagsMap[row.id] ?? [] }));
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
