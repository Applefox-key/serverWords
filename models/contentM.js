import { db_run, db_get, db_all } from "../helpers/dbAsync.js";
import md5 from "md5";
import { User } from "../classes/User.js";

//get users one content item by id
export const getOneContentItem = async (id) => {
  // const userid = User.getInstance().user.id;
  const row = await db_get("SELECT * FROM content WHERE id = ? ", [id]);
  if (!row) return {};
  return row;
};
//get users one content item by id
export const getOnePbContentItem = async (id) => {
  // const userid = User.getInstance().user.id;
  const row = await db_get("SELECT * FROM pbcontent WHERE id = ? ", [id]);

  if (!row) return {};
  return row;
};
export const editContent = async (set, id) => {
  return await db_run(
    `UPDATE content set
      question = COALESCE(?,question),
      answer = COALESCE(?,answer),
      note = COALESCE(?,note)
               WHERE id = ?`,
    [set.question, set.answer, set.note, set.id]
  );
};

export const deleteItem = async (id) => {
  return await db_run(`DELETE FROM content WHERE id = ${id}`);
};
