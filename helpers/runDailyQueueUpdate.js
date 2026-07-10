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
  const phrases = settings.phrases ?? {};
  const limit = phrases.dailyQueueLimit || 0;

  if (!limit) return;
  const now = DateTime.utc();

  if (phrases.lastQueueUpdate) {
    const lastUpdate = DateTime.fromISO(phrases.lastQueueUpdate, { zone: "utc" });
    const hoursSince = now.diff(lastUpdate, "hours").hours;
    if (hoursSince < 24) return;
  }

  const expressions = await db_all(
    `SELECT * FROM expressions WHERE userid = ? AND inQueue = 1 ORDER BY id ASC LIMIT ?`,
    [user.id, limit],
  );

  for (const expr of expressions) {
    await activateExpressionFromQueue(user, expr);
  }

  settings.phrases = { ...phrases, lastQueueUpdate: now.toISO() };
  await updateUserField(user.id, "settings", JSON.stringify(settings));
}
