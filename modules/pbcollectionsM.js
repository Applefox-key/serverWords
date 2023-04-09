import { db_get, db_all } from "../helpers/dbAsync.js";

//get  all collections with content
export const getAllWithContent = async () => {
  // const userid = User.getInstance().user.id;

  const rows = await db_all(
    `SELECT collections.id, collections.name AS name, collections.note, isPublic, categoryid, 
      categories.name AS category,  
      content.note as note_cont, content.id as id_cont, question, answer 
       FROM collections  LEFT JOIN  content 
       ON collections.id = content.collectionid
       LEFT JOIN  categories  
       ON collections.categoryid = categories.id
       WHERE isPublic = ${true}`
  );

  if (!rows) return [];
  return rows;
};

//get  one collection with content
export const getOneWithContent = async (id) => {
  const rows = await db_all(
    `SELECT collections.id, collections.note,isPublic,collections.userid as userid, collections.name as name,categoryid,
          categories.name as category, 
          question, answer, imgA, imgQ , content.note as note_cont, content.id as id_cont 
    FROM collections  
    LEFT JOIN  content  
    ON collections.id = content.collectionid
    LEFT JOIN  categories  
    ON collections.categoryid = categories.id
    WHERE collections.id = ? 
          AND isPublic = ${true}
    `,
    [id]
  );

  if (!rows) return [];
  return rows;
};

//get users all public collections (list)
export const getAll = async () => {
  const rows = await db_all(`SELECT * FROM collections WHERE isPublic=${true}`);
  if (!rows) return [];
  return rows;
};

//get one collection by id
export const getOne = async (id) => {
  const row = await db_get(
    "SELECT * FROM collections isPublic=${true} AND WHERE id = ? ",
    [id]
  );
  if (!row) return [];
  return row;
};
