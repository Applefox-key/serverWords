import * as lab from "../modules/labelsM.js";
import * as common from "../modules/commonM.js";
import express from "express";
import bodyParser from "body-parser";
import { User } from "../classes/User.js";

const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//all by admin token
router.get("/all", async (req, res, next) => {
  try {
    let user = User.getInstance().user;
    if (user.role !== "admin") {
      res.status(400).json({ error: "access denied" });
    }
    let list = await lab.getAllLabels();
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//get all
router.get("/", async (req, res, next) => {
  try {
    let list = await lab.getLabelsAll();
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "labels not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//create users label
router.post("/", async (req, res, next) => {
  try {
    let result = await lab.createUserLabel(req.body.data.name);
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
    let result = await lab.editLabel(req.body.data.name, req.params.id);
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
    let result = await lab.deleteLabel(req.params.id);
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
    let result = await lab.deleteUsersAllLabels();
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
export default router;
