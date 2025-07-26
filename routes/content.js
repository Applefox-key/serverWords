import * as con from "../modules/contentM.js";
import * as common from "../modules/commonM.js";
import express from "express";
import bodyParser from "body-parser";

import { upload } from "../helpers/multer.js";
import { logResult } from "../helpers/resultLog.js";
import { formatCollectionContent } from "../helpers/collectionsService.js";
import {
  sendError,
  sendOk,
  sendResponse,
  sendResult,
} from "../helpers/responseHelpers.js";

const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Get user's all collections with content
router.get("/", async (req, res, next) => {
  try {
    let result = await common.getAllWithContent(req.user, req.query);
    let resArr = formatCollectionContent(req.user, result);
    sendResponse(res, resArr);
  } catch (error) {
    sendError(res, error.message);
  }
});

//Edit content by content data with id
router.patch(
  "/",
  upload.fields([{ name: "imgAfile" }, { name: "imgQfile" }]),
  async (req, res, next) => {
    try {
      s;
      let result = await con.editContent(
        req.user,
        { ...req.body.data },
        req.files
      );
      logResult(result);
      sendResult(res, result);
    } catch (error) {
      sendError(res, error.message);
    }
  }
);
router.post("/move", async (req, res, next) => {
  try {
    const { contentIds, newCollectionId } = req.body.data;

    if (!contentIds || !newCollectionId)
      return sendError(res, "Invalid input data");

    await con.moveContentToNewCollection(req.user, contentIds, newCollectionId);

    sendOk(res, "Content moved successfully");
  } catch (error) {
    sendError(res, error.message);
  }
});
//Get one pub content item  by id
router.get("/pub/:id", async (req, res, next) => {
  try {
    let result = await con.getOnePbContentItem(req.params.id);

    if (!result) {
      sendError(res, "bad request");
      return;
    }
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});
//Get one content item  by id
router.get("/:id", async (req, res, next) => {
  try {
    let result = await con.getOneContentItem(req.params.id);
    if (!result) {
      sendError(res, "bad request");
      return;
    }
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});

//delete one item by id
router.delete("/:id", async (req, res, next) => {
  try {
    let result = await con.deleteItem(req.params.id);
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    sendError(res, error.message);
  }
});

export default router;
