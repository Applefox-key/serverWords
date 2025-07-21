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
export const getList = async (filter = "", labelid = "", stage = "") => {
  const userid = User.getInstance().user.id;
  const label_Part = !labelid
    ? ""
    : labelid !== "null"
    ? ` AND expressions.labelid = ${labelid} `
    : ` AND expressions.labelid IS NULL OR expressions.labelid = "" `;
  const stage_Part = stage === "" ? "" : ` AND expressions.stage = ${stage} `;
  const rows = await db_all(
    `SELECT expressions.*,  
     labels.name AS label
     FROM expressions
     LEFT JOIN labels  
     ON expressions.labelid = labels.id
     WHERE expressions.userid = ?` +
      (filter ? ` AND expressions.phrase LIKE  ? ` : "") +
      label_Part +
      stage_Part +
      `ORDER BY id DESC`,
    filter ? [userid, filter] : [userid]
  );

  if (!rows) return [];
  return rows;
};
export const getListByFolders = async (
  filter = "",
  labelid = "",
  stage = ""
) => {
  const userid = User.getInstance().user.id;

  const label_Part = !labelid
    ? ""
    : labelid !== "null"
    ? ` AND expressions.labelid = ${labelid} `
    : ` AND (expressions.labelid IS NULL OR expressions.labelid = "") `;

  const stage_Part = stage === "" ? "" : ` AND expressions.stage = ${stage} `;

  const rows = await db_all(
    `SELECT expressions.*, labels.name AS label
     FROM expressions
     LEFT JOIN labels ON expressions.labelid = labels.id
     WHERE expressions.userid = ?` +
      (filter ? ` AND expressions.phrase LIKE ? ` : "") +
      label_Part +
      stage_Part +
      ` ORDER BY label COLLATE NOCASE ASC, expressions.id DESC`,
    filter ? [userid, filter] : [userid]
  );

  if (!rows) return [];

  const grouped = new Map();

  for (const row of rows) {
    const key = row.labelid ?? "null";
    if (!grouped.has(key)) {
      grouped.set(key, {
        labelid: row.labelid,
        labelname: row.label || "No Label",
        items: [],
      });
    }
    grouped.get(key).items.push({ ...row });
  }

  return [...grouped.values()];
};
export const getListPage = async (
  limit,
  offset,
  filter = "",
  labelid = "",
  stage = ""
) => {
  const userid = User.getInstance().user.id;

  let total = await db_all(
    "SELECT COUNT(*) as total FROM expressions WHERE userid = ?" +
      (filter ? ` AND phrase LIKE ? ` : ""),
    filter ? [userid, filter] : [userid]
  );
  const label_Part = !labelid
    ? ""
    : labelid !== "null"
    ? ` AND expressions.labelid = ${labelid} `
    : ` AND expressions.labelid IS NULL OR expressions.labelid = "" `;
  const stage_Part = stage === "" ? "" : ` AND expressions.stage = ${stage} `;
  const rows = await db_all(
    `SELECT  expressions.*,  
    labels.name AS label
    FROM expressions
    LEFT JOIN labels  
    ON expressions.labelid = labels.id
    WHERE expressions.userid = ?` +
      (filter ? ` AND expressions.phrase LIKE ? ` : "") +
      label_Part +
      stage_Part +
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
    AND stage < 9
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
    `INSERT INTO expressions (expression, stage, phrase, history,nextDate,userid,labelid,note) VALUES (?,?,?,?,?,?,?,?)`,
    [
      set.expression,
      0,
      set.phrase,
      JSON.stringify([{ action: "add", date: new Date().getTime() }]),
      today,
      userid,
      labelid,
      set.note,
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
export const deleteSomeExpressions = async (idsList) => {
  console.log(idsList);

  const placeholders = idsList.map(() => "?").join(",");
  const userid = User.getInstance().user.id;
  let res = await db_run(
    `DELETE FROM expressions WHERE userid = ${userid} AND id IN (${placeholders})`,
    idsList
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
    set.hasOwnProperty("labelid") ||
    set.hasOwnProperty("note")
  ) {
    dataUpd = [
      set.expression,
      null,
      set.phrase,
      null,
      null,
      labelid === "" ? null : set.labelid,
      set.note,
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
    labelid = ${set.hasOwnProperty("labelid") ? "?" : "COALESCE(?,labelid)"},
    note = COALESCE(?,note)
    WHERE id = ?`,
    [...dataUpd]
  );
  return res;
};
export const updateExpressionLabel = async (id, labelid) => {
  let res = await db_run(
    `UPDATE expressions set 
      labelid = ? 
      WHERE id = ?`,
    [labelid, id]
  );
  return res;
};
