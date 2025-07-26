import {
  updateUserPassword,
  resetQuery,
  resetTokenValidation,
  deleteResetToken,
  getAllResetTokens,
  deleteAllUnvalid,
} from "../modules/resetpasswordM.js";
import express from "express";
import bodyParser from "body-parser";
import md5 from "md5";
import {
  sendError,
  sendOk,
  sendResponse,
  sendResultPayload,
} from "../helpers/responseHelpers.js";
const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//request for token
router.post("/", async (req, res, next) => {
  let page = req.body.data.page
    ? "http://learnapp.me/resetpassword/"
    : "http://phrases.learnapp.me/resetpassword/";
  try {
    let result = await resetQuery(req.body.data.email, page);
    sendResultPayload(res, result, { resetToken: result?.token });
  } catch (error) {
    sendError(res, error.message);
  }
});
//request for token validation
router.get("/", async (req, res, next) => {
  try {
    let validToken = await resetTokenValidation(req.query.resetToken);

    if (validToken.error) sendError(res, error.message);
    else sendResponse(res, validToken);
  } catch (error) {
    sendError(res, error.message);
  }
});
//all token validation
router.get("/all", async (req, res, next) => {
  try {
    let result = await getAllResetTokens();
    sendResponse(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});
//DELETE ALL unvalid
router.delete("/", async (req, res, next) => {
  try {
    await deleteAllUnvalid();
    sendOk(res, "success");
  } catch (error) {
    sendError(res, error.message);
  }
});
// Delete  collection with content by id
router.delete("/:resetToken", async (req, res, next) => {
  try {
    let result = await deleteResetToken(req.params.resetToken);

    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    sendError(res, error.message);
  }
});
// //UPDATE password BY reset token
router.patch("/", async (req, res, next) => {
  try {
    let validToken = await resetTokenValidation(req.body.data.resetToken);
    if (validToken.error) {
      sendError(res, validToken.error);
      await deleteResetToken();
      return;
    }
    let userid = validToken.userid;

    let password = req.body.data.password ? md5(req.body.data.password) : null;

    let result = await updateUserPassword(userid, password);

    await deleteResetToken(validToken.token);
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    sendError(res, error.message);
  }
});

export default router;
