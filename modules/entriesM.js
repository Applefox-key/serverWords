import { db_get, db_all, db_run } from "../helpers/dbAsync.js";
import { getTagsForEntries, getByEntry } from "./entryTagsM.js";
import { applyReview, easeToMastery } from "../helpers/spacedRepetition.js";
import fs from "fs";
import path from "path";

export const getAll = async (user) => {
  const rows = await db_all(`SELECT * FROM entries WHERE userid = ?`, [user.id]);
  if (!rows) return [];
  const tagsMap = await getTagsForEntries(user);
  return rows.map(row => ({
    ...row,
    tags: tagsMap[row.id] ?? [],
    mastery_level: easeToMastery(row.ease_factor ?? 2.5),
  }));
};

export const getOne = async (user, id) => {
  const row = await db_get(`SELECT * FROM entries WHERE id = ? AND userid = ?`, [id, user.id]);
  if (!row) return null;
  const tags = await getByEntry(id);
  return { ...row, tags, mastery_level: easeToMastery(row.ease_factor ?? 2.5) };
};

export const createEntry = async (user, data) => {
  return await new Promise((resolve, reject) => {
    const query = `INSERT INTO entries
      (word, explanation, example, category, rating, includeInPractice, createdAt, img, userid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
      data.word,
      data.explanation,
      data.example,
      data.category,
      data.rating ?? 0,
      data.includeInPractice ?? 0,
      new Date().toISOString(),
      data.img ?? null,
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
  if (data.rating !== undefined) {
    fields.push("rating = ?");
    params.push(data.rating);
  }
  if (data.includeInPractice !== undefined) {
    fields.push("includeInPractice = ?");
    params.push(data.includeInPractice);
  }
  if (data.img !== undefined) {
    fields.push("img = ?");
    params.push(data.img);
  }
  if (data.ease_factor !== undefined) {
    fields.push("ease_factor = ?");
    params.push(data.ease_factor);
  }
  if (data.interval_days !== undefined) {
    fields.push("interval_days = ?");
    params.push(data.interval_days);
  }
  if (data.repetitions !== undefined) {
    fields.push("repetitions = ?");
    params.push(data.repetitions);
  }
  if (data.next_review_at !== undefined) {
    fields.push("next_review_at = ?");
    params.push(data.next_review_at);
  }
  if (data.last_reviewed_at !== undefined) {
    fields.push("last_reviewed_at = ?");
    params.push(data.last_reviewed_at);
  }

  if (fields.length === 0) return { error: "no fields to update" };

  params.push(id, user.id);
  return await db_run(`UPDATE entries SET ${fields.join(", ")} WHERE id = ? AND userid = ?`, params);
};

export const deleteEntry = async (user, id) => {
  return await db_run(`DELETE FROM entries WHERE id = ? AND userid = ?`, [id, user.id]);
};

export const getDue = async (user) => {
  const now = new Date().toISOString();
  const rows = await db_all(
    `SELECT * FROM entries WHERE userid = ? AND next_review_at IS NOT NULL AND next_review_at <= ? ORDER BY next_review_at ASC`,
    [user.id, now]
  );
  if (!rows || rows.length === 0) return [];
  const tagsMap = await getTagsForEntries(user);
  return rows.map(row => ({
    ...row,
    tags: tagsMap[row.id] ?? [],
    mastery_level: easeToMastery(row.ease_factor ?? 2.5),
  }));
};

export const reviewEntry = async (user, id, grade, mode) => {
  const entry = await getOne(user, id);
  if (!entry) return { error: "not found" };

  const srFields = applyReview(entry, grade, mode);
  return await updateEntry(user, id, srFields);
};

export const deleteEntryImg = (userId, filename) => {
  const filePath = path.join(".", "content", userId.toString(), "entries", filename);
  fs.unlink(filePath, (err) => {
    if (err) console.error("deleteEntryImg error:", err.message);
  });
};
