import { db_run, db_get, db_all } from "../helpers/dbAsync.js";
import { User } from "../classes/User.js";

//all by admin
export const getAllCategories = async (isPublic = false) => {
  const query = isPublic
    ? `SELECT * FROM categories WHERE userid is NULL`
    : `SELECT * FROM categories WHERE userid != NULL`;
  return await db_get(query);
};

//get one by name
export const getCategoryByName = async (name, isPublic = false) => {
  let query = isPublic
    ? `SELECT * FROM categories WHERE name=? AND userid is NULL`
    : `SELECT * FROM categories WHERE name=? AND userid=?`;
  let params = [name];

  if (!isPublic) {
    const userid = User.getInstance().user.id;
    params.push(userid);
  }
  return await db_get(query, params);
};
//get one by id
export const getCategoryById = async (id, isPublic = false) => {
  let query = isPublic
    ? `SELECT * FROM categories WHERE id=? AND userid is NULL`
    : `SELECT * FROM categories WHERE id=? AND userid=?`;
  let params = [id];

  if (!isPublic) {
    const userid = User.getInstance().user.id;
    params.push(userid);
  }
  return await db_get(query, params);
};
//get ALL
export const getCategoryAll = async (isPublic = false) => {
  let query = isPublic
    ? `SELECT * FROM categories WHERE userid IS NULL`
    : `SELECT * FROM categories WHERE userid=?`;
  let params = [];
  if (!isPublic) {
    const userid = User.getInstance().user.id;
    params.push(userid);
  }
  return await db_all(query, params);
};
//create (one for user and return new row's id )or (create one for public and return new row's id)
export const createUserCategory = async (name) => {
  const userid = User.getInstance().user.id;
  let categ = await getCategoryByName(name);

  if (categ)
    return categ
      ? { id: categ.id }
      : { error: `category with name ${name} is already exist` };

  return await db_get(
    `INSERT INTO categories (name, userid) VALUES (?,?)  RETURNING id`,
    [name, userid]
  );
};

export const createPbCategory = async (name) => {
  //check if the category with such name is already exist
  let categ = await getCategoryByName(name, true);

  if (categ) return categ;
  //   ? { id: categ.id }
  //   : { error: `category with name ${name} is already exist` };
  //create new and retun id
  let result = await db_get(
    `INSERT INTO categories (name, userid) VALUES (?,?) RETURNING id`,
    [name, null]
  );
  return result ? result : null;
};

//edit category's name
export const editCategory = async (name, id, isPublic = false) => {
  let categ = await getCategoryByName(name, isPublic);

  if (categ) return { error: `category with name ${name} is already exist` };
  if (isPublic)
    return await db_run(
      `UPDATE categories set
      name = COALESCE(?,name)
                   WHERE id = ? AND userid IS NULL `,
      [name]
    );

  const userid = User.getInstance().user.id;
  return await db_run(
    `UPDATE categories set
      name = COALESCE(?,name)
                   WHERE id = ? AND userid =? `,
    [name, id, userid]
  );
};
//delete users one category
export const deleteCategory = async (id) => {
  let res = await db_run(`DELETE FROM categories WHERE id = ${id}`);
  return res;
};

//delete users one categories by userid
export const deleteUsersAllCategory = async () => {
  const userid = User.getInstance().user.id;

  let res = await db_run(`DELETE FROM categories WHERE userid = ${userid}`)
    .then(() => {
      return { message: "success" };
    })
    .catch((error) => {
      return { error: error };
    });
  return res;
};

// copy user category to public category and return it's id
export const getPbCategoryFromUser = async (usCatid) => {
  if (!usCatid) return null; //no category
  //get user category by id
  let usCateg = await getCategoryById(usCatid);

  if (usCateg.error) return null;
  //create pb
  return createPbCategory(usCateg.name);
};
