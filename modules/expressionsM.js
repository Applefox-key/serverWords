import { db_run, db_all } from "../helpers/dbAsync.js";

function buildFilters({
  filter = "",
  labelid = "",
  stage = "",
  status = "",
  inQueue = null,
}) {
  const filters = [];
  const params = [];

  if (filter) {
    filters.push("expressions.phrase LIKE ?");
    params.push(`%${filter}%`);
  }

  if (labelid) {
    if (labelid === "null") {
      filters.push("(expressions.labelid IS NULL OR expressions.labelid = '')");
    } else {
      filters.push("expressions.labelid = ?");
      params.push(labelid);
    }
  }

  if (stage !== "") {
    filters.push("expressions.stage = ?");
    params.push(stage);
  }

  if (status !== "") {
    filters.push("expressions.status = ?");
    params.push(status);
  }

  if (inQueue !== "") {
    filters.push("expressions.inQueue = ?");
    params.push(inQueue);
  }

  const whereClause = filters.length ? " AND " + filters.join(" AND ") : "";

  return { whereClause, params };
}
//all by admin
export const getAllUsersExpressions = async () => {
  try {
    const res = await db_all("SELECT * FROM expressions");
    return res ? res : "";
  } catch (error) {
    return { error: error.message };
  }
};
export const getList = async (
  user,
  filter = "",
  labelid = "",
  stage = "",
  status = "",
  inQueue = null
) => {
  const userid = user.id;
  const { whereClause, params } = buildFilters({
    filter,
    labelid,
    stage,
    status,
    inQueue,
  });

  const sql = `
    SELECT expressions.*, labels.name AS label
    FROM expressions
    LEFT JOIN labels ON expressions.labelid = labels.id
    WHERE expressions.userid = ? ${whereClause}
    ORDER BY id DESC
  `;

  const rows = await db_all(sql, [userid, ...params]);

  if (!rows) return [];
  return rows;
};
export const getListByFolders = async (
  user,
  filter = "",
  labelid = "",
  stage = "",
  status = "",
  inQueue = ""
) => {
  const userid = user.id;
  const { whereClause, params } = buildFilters({
    filter,
    labelid,
    stage,
    status,
    inQueue,
  });

  const sql = `
    SELECT expressions.*, labels.name AS label
    FROM expressions
    LEFT JOIN labels ON expressions.labelid = labels.id
    WHERE expressions.userid = ? ${whereClause}
    ORDER BY label COLLATE NOCASE ASC, expressions.id DESC
  `;

  const rows = await db_all(sql, [userid, ...params]);

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
  user,
  limit,
  offset,
  filter = "",
  labelid = "",
  stage = "",
  status,
  inQueue
) => {
  const userid = user.id;
  const { whereClause, params } = buildFilters({
    filter,
    labelid,
    stage,
    status,
    inQueue,
  });

  // query part for calculation of total counts with filters
  const totalSql = `SELECT COUNT(*) as total FROM expressions WHERE userid = ? ${whereClause}`;
  // query part for the total of the query
  let totalParams = [userid, ...params];

  let totalResult = await db_all(totalSql, totalParams);
  let total = totalResult && totalResult.length > 0 ? totalResult[0].total : 0;

  // the main query
  let sql = `
    SELECT expressions.*, labels.name AS label
    FROM expressions
    LEFT JOIN labels ON expressions.labelid = labels.id
     WHERE expressions.userid = ? ${whereClause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  // new array of parameters for sql
  const queryParams = [userid, ...params, limit, offset];
  const rows = await db_all(sql, queryParams);

  if (!rows) return { list: [], total };

  return { list: rows, total };
};

export const getUnreadListByToken = async (
  user,
  offset_ms = 0,
  labelid = ""
) => {
  const offset_s = offset_ms / 1000;
  const userid = user.id;

  const labelClause =
    labelid && labelid !== "null" ? ` AND expressions.labelid = ?` : "";

  const query = `
    SELECT *, 
      date(UNIXEPOCH()-?,'unixepoch') AS currentDate,
      date((nextDate-?)/1000,'unixepoch') AS scheduledDate,
      date(nextDate/1000,'unixepoch') AS rawDate,
      date() AS today
    FROM expressions 
    WHERE userid = ?
      AND stage < 9
      AND status = 'active'
      AND (inQueue IS NULL OR inQueue = 0)
      AND date((nextDate - ?)/1000,'unixepoch') <= date(UNIXEPOCH() - ?,'unixepoch')
      ${labelClause}
  `;

  const params = [offset_s, offset_ms, userid, offset_ms, offset_s];
  if (labelid && labelid !== "null") params.push(labelid);

  const rows = await db_all(query, params);
  return rows || [];
};

export const createExpression = async (user, set) => {
  const userid = user.id;
  const labelid = set.hasOwnProperty("labelid") ? set.labelid : null;
  const status = "new"; // default new
  const inQueue = 0; // default 0 (false)
  let today = new Date().getTime();
  return await db_run(
    `INSERT INTO expressions (expression, stage, phrase, history,nextDate,userid,labelid,note,status,inQueue) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      set.expression,
      0,
      set.phrase,
      JSON.stringify([{ action: "add", date: new Date().getTime() }]),
      today,
      userid,
      labelid,
      set.note,
      status,
      inQueue,
    ]
  );
};
export const deleteExpression = async (user, id) => {
  const userid = user.id;
  let res = await db_run(
    `DELETE FROM expressions WHERE userid = ${userid} ${
      id === "*" ? "" : " AND id = " + id
    }`
  );
  return res;
};
export const deleteSomeExpressions = async (user, idsList) => {
  const placeholders = idsList.map(() => "?").join(",");
  const userid = user.id;
  let res = await db_run(
    `DELETE FROM expressions WHERE userid = ${userid} AND id IN (${placeholders})`,
    idsList
  );
  return res;
};
export const deleteAllExpressions = async (user) => {
  const userid = user.id;
  let res = await db_run(`DELETE FROM expressions WHERE userid = ${userid}`);
  return res;
};
export const updateExpression = async (set) => {
  const allowedFields = [
    "expression",
    "stage",
    "phrase",
    "history",
    "nextDate",
    "labelid",
    "note",
    "status",
    "inQueue",
  ];

  const fieldsToUpdate = [];
  const values = [];

  for (const field of allowedFields) {
    if (!set.hasOwnProperty(field)) continue;

    if (field === "history") {
      fieldsToUpdate.push(`${field} = ?`);
      values.push(JSON.stringify(set[field]));
    } else if (field === "labelid") {
      // Исключение: если явно передано "", ставим NULL
      if (set[field] === "") {
        fieldsToUpdate.push(`${field} = NULL`);
      } else {
        fieldsToUpdate.push(`${field} = ?`);
        values.push(set[field]);
      }
    } else {
      fieldsToUpdate.push(`${field} = COALESCE(?, ${field})`);
      values.push(set[field] ?? null);
    }
  }

  const sqlSetClause = fieldsToUpdate.join(", ");
  const query = `UPDATE expressions SET ${sqlSetClause} WHERE id = ?`;

  const res = await db_run(query, [...values, set.id]);
  return res;
};

export const activateExpressionFromQueue = async (user, expression) => {
  // Parsing the history of an expression from a JSON string into an object
  let history = [];
  try {
    history = expression.history ? JSON.parse(expression.history) : [];
  } catch {
    history = [];
  }

  // Adding the transfer record to the active ones
  history.push({
    action: "activated from queue",
    date: Date.now(),
  });

  // Creating an object to update the expression
  const updateData = {
    id: expression.id,
    status: "active",
    nextDate: new Date().getTime(),
    inQueue: 0,
    history, //passing the object, the UpdateExpression function serializes itself.
  };

  // Updating the expression
  await updateExpression(updateData);
};
