import { db_run, db_get, db_all } from "../helpers/dbAsync.js";
import { User } from "../classes/User.js";
import { deleteImgs } from "./images.js";

//all by admin
export const getAllUsersCollections = async () => {
  try {
    const res = await db_all("SELECT * FROM collections");
    if (res) return res;
    return "";
  } catch (error) {
    res.status(400).json({ error: error.message });
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
  // // const userid = User.getInstance().user.id;
  // const row = await db_get(
  //   `SELECT *
  //   ON collections.categoryid = categories.id WHERE userid = ? AND id = ? `,
  //   [userid, id]
  // );
  // return !row ? [] : row;
};
//get users all collections without content
export const getAll = async () => {
  const userid = User.getInstance().user.id;
  const rows = await db_all(
    `SELECT collections.id, collections.note, collections.name AS name, isPublic, collections.categoryid, isFavorite,
    categories.name AS category
    FROM collections  
    LEFT JOIN categories  
    ON collections.categoryid = categories.id
    WHERE collections.userid = ${userid}
    `
  );
  return !rows ? [] : rows;
};
export const deleteAll = async () => {
  const userid = User.getInstance().user.id;
  return await db_all(
    `DELETE 
    FROM collections  
    WHERE userid = ?`,
    [userid]
  );
};
//get users one collection by id
export const getOne = async (id) => {
  const userid = User.getInstance().user.id;
  const row = await db_get(
    `SELECT collections.name AS name, note, isPublic, isFavorite, categoryid, categories.name AS category FROM collections
    LEFT JOIN categories 
    ON collections.categoryid = categories.id WHERE userid = ? AND id = ? `,
    [userid, id]
  );
  return !row ? [] : row;
};
//create users one collection without content
export const createCollection = async (set) => {
  const userid = User.getInstance().user.id;
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
