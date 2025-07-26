import * as pbcol from "../modules/pbcollectionsM.js";
import * as com from "../modules/commonM.js";
import * as common from "../modules/commonM.js";
import express from "express";
import bodyParser from "body-parser";
import { formatCollectionContent } from "../helpers/collectionsService.js";
import { sendError, sendResponse } from "../helpers/responseHelpers.js";
const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//ONLY COLLECTIONS  all pbcollections
router.get("/", async (req, res, next) => {
  try {
    let list = await pbcol.getAll(req.user);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    sendError(res, error.message);
  }
});

//COLLECTIONS AND CONTENT all
router.get("/content", async (req, res, next) => {
  try {
    let list = await pbcol.getAllWithContent();
    if (!list) return sendError(res, "session not found");

    let result = formatCollectionContent(req.user, list, true);
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});
//COLLECTIONS AND CONTENT all
router.get("/count", async (req, res, next) => {
  try {
    let list = await pbcol.getAllWithCount();
    if (!list) return sendError(res, "session not found");

    sendResponse(res, list);
  } catch (error) {
    sendError(res, error.message);
  }
});
//COLLECTIONS AND CONTENT one collections with content by collection id
router.get("/:id/content", async (req, res, next) => {
  try {
    let result = await pbcol.getOneWithContent(req.params.id);
    if (!result) return sendError(res, "bad request");
    let resArr = formatCollectionContent(req.user, result);
    sendResponse(res, resArr);
  } catch (error) {
    sendError(res, error.message);
  }
});

export default router;
