import * as entries from "../modules/entriesM.js";
import express from "express";
import { sendError, sendResponse } from "../helpers/responseHelpers.js";
import { uploadEntryImg } from "../helpers/multer.js";

const router = express.Router();

// Get all entries for current user
router.get("/", async (req, res) => {
  try {
    const list = await entries.getAll(req.user);
    res.status(!list ? 400 : 200).json(!list ? { error: "not found" } : list);
  } catch (error) {
    sendError(res, error.message);
  }
});

// Get one entry by id
router.get("/:id", async (req, res) => {
  try {
    const item = await entries.getOne(req.user, req.params.id);
    if (!item) return sendError(res, "not found");
    res.status(200).json(item);
  } catch (error) {
    sendError(res, error.message);
  }
});

// Create new entry
router.post("/", uploadEntryImg.single("imgfile"), async (req, res) => {
  try {
    const data = JSON.parse(req.body.data);
    if (req.file) data.img = req.file.filename;
    const result = await entries.createEntry(req.user, data);
    if (result.error) return sendError(res, result.error);

    // return the created entry
    const item = await entries.getOne(req.user, result.id);
    res.status(200).json(item);
  } catch (error) {
    sendError(res, error.message);
  }
});

// Update entry by id
router.patch("/:id", uploadEntryImg.single("imgfile"), async (req, res) => {
  try {
    const data = req.is("multipart/form-data")
      ? JSON.parse(req.body.data)
      : req.body.data;

    if (req.file) {
      data.img = req.file.filename;
    } else if (data.img === null || data.img === "") {
      const current = await entries.getOne(req.user, req.params.id);
      if (current?.img) entries.deleteEntryImg(req.user.id, current.img);
      data.img = null;
    }

    const result = await entries.updateEntry(req.user, req.params.id, data);
    if (result.error) return sendError(res, result.error);

    // return the updated entry
    const item = await entries.getOne(req.user, req.params.id);
    res.status(200).json(item);
  } catch (error) {
    sendError(res, error.message);
  }
});

// Delete entry by id
router.delete("/:id", async (req, res) => {
  try {
    const current = await entries.getOne(req.user, req.params.id);
    if (current?.img) entries.deleteEntryImg(req.user.id, current.img);

    const result = await entries.deleteEntry(req.user, req.params.id);
    res.status(result.error ? 400 : 200).json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    sendError(res, error.message);
  }
});

export default router;
