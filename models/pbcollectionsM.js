import { db_run, db_get, db_all } from "../helpers/dbAsync.js";
import md5 from "md5";
import { User } from "../classes/User.js";
import * as categ from "./categoriesM.js";

export const createPbCollection = async (set) => {
  let categoryid = null;
  console.log("set");
  console.log(set);

  // if (!!set.categoryid)
  //   categoryid = await categ.getPbCategoryFromUser(set.categoryid).id;
  if (!!set.category) {
    let category = await categ.createPbCategory(set.category);
    console.log("category");
    console.log(category);
    categoryid = category.id;
  }
  console.log("categoryid");
  console.log(categoryid);

  const userid = User.getInstance().user.id;
  return await db_get(
    `INSERT INTO pbcollections (name, note, userid,categoryid) VALUES (?,?,?,?) RETURNING pbcollections.id`,
    [set.name, set.note, userid, categoryid]
  );
};

//create content by collection id
export const createPbContent = async (set, id) => {
  return await db_run(
    `INSERT INTO pbcontent (question, answer, note, collectionid) VALUES (?,?,?,?)`,
    [set.question, set.answer, set.note, id]
  );
};
// //delete collection by collection id
export const deleteCollection = async (id) => {
  let res = await db_run(`DELETE FROM pbcollections WHERE id = ${id}`)
    .then(() => {
      return { message: "success" };
    })
    .catch((error) => {
      return { error: error };
    });
  return res;
};
export const deleteCollAllByUser = async () => {
  const userid = User.getInstance().user.id;
  let res = await db_run(`DELETE FROM pbcollections WHERE userid = ${userid}`)
    .then(() => {
      return { message: "success" };
    })
    .catch((error) => {
      return { error: error };
    });
  return res;
};
//get  all collections with content
export const getAllWithContent = async () => {
  // const userid = User.getInstance().user.id;
  const rows = await db_all(
    `SELECT pbcollections.id, name, pbcollections.note, categoryid, pbcontent.note as note_cont, pbcontent.id as id_cont, question,answer 
       FROM pbcollections  LEFT JOIN  pbcontent 
       ON pbcollections.id = pbcontent.collectionid`
  );
  if (!rows) return [];
  return rows;
};

//get  one collection with content
export const getOneWithContent = async (id) => {
  const rows = await db_all(
    `SELECT pbcollections.id, pbcollections.note, pbcollections.name as name,categoryid,
          categories.name as category, 
          question, answer, pbcontent.note as note_cont, pbcontent.id as id_cont 
    FROM pbcollections  
    LEFT JOIN  pbcontent  
    ON pbcollections.id = pbcontent.collectionid
    LEFT JOIN  categories  
    ON pbcollections.categoryid = categories.id
    WHERE pbcollections.id = ?`,
    [id]
  );
  if (!rows) return [];
  return rows;
};

//get users all collections (list)
export const getAll = async () => {
  const rows = await db_all("select * from pbcollections ");
  if (!rows) return [];
  return rows;
};
//get users all collections (list)
export const getAllByUser = async () => {
  const userid = User.getInstance().user.id;
  const rows = await db_all(
    "select * from pbcollections WHERE userid=" + userid
  );
  if (!rows) return [];
  return rows;
};
//get one collection by id
export const getOne = async (id) => {
  const row = await db_get("select * from pbcollections where id = ? ", [id]);
  if (!row) return [];
  return row;
};
