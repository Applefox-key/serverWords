import { DateTime } from "luxon";
import { activateExpressionFromQueue } from "../modules/expressionsM.js";
import { updateUserField } from "../modules/usersM.js";
import { db_all } from "./dbAsync.js";

export async function runDailyQueueUpdate(user) {
  if (!user) return;
  let settings;
  try {
    settings = user.settings ? (typeof user.settings === "object" ? user.settings : JSON.parse(user.settings)) : {};
  } catch {
    return;
  }
  const limit = settings.dailyQueueLimit || 0;

  if (!limit) return;
  // return;
  const now = DateTime.utc();

  let lastUpdate = null;

  if (settings.lastQueueUpdate) {
    lastUpdate = DateTime.fromISO(settings.lastQueueUpdate, { zone: "utc" });
    const hoursSince = now.diff(lastUpdate, "hours").hours;
    if (hoursSince < 24) return; // 24 hours have not passed — we are leaving
  }
  // 1.get first N items by id, which inQueue = 1
  const expressions = await db_all(
    `SELECT * FROM expressions WHERE userid = ? AND inQueue = 1 ORDER BY id ASC LIMIT ?`,
    [user.id, limit],
  );

  for (const expr of expressions) {
    await activateExpressionFromQueue(user, expr);
  }

  settings.lastQueueUpdate = now.toISO();
  await updateUserField(user.id, "settings", JSON.stringify(settings));
}
