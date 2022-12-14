import * as exp from "../modules/expressionsM.js";
import * as usr from "../modules/usersM.js";
import * as validator from "../helpers/validator.js";
import express from "express";
import db from "../database.js";
import bodyParser from "body-parser";
import md5 from "md5";
import { User } from "../classes/User.js";

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
    res.status(400).json({ error: error.message });
  }
});

//create new one/list by token
router.post("/", async (req, res, next) => {
  try {
    if (!req.body.data.hasOwnProperty("list")) {
      res.status(400).json({ error: "datas should has property LIST" });
      return;
    }
    if (!Array.isArray(req.body.data.list)) {
      res.status(400).json({ error: "datas type is not ARRAY" });
      return;
    }
    let err = false;
    req.body.data.list.forEach(async (element, i) => {
      let result = await exp.createExpression({ ...element });
      if (result.error) {
        res.status(400).json({ error: result.error });
        err = true;
        return;
      }
    });
    if (!err) res.status(200).json({ message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//all by userid
router.delete("/", async (req, res, next) => {
  try {
    let result = await exp.deleteAllExpressions();
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//user's list
router.get("/", async (req, res, next) => {
  try {
    let list = await exp.getList();
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//unread list by token
router.get("/unread", async (req, res, next) => {
  try {
    let list = await exp.getUnreadListByToken(req.query.offset_ms);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//all by admin token
router.get("/all", async (req, res, next) => {
  try {
    let user = User.getInstance().user;
    if (user.role !== "admin") {
      res.status(400).json({ error: "access denied" });
    }
    let list = await exp.getAllUsersExpressions();
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//delete one/all by id
router.delete("/:id", async (req, res, next) => {
  try {
    let result = await exp.deleteExpression(req.params.id);
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
export default router;
