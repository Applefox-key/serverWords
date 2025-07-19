import { db_run, db_all } from "../helpers/dbAsync.js";
import { User } from "../classes/User.js";
import { saveImg } from "./images.js";

export const formatCollectionContent = (data, addIsMy = false) => {
  if (data == []) return [];
  const userid = User.getInstance().user.id;
  const map = new Map();
  data.forEach((el) => {
    if (!map.has(el.id))
      map.set(el.id, {
        collection: {
          id: el.id,
          name: el.name,
          note: el.note,
          categoryid: el.categoryid,
          category: el.category,
          isPublic: el.isPublic,
          isFavorite: el.isFavorite,
        },
        content: [],
      });
    if (el.id_cont) {
      let val = map.get(el.id);
      val.content.push({
        id: el.id_cont,
        question: el.question,
        answer: el.answer,
        note: el.note_cont,
        imgA: el.imgA,
        imgQ: el.imgQ,
        collectionid: el.id,
        ...(el.rate !== undefined ? { rate: el.rate } : {}),
      });
      if (addIsMy) val.isMy = userid === el.userid;
      map.set(el.id, val);
    }
  });

  return [...map.values()];
};

//get one collections with content ADMIN
export const getOneWithContentAdmin = async (id) => {
  // const userid = User.getInstance().user.id;

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

  return !rows ? [] : rows;
};
//get users all collections with content
export const getAllWithContent = async (select = "") => {
  const userid = User.getInstance().user.id;
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
export const getOneWithContent = async (id) => {
  const userid = User.getInstance().user.id;
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
  set,
  id,
  fromUser = "",
  images = ""
) => {
  let [imageQUrl, imageAUrl] = await saveImg(set, images, id, fromUser);

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
