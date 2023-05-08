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
export const getList = async (filter = "", labelid = "") => {
  const userid = User.getInstance().user.id;

  const rows = await db_all(
    `SELECT expressions.*,  
     labels.name AS label
     FROM expressions
     LEFT JOIN labels  
     ON expressions.labelid = labels.id
     WHERE expressions.userid = ?` +
      (filter ? ` AND expressions.phrase LIKE  ? ` : "") +
      (labelid ? ` AND expressions.labelid = ${labelid} ` : "") +
      `ORDER BY id DESC`,
    filter ? [userid, filter] : [userid]
  );

  if (!rows) return [];
  return rows;
};

export const getListPage = async (limit, offset, filter = "", labelid = "") => {
  const userid = User.getInstance().user.id;
  console.log(filter);

  let total = await db_all(
    "SELECT COUNT(*) as total FROM expressions WHERE userid = ?" +
      (filter ? ` AND phrase LIKE ? ` : ""),
    filter ? [userid, filter] : [userid]
  );
  console.log(total);

  const rows = await db_all(
    `SELECT  expressions.*,  
    labels.name AS label
    FROM expressions
    LEFT JOIN labels  
    ON expressions.labelid = labels.id
    WHERE expressions.userid = ?` +
      (filter ? ` AND expressions.phrase LIKE ? ` : "") +
      (labelid ? ` AND expressions.labelid = ${labelid} ` : "") +
      `ORDER BY id DESC
    LIMIT ? OFFSET ?`,
    filter ? [userid, filter, limit, offset] : [userid, limit, offset]
  );
  if (!rows) return [[], total];
  return { list: rows, total };
};
export const getUnreadListByToken = async (offset_ms = 0, labelid = "") => {
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
    AND  date((nextDate-?)/1000,'unixepoch') <= date(UNIXEPOCH()-?,'unixepoch')` +
      (labelid ? ` AND expressions.labelid = ${labelid} ` : ""),
    [offset_s, offset_ms, userid, offset_ms, offset_s]
  );

  if (!rows) return [];

  return rows;
};

export const createExpression = async (set) => {
  const userid = User.getInstance().user.id;
  const labelid = set.hasOwnProperty("labelid") ? set.labelid : null;
  let today = new Date().getTime();
  return await db_run(
    `INSERT INTO expressions (expression, stage, phrase, history,nextDate,userid,labelid) VALUES (?,?,?,?,?,?,?)`,
    [
      set.expression,
      0,
      set.phrase,
      JSON.stringify([{ action: "add", date: new Date().getTime() }]),
      today,
      userid,
      labelid,
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
  let labelid = set.hasOwnProperty("labelid") ? set.labelid : null;
  //expression, stage, phrase, history,nextDate,id
  if (
    set.hasOwnProperty("expression") ||
    set.hasOwnProperty("phrase") ||
    set.hasOwnProperty("labelid")
  ) {
    dataUpd = [
      set.expression,
      null,
      set.phrase,
      null,
      null,
      labelid === "" ? null : set.labelid,
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
    labelid = ${set.hasOwnProperty("labelid") ? "?" : "COALESCE(?,labelid)"}
    WHERE id = ?`,
    [...dataUpd]
  );
  return res;
};
