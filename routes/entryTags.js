import * as tags from "../modules/entryTagsM.js";
import express from "express";
import { sendError, sendResponse, sendResult } from "../helpers/responseHelpers.js";

const router = express.Router();

// ── Tags CRUD ────────────────────────────────────────────────────────

// GET /entry-tags
// Returns all tags belonging to the current user
router.get("/", async (req, res) => {
  try {
    const list = await tags.getAll(req.user);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, error.message);
  }
});

// POST /entry-tags
// Body: { data: { name } }
// Creates a new tag
router.post("/", async (req, res) => {
  try {
    const { name } = req.body.data;
    if (!name || !name.trim()) return sendError(res, "name is required");

    const result = await tags.createTag(req.user, name.trim());
    if (!result || result.error) return sendError(res, result?.error || "error");

    res.status(200).json({ message: "success", id: result.id });
  } catch (error) {
    sendError(res, error.message);
  }
});

// PATCH /entry-tags/:id
// Body: { data: { name } }
// Renames a tag
router.patch("/:id", async (req, res) => {
  try {
    const { name } = req.body.data;
    if (!name || !name.trim()) return sendError(res, "name is required");

    const result = await tags.editTag(req.user, req.params.id, name.trim());
    sendResult(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});

// DELETE /entry-tags/:id
// Deletes a tag — links in entries_to_tags cascade automatically
router.delete("/:id", async (req, res) => {
  try {
    const result = await tags.deleteTag(req.user, req.params.id);
    sendResult(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});

// ── Tag ↔ Entry binding ───────────────────────────────────────────────

// GET /entry-tags/entry/:entryId
// Returns all tags attached to a specific entry
router.get("/entry/:entryId", async (req, res) => {
  try {
    const list = await tags.getByEntry(req.params.entryId);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, error.message);
  }
});

// PUT /entry-tags/entry/:entryId
// Body: { data: { tagIds: [1, 3, 5] } }
// Replaces all tags for an entry with the provided list
// Send empty array to remove all tags
router.put("/entry/:entryId", async (req, res) => {
  try {
    const tagIds = req.body.data?.tagIds ?? [];
    const result = await tags.setEntryTags(req.params.entryId, tagIds);
    sendResult(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});

export default router;
