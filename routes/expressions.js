import * as exp from "../modules/expressionsM.js";
import express from "express";
import bodyParser from "body-parser";
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

//UPDATE expression
router.patch("/", async (req, res, next) => {
  try {
    let result = await exp.updateExpression({ ...req.body.data });
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    sendError(res, error.message);
  }
});

//create new one/list by token
router.post("/", async (req, res, next) => {
  try {
    if (!req.body.data || !req.body.data.hasOwnProperty("list")) {
      return sendError(res, "data should have property LIST");
    }
    if (!Array.isArray(req.body.data.list)) {
      sendError(res, "data.list is not an ARRAY");
    }

    for (const element of req.body.data.list) {
      const result = await exp.createExpression(req.user, { ...element });
      if (result.error) {
        sendError(res, result.error);
      }
    }
    sendOk(res, "success");
  } catch (error) {
    sendError(res, error.message);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    let result = await exp.deleteAllExpressions(req.user);
    sendResult(req, result);
  } catch (error) {
    sendError(res, error.message);
  }
});
//all by userid and ids array
router.delete("/some", async (req, res, next) => {
  try {
    let list = req.body.data.list;
    let result = await exp.deleteSomeExpressions(req.user, list);
    sendResult(req, result);
  } catch (error) {
    sendError(res, error.message);
  }
});
//user's list
router.get("/", async (req, res, next) => {
  const filter = req.query.filter ? `%${req.query.filter}%` : "";
  const labelid = req.query.labelid ? req.query.labelid : "";
  const stage = req.query.stage || "";
  const status = req.query.status || "";

  const inQueue =
    req.query.inQueue === "true"
      ? true
      : req.query.inQueue === "false"
      ? false
      : "";

  try {
    let list = await exp.getList(
      req.user,
      filter,
      labelid,
      stage,
      status,
      inQueue
    );

    sendResponse(res, list, "session not found");
  } catch (error) {
    sendError(res, error.message);
  }
});
//user's list by folders
router.get("/byfolders", async (req, res, next) => {
  const filter = req.query.filter ? `%${req.query.filter}%` : "";
  const labelid = req.query.labelid || "";
  const stage = req.query.hasOwnProperty("stage") ? req.query.stage : "";
  const inQueue =
    req.query.inQueue === "true"
      ? true
      : req.query.inQueue === "false"
      ? false
      : "";
  const status = req.query.status || "";

  try {
    let list = await exp.getListByFolders(
      req.user,
      filter,
      labelid,
      stage,
      status,
      inQueue
    );
    sendResponse(res, list, "session not found");
  } catch (error) {
    sendError(res, error.message);
  }
});

router.patch("/onefield", async (req, res, next) => {
  try {
    const { list, field, fieldValue } = req.body.data;

    if (!Array.isArray(list))
      return sendError(res, "expressions is not an Array");

    //
    const results = await Promise.all(
      list.map((id) => exp.updateExpression({ id, [field]: fieldValue }))
    );

    const failed = results.find((r) => r?.error);
    if (failed) return sendError(res, failed.error);

    return sendOk(res, "success");
  } catch (error) {
    return sendError(res, error.message);
  }
});

//UPDATE expression arr
router.patch("/batch", async (req, res) => {
  try {
    const dataList = req.body.data;
    if (!Array.isArray(dataList)) {
      sendError(res, "data must be an array");
    }

    for (const item of dataList) {
      const result = await exp.updateExpression(item);
      if (result?.error) return sendError(res, result.error);
    }
    sendOk(res, "success");
  } catch (error) {
    sendError(res, error.message);
  }
});
//user's list with pagination
router.get("/page/:page", async (req, res, next) => {
  const page = req.query.page;
  const limit = req.query.limit;
  const filter = req.query.filter ? `%${req.query.filter}%` : "";
  const labelid = req.query.labelid ? req.query.labelid : "";
  const stage = req.query.hasOwnProperty("stage") ? req.query.stage : "";
  try {
    let list = await exp.getListPage(
      req.user,
      limit,
      (page - 1) * limit,
      filter,
      labelid,
      stage
    );
    sendResponse(res, list, "session not found");
  } catch (error) {
    sendError(res, error.message);
  }
});
//unread list by token
router.get("/unread", async (req, res, next) => {
  const labelid = req.query.labelid ? req.query.labelid : "";
  try {
    let list = await exp.getUnreadListByToken(
      req.user,
      req.query.offset_ms,
      labelid
    );
    sendResponse(res, list, "session not found");
  } catch (error) {
    sendError(res, error.message);
  }
});

//all by admin token
router.get("/all", async (req, res, next) => {
  try {
    let user = req.user;
    if (user.role !== "admin") {
      sendError(res, "access denied");
    }
    let list = await exp.getAllUsersExpressions();
    sendResponse(res, list, "session not found");
  } catch (error) {
    sendError(res, error.message);
  }
});
//delete one/all by id
router.delete("/:id", async (req, res, next) => {
  try {
    let result = await exp.deleteExpression(req.user, req.params.id);
    sendResult(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});
export default router;
