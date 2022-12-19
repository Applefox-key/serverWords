import { db_run, db_all } from "../helpers/dbAsync.js";
import md5 from "md5";
import { User } from "../classes/User.js";

//all by admin
export const getAllUsersExpressions = async () => {
  try {
    const res = await db_all("SELECT * FROM expressions");
    return res ? res : "";
  } catch (error) {
    return { error: error.message };
  }
};
export const getList = async () => {
  const userid = User.getInstance().user.id;
  const rows = await db_all(
    "SELECT * FROM expressions where userid = " + userid
  );
  if (!rows) return [];
  return rows;
};

export const getUnreadListByToken = async (offset_ms = 0) => {
  let offset_s = offset_ms / 1000;
  const userid = User.getInstance().user.id;
  const rows = await db_all(
    `SELECT *,
    date(UNIXEPOCH()-?,'unixepoch'),
    date((nextDate-?)/1000,'unixepoch'), 
    date(nextDate/1000,'unixepoch'), 
    date() 
    FROM expressions 
    WHERE userid = ?  
    AND  date((nextDate-?)/1000,'unixepoch') <= date(UNIXEPOCH()-?,'unixepoch')`,
    [offset_s, offset_ms, userid, offset_ms, offset_s]
  );

  if (!rows) return [];

  return rows;
};

export const createExpression = async (set) => {
  const userid = User.getInstance().user.id;
  const categoryid = set.hasOwnProperty("categoryid") ? set.categoryid : null;
  let today = new Date().getTime();
  return await db_run(
    `INSERT INTO expressions (expression, stage, phrase, history,nextDate,userid,categoryid) VALUES (?,?,?,?,?,?,?)`,
    [
      set.expression,
      0,
      set.phrase,
      JSON.stringify([{ action: "add", date: new Date().getTime() }]),
      today,
      userid,
      categoryid,
    ]
  );
};

export const deleteExpression = async (id) => {
  const userid = User.getInstance().user.id;
  let res = await db_run(
    `DELETE FROM expressions WHERE userid = ${userid} ${
      id === "*" ? "" : " AND id = " + id
    }`
  );
  return res;
};
export const deleteAllExpressions = async () => {
  const userid = User.getInstance().user.id;
  let res = await db_run(`DELETE FROM expressions WHERE userid = ${userid}`);
  return res;
};
export const updateExpression = async (set) => {
  let dataUpd;
  //expression, stage, phrase, history,nextDate,id
  if (set.hasOwnProperty("expression") || set.hasOwnProperty("phrase")) {
    dataUpd = [
      set.expression,
      null,
      set.phrase,
      null,
      null,
      set.category,
      set.id,
    ]; //one
  } else {
    dataUpd = [
      null,
      set.stage,
      null,
      JSON.stringify(set.history),
      set.nextDate,
      null,
      set.id,
    ]; //one
  }
  let res = await db_run(
    `UPDATE expressions set 
    expression = COALESCE(?,expression), 
    stage = COALESCE(?,stage), 
    phrase = COALESCE(?,phrase), 
    history = COALESCE(?,history),
    nextDate = COALESCE(?,nextDate),
    categoryid = COALESCE(?,categoryid)
    WHERE id = ?`,
    [...dataUpd]
  );
  return res;
};
