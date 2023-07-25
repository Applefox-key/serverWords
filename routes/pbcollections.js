import * as pbcol from "../modules/pbcollectionsM.js";
import * as com from "../modules/commonM.js";
import * as common from "../modules/commonM.js";
import express from "express";
import bodyParser from "body-parser";
import { User } from "../classes/User.js";

const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//ONLY COLLECTIONS  all pbcollections
router.get("/", async (req, res, next) => {
  try {
    let list = await pbcol.getAll();
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//COLLECTIONS AND CONTENT all
router.get("/content", async (req, res, next) => {
  try {
    let list = await pbcol.getAllWithContent();
    if (!list) {
      res.status(400).json({ error: "session not found" });
      return;
    }

    let result = com.formatCollectionContent(list, true);
    res.status(200).json({ data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//COLLECTIONS AND CONTENT all
router.get("/count", async (req, res, next) => {
  try {
    let list = await pbcol.getAllWithCount();
    if (!list) {
      res.status(400).json({ error: "session not found" });
      return;
    }

    let result = list; // com.formatCollectionContent(list);
    res.status(200).json({ data: result });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//COLLECTIONS AND CONTENT one collections with content by collection id
router.get("/:id/content", async (req, res, next) => {
  try {
    let result = await pbcol.getOneWithContent(req.params.id);
    if (!result) {
      res.status(400).json({ error: "bad request" });
      return;
    }
    let resArr = common.formatCollectionContent(result);
    res.status(200).json({ data: resArr });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
