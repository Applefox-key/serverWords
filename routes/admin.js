import express from "express";
import md5 from "md5";
import { db_all, db_run } from "../helpers/dbAsync.js";
import { sendError, sendOk, sendResponse, sendResult } from "../helpers/responseHelpers.js";
import * as usr from "../modules/usersM.js";
import * as exp from "../modules/expressionsM.js";
import * as col from "../modules/collectionsM.js";
import * as common from "../modules/commonM.js";
import * as reset from "../modules/resetpasswordM.js";
import * as pbcol from "../modules/pbcollectionsM.js";
import * as con from "../modules/contentM.js";

const router = express.Router();

router.use((req, res, next) => {
  if (req.user?.role !== "admin") return sendError(res, "access denied", 403);
  next();
});

// ── GET all tables ────────────────────────────────────────────────────

router.get("/users", async (req, res) => {
  try { sendResponse(res, await usr.getAllUsers()); }
  catch (e) { sendError(res, e.message); }
});

router.get("/sessions", async (req, res) => {
  try { sendResponse(res, await db_all("SELECT * FROM sessions")); }
  catch (e) { sendError(res, e.message); }
});

router.get("/resettoken", async (req, res) => {
  try { sendResponse(res, await reset.getAllResetTokens()); }
  catch (e) { sendError(res, e.message); }
});

router.get("/categories", async (req, res) => {
  try { sendResponse(res, await db_all("SELECT * FROM categories")); }
  catch (e) { sendError(res, e.message); }
});

router.get("/labels", async (req, res) => {
  try { sendResponse(res, await db_all("SELECT * FROM labels")); }
  catch (e) { sendError(res, e.message); }
});

router.get("/expressions", async (req, res) => {
  try { sendResponse(res, await exp.getAllUsersExpressions()); }
  catch (e) { sendError(res, e.message); }
});

router.get("/collections", async (req, res) => {
  try { sendResponse(res, await col.getAllUsersCollections()); }
  catch (e) { sendError(res, e.message); }
});

router.get("/content", async (req, res) => {
  try { sendResponse(res, await common.getAllWithContentAdmin()); }
  catch (e) { sendError(res, e.message); }
});

router.get("/gamesresult", async (req, res) => {
  try { sendResponse(res, await db_all("SELECT * FROM gamesResult")); }
  catch (e) { sendError(res, e.message); }
});

router.get("/playlists", async (req, res) => {
  try { sendResponse(res, await db_all("SELECT * FROM playlists")); }
  catch (e) { sendError(res, e.message); }
});

router.get("/playlists-items", async (req, res) => {
  try { sendResponse(res, await db_all("SELECT * FROM playlistsItems")); }
  catch (e) { sendError(res, e.message); }
});

router.get("/entries", async (req, res) => {
  try { sendResponse(res, await db_all("SELECT * FROM entries")); }
  catch (e) { sendError(res, e.message); }
});

router.get("/entry-tags", async (req, res) => {
  try { sendResponse(res, await db_all("SELECT * FROM entry_tags")); }
  catch (e) { sendError(res, e.message); }
});

router.get("/entries-to-tags", async (req, res) => {
  try { sendResponse(res, await db_all("SELECT * FROM entries_to_tags")); }
  catch (e) { sendError(res, e.message); }
});

router.get("/collection-tags", async (req, res) => {
  try { sendResponse(res, await db_all("SELECT * FROM collection_tags")); }
  catch (e) { sendError(res, e.message); }
});

router.get("/collections-to-tags", async (req, res) => {
  try { sendResponse(res, await db_all("SELECT * FROM collections_to_tags")); }
  catch (e) { sendError(res, e.message); }
});

router.get("/daily-activity", async (req, res) => {
  try { sendResponse(res, await db_all("SELECT * FROM daily_activity ORDER BY date DESC")); }
  catch (e) { sendError(res, e.message); }
});

router.post("/daily-activity", async (req, res) => {
  try {
    const { user_id, date, entries_added = 0, reviews_count = 0 } = req.body.data;
    if (!user_id || !date) return sendError(res, "user_id and date are required");
    await db_run(
      `INSERT INTO daily_activity (user_id, date, entries_added, reviews_count) VALUES (?, ?, ?, ?)`,
      [parseInt(user_id), date, parseInt(entries_added), parseInt(reviews_count)]
    );
    sendOk(res, "created");
  } catch (e) { sendError(res, e.message); }
});

router.patch("/daily-activity", async (req, res) => {
  try {
    const { user_id, date, entries_added, reviews_count } = req.body.data;
    if (!user_id || !date) return sendError(res, "user_id and date are required");
    await db_run(
      `UPDATE daily_activity SET entries_added = ?, reviews_count = ? WHERE user_id = ? AND date = ?`,
      [parseInt(entries_added), parseInt(reviews_count), user_id, date]
    );
    sendOk(res, "updated");
  } catch (e) { sendError(res, e.message); }
});

router.delete("/daily-activity", async (req, res) => {
  try {
    const { user_id, date } = req.query;
    if (!user_id || !date) return sendError(res, "user_id and date are required");
    await db_run(`DELETE FROM daily_activity WHERE user_id = ? AND date = ?`, [parseInt(user_id), date]);
    sendOk(res, "deleted");
  } catch (e) { sendError(res, e.message); }
});

router.get("/pbcollections", async (req, res) => {
  try {
    const result = await pbcol.getAllWithCount();
    res.status(200).json(Array.isArray(result) ? { data: result } : result);
  } catch (e) { sendError(res, e.message); }
});

// ── Edit endpoints (only where they existed in original routes) ────────

// PATCH /admin/users/:id — update user fields (mirrors /users/byadmin)
router.patch("/users/:id", async (req, res) => {
  try {
    const userid = req.params.id;
    const data = {
      name: req.body.data.name,
      img: req.body.data.img,
      email: req.body.data.email,
      password: req.body.data.password ? md5(req.body.data.password) : null,
      settings: typeof req.body.data.settings === "string"
        ? JSON.parse(req.body.data.settings)
        : req.body.data.settings,
    };
    sendResult(res, await usr.updateUser(req.user, userid, data));
  } catch (e) { sendError(res, e.message); }
});

// DELETE /admin/users/:id — delete user (mirrors deleteUser logic)
router.delete("/users/:id", async (req, res) => {
  try {
    sendResult(res, await usr.deleteUser({ id: req.params.id }));
  } catch (e) { sendError(res, e.message); }
});

// DELETE /admin/resettoken — delete all expired/invalid tokens (mirrors /resetpassword DELETE /)
router.delete("/resettoken", async (req, res) => {
  try {
    await reset.deleteAllUnvalid();
    sendOk(res, "success");
  } catch (e) { sendError(res, e.message); }
});

// DELETE /admin/resettoken/:token — delete specific token (mirrors /resetpassword DELETE /:resetToken)
router.delete("/resettoken/:token", async (req, res) => {
  try {
    sendResult(res, await reset.deleteResetToken(req.params.token));
  } catch (e) { sendError(res, e.message); }
});

// DELETE /admin/content/:id — delete content item (mirrors /content DELETE /:id)
router.delete("/content/:id", async (req, res) => {
  try {
    const result = await con.deleteItem(req.params.id);
    res.status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (e) { sendError(res, e.message); }
});

export default router;
