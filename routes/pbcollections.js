import * as pbcol from "../models/pbcollectionsM.js";
import * as com from "../models/commonM.js";
import * as common from "../models/commonM.js";
import express from "express";
import bodyParser from "body-parser";
import { User } from "../classes/User.js";

const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//ONLY COLLECTIONS create new with content
router.post("/", async (req, res, next) => {
  let resp = await pbcol.createPbCollection({
    name: req.body.data.name,
    categoryid: req.body.data.categoryid,
    note: req.body.data.note,
  });
  if (resp.error) {
    res.status(400).json({ error: resp.error });
    return;
  }
  let list = req.body.data.content;
  if (!Array.isArray(list)) {
    res.status(400).json({ error: "content is not an Array" });
    return;
  }
  let err = "";
  list.forEach(async (element, i) => {
    let result = await pbcol.createPbContent(element, resp.id);
    //   if (result) {
    //     //res.status(400).json({ error: result.error });
    //     err = err + " " + result.error;
    //     return;
    //   }
    // });

    if (result.error) {
      res.status(400).json({ error: result.error });
      err = true;
      return;
    }
  });

  if (!err) res.status(200).json({ message: "success" });

  // res
  //   .status(result.error ? 400 : 200)
  //   .json(result.error ? { error: result.error } : { message: "success" });
});
//ONLY COLLECTIONS  all pbcollections
router.get("/", async (req, res, next) => {
  let list = await pbcol.getAll();
  res
    .status(!list ? 400 : 200)
    .json(!list ? { error: "session not found" } : { data: list });
});
//ONLY COLLECTIONS  all pbcollections shared by user
router.get("/user", async (req, res, next) => {
  let list = await pbcol.getAllByUser();
  res
    .status(!list ? 400 : 200)
    .json(!list ? { error: "session not found" } : { data: list });
});
router.delete("/user", async (req, res, next) => {
  let result = await pbcol.deleteCollAllByUser();
  res
    .status(result.error ? 400 : 200)
    .json(result.error ? { error: result.error } : { message: "success" });
});
//COLLECTIONS AND CONTENT all
router.get("/content", async (req, res, next) => {
  let list = await pbcol.getAllWithContent();
  if (!list) {
    res.status(400).json({ error: "session not found" });
    return;
  }
  let result = com.formatCollectionContent(list);
  res.status(200).json({ data: result });
});
router.delete("/:id", async (req, res, next) => {
  let result = await pbcol.deleteCollection(req.params.id);
  res
    .status(result.error ? 400 : 200)
    .json(result.error ? { error: result.error } : { message: "success" });
});

//COLLECTIONS AND CONTENT one collections with content by collection id
router.get("/:id/content", async (req, res, next) => {
  let result = await pbcol.getOneWithContent(req.params.id);
  if (!result) {
    res.status(400).json({ error: "bad request" });
    return;
  }
  let resArr = common.formatCollectionContent(result);
  res.status(200).json({ data: resArr });
});

export default router;
