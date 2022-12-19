import { db_run, db_get, db_all } from "../helpers/dbAsync.js";
import md5 from "md5";
import { User } from "../classes/User.js";

export const formatCollectionContent = (data) => {
  if (data == []) return [];

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
      });
      map.set(el.id, val);
    }
  });
  return [...map.values()];
};

//get users all collections with content
export const getAllWithContent = async (select = "") => {
  const userid = User.getInstance().user.id;
  let queryPart = "";
  if (select) {
    if (select.categoryid)
      queryPart += ` AND categoryid = ${select.categoryid} `;
    if (select.textFilter)
      queryPart += ` AND (instr(lower(collections.name),lower("${select.textFilter}"))> 0 
                    OR instr(lower(question),lower("${select.textFilter}"))> 0
                    OR instr(lower(answer),lower("${select.textFilter}"))> 0
                    OR instr(lower(content.note),lower("${select.textFilter}"))> 0)
        `;
  }

  // ${queryPart}
  const rows = await db_all(
    `SELECT collections.id , collections.name AS name, categoryid, collections.note, 
    categories.name AS category, 
    content.note AS note_cont, content.id AS id_cont, question,answer 
       FROM collections  LEFT JOIN  content 
       ON collections.id = content.collectionid
       LEFT JOIN  categories  
       ON collections.categoryid = categories.id
       WHERE collections.userid = ? ${queryPart}`,
    [userid]
  );

  //  WHERE collections.userid = ?${queryPart}`,

  return !rows ? [] : rows;
};
//get users all collections with content
export const getAllWithContentByCategory = async (catid) => {
  const rows = await db_all(
    `SELECT collections.id , name, categoryid, collections.note, content.note AS note_cont, content.id AS id_cont, question,answer 
       FROM collections  LEFT JOIN  content 
       ON collections.id = content.collectionid
       WHERE categoryid = ? `,
    [catid]
  );

  return !rows ? [] : rows;
};
//get users one collections with content
export const getOneWithContent = async (id) => {
  const userid = User.getInstance().user.id;
  const rows = await db_all(
    `SELECT collections.id, collections.note, collections.name AS name,categoryid,
          categories.name AS category, 
          question, answer, content.note AS note_cont, content.id AS id_cont 
    FROM collections  
    LEFT JOIN  content  
    ON collections.id = content.collectionid
    LEFT JOIN  categories  
    ON collections.categoryid = categories.id
    WHERE collections.userid = ? AND collections.id = ?`,
    [userid, id]
  );

  return !rows ? [] : rows;
};
//create content by collection id
export const createCollectionContent = async (set, id) => {
  return await db_run(
    `INSERT INTO content (question, answer, note, collectionid) VALUES (?,?,?,?)`,
    [set.question, set.answer, set.note, id]
  );
};
//delete content by collection id
export const deleteItemsByColId = async (colid) => {
  return await db_run(`DELETE FROM content WHERE collectionid = ${colid}`);
};
