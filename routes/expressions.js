import * as exp from "../models/expressionsM.js";
import * as usr from "../models/usersM.js";
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
  let result = await exp.updateExpression({ ...req.body.data });
  res
    .status(result.error ? 400 : 200)
    .json(result.error ? { error: result.error } : { message: "success" });
});

//create new one/list by token
router.post("/", async (req, res, next) => {
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
});

//user's list
router.get("/", async (req, res, next) => {
  let list = await exp.getList();
  res
    .status(!list ? 400 : 200)
    .json(!list ? { error: "session not found" } : { data: list });
});
//unread list by token
router.get("/unread", async (req, res, next) => {
  let list = await exp.getUnreadListByToken();
  res
    .status(!list ? 400 : 200)
    .json(!list ? { error: "session not found" } : { data: list });
});

//delete one/all by id
router.delete("/:id", async (req, res, next) => {
  const user = User.getInstance().user;

  let result = await exp.deleteExpression(req.params.id, user.id);
  res
    .status(result.error ? 400 : 200)
    .json(result.error ? { error: result.error } : { message: "success" });
});
export default router;
