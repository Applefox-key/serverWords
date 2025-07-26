import * as usr from "../modules/usersM.js";
import * as validator from "../helpers/validator.js";
import express from "express";
import bodyParser from "body-parser";
import md5 from "md5";
import { uploadUserAvatar } from "../helpers/multer.js";
import {
  sendError,
  sendResponse,
  sendResult,
} from "../helpers/responseHelpers.js";

const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//signin by email without token
router.post("/", async (req, res, next) => {
  try {
    if (!req.body.data) {
      sendError(res, "data is missing");
      return;
    }
    if (!req.body.data.email || !req.body.data.password) {
      sendError(res, "wrong login or password");
      return;
    }
    let emailValid = validator.emaileValidation(req.body.data.email);
    if (emailValid.error) {
      sendError(res, emailValid.error);
      return;
    }
    if (await usr.getUserByEmail(req.body.data.email)) {
      sendError(res, "user already exists");
      return;
    }

    let data = {
      name: req.body.data.name ? req.body.data.name : null,
      email: req.body.data.email,
      password: md5(req.body.data.password),
      img: req.body.data.img ? req.body.data.img : null,
      settings: req.body.data.settings ? req.body.data.settings : null,
    };

    let result = await usr.createUser(data);
    sendResult(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});

//delete user
router.delete("/", async (req, res, next) => {
  try {
    let result = await usr.deleteUser(req.user);
    sendResult(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});

//ONE by token
router.get("/", async (req, res, next) => {
  try {
    let user = req.user;

    sendResponse(res, user);
  } catch (error) {
    sendError(res, error.message);
  }
});
//all by admin token
router.get("/all", async (req, res, next) => {
  try {
    let user = req.user;

    if (user.role !== "admin") {
      sendError(res, "access denied");
    }
    let list = await usr.getAllUsers();
    sendResponse(res, list, "session not found");
  } catch (error) {
    sendError(res, error.message);
  }
});
//login by email without token
router.post("/login", async (req, res, next) => {
  try {
    if (!req.body.data.email) {
      sendError(res, "no login");
      return;
    }
    if (!req.body.data.password) {
      sendError(res, "no password");
      return;
    }
    let emailValid = validator.emaileValidation(req.body.data.email);
    if (emailValid.error) {
      sendError(res, emailValid.error);
      return;
    }

    const result = await usr.login(req.body.data.email, req.body.data.password);

    res
      .status(result.error ? 400 : 200)
      .json(
        result.error
          ? { error: result.error }
          : { token: result.token, role: result.role }
      );
  } catch (error) {
    sendError(res, error.message);
  }
});

//logout by token
router.delete("/logout", async (req, res, next) => {
  try {
    const token = req.token;
    if (!token) {
      return sendError(res, "session is not found");
    }
    const result = await usr.logout(token);

    sendResult(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});

//UPDATE BY token
router.patch("/", uploadUserAvatar.single("file"), async (req, res, next) => {
  // , req.files

  try {
    let userD = { ...req.body.data };

    const userid = req.user.id;
    // const settings =
    //   typeof userD.settings === "string"
    //     ? JSON.parse(userD.settings)
    //     : userD.settings;
    var data = {
      name: userD.name,
      img: userD.img,
      email: userD.email,
      password: userD.password ? md5(req.body.data.password) : null,
      settings: userD.settings,
    };

    let result = await usr.updateUser(req.user, userid, data, req.file);
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    sendError(res, error.message);
  }
});
//UPDATE password BY admin token
router.patch("/password", async (req, res, next) => {
  try {
    let user = req.user;
    if (user.role !== "admin") {
      sendError(res, "access denied");
    }
    const userid = req.body.data.userid;
    var data = {
      name: req.body.data.name,
      img: req.body.data.img,
      email: req.body.data.email,
      password: req.body.data.password ? md5(req.body.data.password) : null,
      settings: req.body.data.settings,
    };

    let result = await usr.updateUser(user, userid, data);

    sendResult(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});
//UPDATE user BY admin token
router.patch("/byadmin", async (req, res, next) => {
  try {
    let user = req.user;
    if (user.role !== "admin") {
      sendError(res, "access denied");
    }
    const userid = req.body.data.userid;
    var data = {
      name: req.body.data.name,
      img: req.body.data.img,
      email: req.body.data.email,
      password: req.body.data.password ? md5(req.body.data.password) : null,
      settings: JSON.parse(req.body.data.settings),
    };

    console.log(`by admin user ${userid}`);

    let result = await usr.updateUser(user, userid, data);
    sendResult(res, result);
  } catch (error) {
    sendError(res, error.message);
  }
});
// module.exports = router;
export default router;
