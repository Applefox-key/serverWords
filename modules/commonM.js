import { db_run, db_all } from "../helpers/dbAsync.js";
import { saveImg } from "./images.js";

//get one collections with content ADMIN
export const getOneWithContentAdmin = async (id) => {
  console.log(id);
  const rows = await db_all(
    `SELECT collections.id, collections.note, collections.name AS name,categoryid,
          categories.name AS category, 
          question, answer, imgA, imgQ, rate, content.note AS note_cont, content.id AS id_cont 
    FROM collections  
    LEFT JOIN  content  
    ON collections.id = content.collectionid
    LEFT JOIN  categories  
    ON collections.categoryid = categories.id
    WHERE collections.id = ?`,
    [id]
  );
  console.log(rows);

  return rows || [];
};

export const getAllWithContentAdmin = async () => {
  const rows = await db_all(
    `SELECT collections.id, collections.note, collections.userid, collections.name AS name,categoryid,
          categories.name AS category, 
          question, answer, imgA, imgQ, rate, content.note AS note_cont, content.id AS id_cont 
    FROM collections  
    LEFT JOIN  content  
    ON collections.id = content.collectionid
    LEFT JOIN  categories  
    ON collections.categoryid = categories.id
    `
  );
  console.log(rows);

  return rows || [];
};
//get users all collections with content
export const getAllWithContent = async (user, select = "") => {
  const userid = user.id;
  let queryPart = "";
  if (select) {
    if (select.categoryid)
      queryPart += ` AND categoryid = ${select.categoryid} `;
    if (select.isFavorite) queryPart += ` AND isFavorite = ${true} `;
    if (select.isPublic === "1") queryPart += ` AND isPublic = ${true} `;
    if (select.textFilter)
      queryPart += ` AND (instr(lower(collections.name),lower("${select.textFilter}"))> 0 
                    OR instr(lower(question),lower("${select.textFilter}"))> 0
                    OR instr(lower(answer),lower("${select.textFilter}"))> 0
                    OR instr(lower(content.note),lower("${select.textFilter}"))> 0)
        `;
  }

  // ${queryPart}
  const rows = await db_all(
    `SELECT collections.id , collections.name AS name, categoryid, isPublic, isFavorite, collections.note, 
    categories.name AS category, 
    content.note AS note_cont, content.id AS id_cont, question,answer, imgA, imgQ, rate 
       FROM collections  LEFT JOIN  content 
       ON collections.id = content.collectionid
       LEFT JOIN  categories  
       ON collections.categoryid = categories.id
       WHERE collections.userid = ? ${queryPart}
       ORDER BY categories.name COLLATE NOCASE ASC, collections.name ASC, content.question ASC;`,
    [userid]
  );

  //  WHERE collections.userid = ?${queryPart}`,

  return !rows ? [] : rows;
};
//get users all collections with content
export const getAllWithContentByCategory = async (catid) => {
  const rows = await db_all(
    `SELECT collections.id , name, categoryid, collections.note, isPublic, isFavorite,
       content.note AS note_cont, content.id AS id_cont, question,answer, imgA, imgQ, rate  
       FROM collections  LEFT JOIN  content 
       ON collections.id = content.collectionid
       WHERE categoryid = ?  
       ORDER BY collections.name ASC, content.question ASC;`,
    [catid]
  );
  return !rows ? [] : rows;
};
//get users one collections with content
export const getOneWithContent = async (user, id) => {
  const userid = user.id;
  const rows = await db_all(
    `SELECT collections.id, collections.note, collections.name AS name,categoryid,
          categories.name AS category, isPublic, isFavorite,
          question, answer, imgA, imgQ , rate, content.note AS note_cont, content.id AS id_cont
    FROM collections  
    LEFT JOIN  content  
    ON collections.id = content.collectionid
    LEFT JOIN  categories  
    ON collections.categoryid = categories.id
    WHERE collections.userid = ? AND collections.id = ? 
    ORDER BY collections.name ASC, content.question ASC;`,
    [userid, id]
  );

  return !rows ? [] : rows;
};

//create content by collection id
export const createCollectionContent = async (
  user,
  set,
  id,
  fromUser = "",
  images = ""
) => {
  let [imageQUrl, imageAUrl] = await saveImg(user, set, images, id, fromUser);

  console.log("create content " + set);
  console.log({ ...{ imageQUrl, imageAUrl } });
  return await db_run(
    `INSERT INTO content (question, answer, note, rate, collectionid, imgQ, imgA) VALUES (?,?,?,?,?,?,?)`,
    [
      (set.question || "").trim(),
      (set.answer || "").trim(),
      (set.note || "").trim(),
      set.rate ?? 0,
      id,
      imageQUrl,
      imageAUrl,
    ]
  );
};
//delete content by collection id
export const deleteItemsByColId = async (colid) => {
  return await db_run(`DELETE FROM content WHERE collectionid = ${colid}`);
};
