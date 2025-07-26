import * as pl from "../modules/playlistsM.js";
import * as common from "../modules/commonM.js";
import express from "express";
import bodyParser from "body-parser";
import { formatCollectionContent } from "../helpers/collectionsService.js";
import { sendError } from "../helpers/responseHelpers.js";

const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//get all
router.get("/", async (req, res, next) => {
  try {
    let list = await pl.getAll(req.user);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "playlist not found" } : { data: list });
  } catch (error) {
    sendError(res, error.message);
  }
});
//get all
router.get("/list", async (req, res, next) => {
  try {
    let list = await pl.getListAll(req.user);

    let resArr = formatCollectionContent(req.user, list);
    res
      .status(!resArr ? 400 : 200)
      .json(!list ? { error: "labels not found" } : { data: resArr });
  } catch (error) {
    sendError(res, error.message);
  }
});
//get content for game
router.get("/:id/content", async (req, res, next) => {
  try {
    let list = await pl.getContentById(req.user, req.params.id);

    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "labels not found" } : { data: list });
  } catch (error) {
    sendError(res, error.message);
  }
});
//get one by id
router.get("/:id", async (req, res, next) => {
  try {
    let list = await pl.getOneById(req.user, req.params.id);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "playlist not found" } : { data: list });
  } catch (error) {
    sendError(res, error.message);
  }
});
//create users playlist
router.post("/", async (req, res, next) => {
  try {
    let result = await pl.createNew(
      req.user,
      req.body.data.name,
      req.body.data.listIds
    );
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    sendError(res, error.message);
  }
});

//update users label
router.patch("/:id", async (req, res, next) => {
  try {
    let result = await pl.edit(
      req.user,
      req.body.data.name,
      req.body.data.listIds,
      req.params.id
    );
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    sendError(res, error.message);
  }
});
// delete label by id
router.delete("/:id", async (req, res, next) => {
  try {
    let result = await pl.deleteOne(req.params.id);
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    sendError(res, error.message);
  }
});
// delete label by user id
router.delete("/", async (req, res, next) => {
  try {
    let result = await pl.deleteAll();
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    sendError(res, error.message);
  }
});
export default router;
