import * as categ from "../modules/categoriesM.js";
import * as common from "../modules/commonM.js";
import express from "express";
import bodyParser from "body-parser";
import { formatCollectionContent } from "../helpers/collectionsService.js";
import {
  sendError,
  sendResponse,
  sendResult,
} from "../helpers/responseHelpers.js";

const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//all by admin token
router.get("/public/all", async (req, res, next) => {
  try {
    let user = req.user;
    if (user.role !== "admin") {
      sendError(res, "access denied");
    }
    let list = await categ.getAllCategories(true);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "categiries not found" } : { data: list });
  } catch (error) {
    sendError(res, error.message);
  }
});
//all by admin token
router.get("/users/all", async (req, res, next) => {
  try {
    let user = req.user;
    if (user.role !== "admin") {
      sendError(res, "access denied");
    }
    let list = await categ.getAllCategories();
    sendResponse(res, list, "session not found");
  } catch (error) {
    sendError(res, error.message);
  }
});
//get all
router.get("/user", async (req, res, next) => {
  try {
    let list = await categ.getCategoryAll(req.user);
    sendResponse(res, list, "categories not found");
  } catch (error) {
    sendError(res, error.message);
  }
});

//get all with collections
router.get("/user/collections", async (req, res, next) => {
  try {
    let list = await categ.getCategoryWithCollections(req.user);
    let resArr = categ.formatCategoriesCollection(list);
    sendResponse(res, resArr, "categories not found");
  } catch (error) {
    sendError(res, error.message);
  }
}); //get all with collections
router.get("/public/collections", async (req, res, next) => {
  try {
    let list = await categ.getCategoryWithCollections(req.user, true);
    let resArr = categ.formatCategoriesCollection(list, true);
    sendResponse(res, resArr, "categories not found");
  } catch (error) {
    sendError(res, error.message);
  }
});
//create users category
router.post("/user", async (req, res, next) => {
  try {
    let result = await categ.createUserCategory(req.user, req.body.data.name);
    sendResult(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});
//get all
router.get("/public", async (req, res, next) => {
  try {
    let list = await categ.getPubCategoryAll();
    sendResponse(res, list, "categories not found");
  } catch (error) {
    sendError(res, error.message);
  }
});

//get categories collections with content by it's id
router.get("/:id/collections", async (req, res, next) => {
  try {
    let result = await common.getAllWithContentByCategory(req.params.id);
    if (!result) return sendError(res, "bad request");

    let resArr = formatCollectionContent(req.user, result);
    sendResponse(res, resArr);
  } catch (error) {
    sendError(res, error.message);
  }
});
//update users category
router.patch("/:id", async (req, res, next) => {
  try {
    let result = await categ.editCategory(
      req.user,
      req.body.data.name,
      req.params.id
    );
    sendResult(res, result);
  } catch (error) {
    sendError(res, error.message);
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
    sendError(res, error.message);
  }
});
// delete categories by user id
router.delete("/", async (req, res, next) => {
  try {
    let result = await categ.deleteUsersAllCategory(req.user);
    sendResult(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});
export default router;
