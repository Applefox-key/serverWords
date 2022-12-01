import * as categ from "../models/categoriesM.js";
import * as common from "../models/commonM.js";
import express from "express";
import bodyParser from "body-parser";

const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//get all
router.get("/user", async (req, res, next) => {
  let list = await categ.getCategoryAll();
  res
    .status(!list ? 400 : 200)
    .json(!list ? { error: "categories not found" } : { data: list });
});
//create users category
router.post("/user", async (req, res, next) => {
  let result = await categ.createUserCategory(req.body.data.name);
  res
    .status(result.error ? 400 : 200)
    .json(result.error ? { error: result.error } : { message: "success" });
});
//get all
router.get("/public", async (req, res, next) => {
  let list = await categ.getCategoryAll(true);
  res
    .status(!list ? 400 : 200)
    .json(!list ? { error: "categories not found" } : { data: list });
});
//create public category
router.post("/public", async (req, res, next) => {
  let result = await categ.createPbCategory(req.body.data.name);

  res
    .status(result.error ? 400 : 200)
    .json(result.error ? { error: result.error } : { message: "success" });
});
//get categories collections with content by it's id
router.get("/:id/collections", async (req, res, next) => {
  let result = await common.getAllWithContentByCategory(req.params.id);
  if (!result) {
    res.status(400).json({ error: "bad request" });
    return;
  }
  let resArr = common.formatCollectionContent(result);
  res.status(200).json({ data: resArr });
});
//update users category
router.patch("/:id", async (req, res, next) => {
  let result = await categ.editCategory(req.body.data.name, req.params.id);
  res
    .status(result.error ? 400 : 200)
    .json(result.error ? { error: result.error } : { message: "success" });
});
// delete  category by id
router.delete("/:id", async (req, res, next) => {
  let result = await categ.deleteCategory(req.params.id);
  res
    .status(result.error ? 400 : 200)
    .json(result.error ? { error: result.error } : { message: "success" });
});
// delete categories by user id
router.delete("/", async (req, res, next) => {
  let result = await categ.deleteUsersAllCategory();
  res
    .status(result.error ? 400 : 200)
    .json(result.error ? { error: result.error } : { message: "success" });
});
export default router;
