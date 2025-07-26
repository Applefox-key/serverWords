import { db_run, db_get, db_all } from "../helpers/dbAsync.js";

//all by admin
export const getAllLabels = async () => {
  const query = `SELECT * FROM labels`;
  return await db_get(query);
};

//get one by name
export const getLabelByName = async (user, name) => {
  let query = `SELECT * FROM labels WHERE name=? AND userid=?`;
  let params = [name];
  const userid = user.id;
  params.push(userid);

  return await db_get(query, params);
};
//get one by id
export const getLabelById = async (user, id) => {
  let query = `SELECT * FROM labels WHERE id=? AND userid=?`;
  let params = [id];

  const userid = user.id;
  params.push(userid);
  return await db_get(query, params);
};
//get ALL
export const getLabelsAll = async (user) => {
  // let query = `SELECT * FROM categories WHERE userid=?`;

  let query = `SELECT labels.id AS id, labels.name AS name, labels.userid as userid, COUNT(expressions.id) AS expressions_count
  FROM labels  
  LEFT JOIN expressions  
  ON expressions.labelid = labels.id
   WHERE labels.userid=?  
   GROUP BY labels.id`;
  const userid = user.id;
  let params = [userid];

  return await db_all(query, params);
};

//create (one for user and return new row's id )
export const createUserLabel = async (user, name) => {
  const userid = user.id;
  let lab = await getLabelByName(user, name);

  if (lab)
    return lab
      ? { id: lab.id }
      : { error: `label with name ${name} is already exist` };

  return await db_get(
    `INSERT INTO labels (name, userid) VALUES (?,?)  RETURNING id`,
    [name, userid]
  );
};

//edit label's name
export const editLabel = async (user, name, id) => {
  let lab = await getLabelByName(user, name);

  if (lab) return { error: `label with name ${name} is already exist` };

  const userid = user.id;
  return await db_run(
    `UPDATE labels set
      name = COALESCE(?,name)
                   WHERE id = ? AND userid =? `,
    [name, id, userid]
  );
};
//delete users one label
export const deleteLabel = async (id) => {
  let res = await db_run(`DELETE FROM labels WHERE id = ${id}`);
  return res;
};

//delete users all labels by userid
export const deleteUsersAllLabels = async (user) => {
  const userid = user.id;

  let res = await db_run(`DELETE FROM labels WHERE userid = ${userid}`)
    .then(() => {
      return { message: "success" };
    })
    .catch((error) => {
      return { error: error };
    });
  return res;
};
