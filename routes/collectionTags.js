import * as tags from "../modules/collectionTagsM.js";
import express from "express";
import { sendError, sendOk, sendResponse, sendResult } from "../helpers/responseHelpers.js";

const router = express.Router();

// ── Tags CRUD ────────────────────────────────────────────────────────

// GET /collection-tags
// Returns all tags belonging to the current user
router.get("/", async (req, res) => {
  try {
    const list = await tags.getAll(req.user);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, error.message);
  }
});

// POST /collection-tags
// Body: { data: { name } }
// Creates a new tag and returns it
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

// PATCH /collection-tags/:id
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

// DELETE /collection-tags/:id
// Deletes a tag — links in collections_to_tags cascade automatically
router.delete("/:id", async (req, res) => {
  try {
    const result = await tags.deleteTag(req.user, req.params.id);
    sendResult(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});

// ── Tag ↔ Collection binding ─────────────────────────────────────────

// GET /collection-tags/collection/:collectionId
// Returns all tags attached to a specific collection
router.get("/collection/:collectionId", async (req, res) => {
  try {
    const list = await tags.getByCollection(req.params.collectionId);
    sendResponse(res, list);
  } catch (error) {
    sendError(res, error.message);
  }
});

// PUT /collection-tags/collection/:collectionId
// Body: { data: { tagIds: [1, 3, 5] } }
// Replaces all tags for a collection with the provided list
// Send empty array to remove all tags
router.put("/collection/:collectionId", async (req, res) => {
  try {
    const tagIds = req.body.data?.tagIds ?? [];
    const result = await tags.setCollectionTags(req.params.collectionId, tagIds);
    sendResult(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});

export default router;
