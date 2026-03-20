import { db_get, db_all, db_run } from "../helpers/dbAsync.js";

export const getAll = async (user) => {
  return await db_all(`SELECT * FROM entries WHERE userid = ?`, [user.id]);
};

export const getOne = async (user, id) => {
  return await db_get(`SELECT * FROM entries WHERE id = ? AND userid = ?`, [id, user.id]);
};

export const createEntry = async (user, data) => {
  return await new Promise((resolve, reject) => {
    const query = `INSERT INTO entries 
      (word, explanation, example, category, tags, rating, includeInPractice, createdAt, userid) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      data.word,
      data.explanation,
      data.example,
      data.category,
      data.tags,
      data.rating ?? 0,
      data.includeInPractice ?? 0,
      new Date().toISOString(),
      user.id,
    ];
    import("../database.js").then(({ default: db }) => {
      db.run(query, params, function (err) {
        if (err) return reject({ error: err.message });
        resolve({ id: this.lastID });
      });
    });
  });
};

export const updateEntry = async (user, id, data) => {
  const fields = [];
  const params = [];

  if (data.word !== undefined) {
    fields.push("word = ?");
    params.push(data.word);
  }
  if (data.explanation !== undefined) {
    fields.push("explanation = ?");
    params.push(data.explanation);
  }
  if (data.example !== undefined) {
    fields.push("example = ?");
    params.push(data.example);
  }
  if (data.category !== undefined) {
    fields.push("category = ?");
    params.push(data.category);
  }
  if (data.tags !== undefined) {
    fields.push("tags = ?");
    params.push(data.tags);
  }
  if (data.rating !== undefined) {
    fields.push("rating = ?");
    params.push(data.rating);
  }
  if (data.includeInPractice !== undefined) {
    fields.push("includeInPractice = ?");
    params.push(data.includeInPractice);
  }

  if (fields.length === 0) return { error: "no fields to update" };

  params.push(id, user.id);
  return await db_run(`UPDATE entries SET ${fields.join(", ")} WHERE id = ? AND userid = ?`, params);
};

export const deleteEntry = async (user, id) => {
  return await db_run(`DELETE FROM entries WHERE id = ? AND userid = ?`, [id, user.id]);
};
