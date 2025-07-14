import * as pl from "../modules/playlistsM.js";
import * as common from "../modules/commonM.js";
import express from "express";
import bodyParser from "body-parser";
import { User } from "../classes/User.js";

const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// //all by admin token
// router.get("/all", async (req, res, next) => {
//   try {
//     let user = User.getInstance().user;
//     if (user.role !== "admin") {
//       res.status(400).json({ error: "access denied" });
//     }
//     let list = await pl.getAllLabels();
//     res
//       .status(!list ? 400 : 200)
//       .json(!list ? { error: "session not found" } : { data: list });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });
//get all
router.get("/", async (req, res, next) => {
  try {
    let list = await pl.getAll();
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "playlist not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//get all
router.get("/list", async (req, res, next) => {
  try {
    let list = await pl.getListAll();

    let resArr = common.formatCollectionContent(list);
    res
      .status(!resArr ? 400 : 200)
      .json(!list ? { error: "labels not found" } : { data: resArr });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//get content for game
router.get("/:id/content", async (req, res, next) => {
  try {
    let list = await pl.getContentById(req.params.id);

    //  let resArr = common.formatCollectionContent(list);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "labels not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//get one by id
router.get("/:id", async (req, res, next) => {
  try {
    let list = await pl.getOneById(req.params.id);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "playlist not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//create users playlist
router.post("/", async (req, res, next) => {
  try {
    let result = await pl.createNew(req.body.data.name, req.body.data.listIds);
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// //edit labels by it's id
// router.get("/:id/expressions", async (req, res, next) => {
//   try {
//     let result = await common.getAllWithContentByCategory(req.params.id);
//     if (!result) {
//       res.status(400).json({ error: "bad request" });
//       return;
//     }
//     let resArr = common.formatCollectionContent(result);
//     res.status(200).json({ data: resArr });
//   } catch (error) {
//     res.status(400).json({ error: error.message });
//   }
// });
//update users label
router.patch("/:id", async (req, res, next) => {
  try {
    let result = await pl.edit(
      req.body.data.name,
      req.body.data.listIds,
      req.params.id
    );
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
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
    res.status(400).json({ error: error.message });
  }
});
export default router;
