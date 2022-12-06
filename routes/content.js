import * as con from "../models/contentM.js";
import * as common from "../models/commonM.js";
import express from "express";
import bodyParser from "body-parser";
import { User } from "../classes/User.js";
import querystring from "querystring";

const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Get user's all collections with content
router.get("/", async (req, res, next) => {
  try {
    let result = await common.getAllWithContent(req.query);
    let resArr = common.formatCollectionContent(result);
    res.status(200).json({ data: resArr });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Edit content by content date with id
router.patch("/", async (req, res, next) => {
  try {
    let result = await con.editContent({ ...req.body.data });
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//Get one pub content item  by id
router.get("pub/:id", async (req, res, next) => {
  try {
    let result = await con.getOnePbContentItem(req.params.id);
    if (!result) {
      res.status(400).json({ error: "bad request" });
      return;
    }
    res.status(200).json({ data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//Get one content item  by id
router.get("/:id", async (req, res, next) => {
  try {
    let result = await con.getOneContentItem(req.params.id);
    if (!result) {
      res.status(400).json({ error: "bad request" });
      return;
    }
    res.status(200).json({ data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
  }
});

export default router;
