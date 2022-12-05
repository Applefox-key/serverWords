import * as categ from "../models/categoriesM.js";
import * as common from "../models/commonM.js";
import express from "express";
import bodyParser from "body-parser";
import { User } from "../classes/User.js";

const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//all by admin token
router.get("/public/all", async (req, res, next) => {
  try {
    let user = User.getInstance().user;
    if (user.role !== "admin") {
      res.status(400).json({ error: "access denied" });
    }
    let list = await categ.getAllCategories(true);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "categiries not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//all by admin token
router.get("/users/all", async (req, res, next) => {
  try {
    let user = User.getInstance().user;
    if (user.role !== "admin") {
      res.status(400).json({ error: "access denied" });
    }
    let list = await categ.getAllCategories();
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//get all
router.get("/user", async (req, res, next) => {
  try {
    let list = await categ.getCategoryAll();
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "categories not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//create users category
router.post("/user", async (req, res, next) => {
  try {
    let result = await categ.createUserCategory(req.body.data.name);
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//get all
router.get("/public", async (req, res, next) => {
  try {
    let list = await categ.getCategoryAll(true);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "categories not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//create public category
router.post("/public", async (req, res, next) => {
  try {
    let result = await categ.createPbCategory(req.body.data.name);

    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//get categories collections with content by it's id
router.get("/:id/collections", async (req, res, next) => {
  try {
    let result = await common.getAllWithContentByCategory(req.params.id);
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
//update users category
router.patch("/:id", async (req, res, next) => {
  try {
    let result = await categ.editCategory(req.body.data.name, req.params.id);
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// delete  category by id
router.delete("/:id", async (req, res, next) => {
  try {
    let result = await categ.deleteCategory(req.params.id);
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// delete categories by user id
router.delete("/", async (req, res, next) => {
  try {
    let result = await categ.deleteUsersAllCategory();
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
export default router;
