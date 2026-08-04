import { db_get, db_all, db_run } from "../helpers/dbAsync.js";
import { getTagsForEntries, getByEntry } from "./entryTagsM.js";
import { applyReview, easeToMastery } from "../helpers/spacedRepetition.js";
import fs from "fs";
import path from "path";

function localDate(tz = 0) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + tz);
  return d.toISOString().slice(0, 10);
}

async function upsertDailyActivity(userId, entriesDelta, reviewsDelta, tz = 0) {
  const today = localDate(tz);
  await db_run(
    `INSERT INTO daily_activity (user_id, date, entries_added, reviews_count)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, date) DO UPDATE SET
       entries_added = MAX(0, daily_activity.entries_added + excluded.entries_added),
       reviews_count = MAX(0, daily_activity.reviews_count + excluded.reviews_count)`,
    [userId, today, entriesDelta, reviewsDelta],
  );
}

export const getAll = async (user) => {
  const rows = await db_all(`SELECT * FROM entries WHERE userid = ?`, [user.id]);
  if (!rows) return [];
  const tagsMap = await getTagsForEntries(user);
  return rows.map(row => ({
    ...row,
    tags: tagsMap[row.id] ?? [],
    mastery_level: easeToMastery(row.ease_factor ?? 2.5, row.repetitions ?? 0),
  }));
};

export const getOne = async (user, id) => {
  const row = await db_get(`SELECT * FROM entries WHERE id = ? AND userid = ?`, [id, user.id]);
  if (!row) return null;
  const tags = await getByEntry(id);
  return { ...row, tags, mastery_level: easeToMastery(row.ease_factor ?? 2.5, row.repetitions ?? 0) };
};

export const createEntry = async (user, data, tz = 0) => {
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
        const id = this.lastID;
        upsertDailyActivity(user.id, 1, 0, tz).catch(() => {});
        resolve({ id });
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
    `SELECT * FROM entries WHERE userid = ? AND includeInPractice = 1 AND (
      next_review_at IS NULL OR next_review_at <= ?
    ) ORDER BY next_review_at ASC NULLS LAST`,
    [user.id, now]
  );
  if (!rows || rows.length === 0) return [];
  const tagsMap = await getTagsForEntries(user);
  return rows.map(row => ({
    ...row,
    tags: tagsMap[row.id] ?? [],
    mastery_level: easeToMastery(row.ease_factor ?? 2.5, row.repetitions ?? 0),
  }));
};

export const reviewEntry = async (user, id, grade, mode, isDue = false, tz = 0) => {
  const entry = await getOne(user, id);
  if (!entry) return { error: "not found" };

  const today = localDate(tz);
  const isFirstReviewToday = entry.last_reviewed_at?.slice(0, 10) !== today;

  const srFields = applyReview(entry, grade, mode, isDue);
  if (srFields === null) return { skipped: true };

  const result = await updateEntry(user, id, srFields);
  if (isFirstReviewToday) upsertDailyActivity(user.id, 0, 1, tz).catch(() => {});
  return result;
};

export const createEntryBatch = async (user, entriesData, tagIds, tz = 0) => {
  const now = new Date().toISOString();
  const placeholders = entriesData.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
  const values = entriesData.flatMap((d) => [
    d.word,
    d.explanation ?? "",
    d.example ?? "",
    d.category ?? "word",
    d.rating ?? 1,
    d.includeInPractice ?? 1,
    now,
    null,
    user.id,
  ]);

  const rows = await db_all(
    `INSERT INTO entries (word, explanation, example, category, rating, includeInPractice, createdAt, img, userid) VALUES ${placeholders} RETURNING id`,
    values,
  );

  if (!rows || rows.error) return { error: rows?.error || "insert failed" };

  const ids = rows.map((r) => r.id);
  upsertDailyActivity(user.id, ids.length, 0, tz).catch(() => {});

  if (tagIds && tagIds.length > 0 && ids.length > 0) {
    const tagRows = ids.flatMap((entryId) => tagIds.map((tagId) => [entryId, tagId]));
    const tagPlaceholders = tagRows.map(() => "(?, ?)").join(", ");
    await db_run(`INSERT INTO entries_to_tags (entryid, tagid) VALUES ${tagPlaceholders}`, tagRows.flat());
  }

  return { count: ids.length, ids };
};

export const decrementEntriesAdded = async (userId, tz = 0) => {
  const today = localDate(tz);
  return db_run(
    `UPDATE daily_activity SET entries_added = MAX(0, entries_added - 1)
     WHERE user_id = ? AND date = ?`,
    [userId, today],
  );
};

export const getWeeklyStats = async (user, tz = 0) => {
  const tzStr = `${tz >= 0 ? "+" : ""}${tz} minutes`;

  // Generate 7 local dates (oldest → newest)
  const localToday = localDate(tz);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(localToday + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const placeholders = days.map(() => "?").join(",");

  // entries_added: calculate from entries table with tz adjustment (always accurate)
  const entryRows = await db_all(
    `SELECT DATE(datetime(createdAt, ?)) as date, COUNT(*) as entries_added
     FROM entries WHERE userid = ? AND DATE(datetime(createdAt, ?)) IN (${placeholders})
     GROUP BY date`,
    [tzStr, user.id, tzStr, ...days],
  );

  // reviews_count: from daily_activity (local dates going forward)
  const reviewRows = await db_all(
    `SELECT date, reviews_count FROM daily_activity
     WHERE user_id = ? AND date IN (${placeholders})`,
    [user.id, ...days],
  );

  const entriesMap = Object.fromEntries((entryRows ?? []).map((r) => [r.date, r.entries_added]));
  const reviewsMap = Object.fromEntries((reviewRows ?? []).map((r) => [r.date, r.reviews_count]));

  return days.map((date) => ({
    date,
    entries_added: entriesMap[date] ?? 0,
    reviews_count: reviewsMap[date] ?? 0,
  }));
};

export const deleteEntryImg = (userId, filename) => {
  const filePath = path.join(".", "content", userId.toString(), "entries", filename);
  fs.unlink(filePath, (err) => {
    if (err) console.error("deleteEntryImg error:", err.message);
  });
};
