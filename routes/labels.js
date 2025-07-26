import * as lab from "../modules/labelsM.js";
import express from "express";
import bodyParser from "body-parser";
import { sendError } from "../helpers/responseHelpers.js";

const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//all by admin token
router.get("/all", async (req, res, next) => {
  try {
    let user = req.user;
    if (user.role !== "admin") {
      sendError(res, "access denied");
    }
    let list = await lab.getAllLabels();
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    sendError(res, error.message);
  }
});
//get all
router.get("/", async (req, res, next) => {
  try {
    let list = await lab.getLabelsAll(req.user);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "labels not found" } : { data: list });
  } catch (error) {
    sendError(res, error.message);
  }
});
//create users label
router.post("/", async (req, res, next) => {
  try {
    let result = await lab.createUserLabel(req.user, req.body.data.name);
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
    let result = await lab.editLabel(
      req.user,
      req.body.data.name,
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
    let result = await lab.deleteLabel(req.params.id);
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
    let result = await lab.deleteUsersAllLabels(req.user);
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    sendError(res, error.message);
  }
});
export default router;
