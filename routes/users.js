import * as usr from "../modules/usersM.js";
import * as validator from "../helpers/validator.js";
import express from "express";
import db from "../database.js";
import bodyParser from "body-parser";
import md5 from "md5";
import { User } from "../classes/User.js";

const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//signin by email without token
router.post("/", async (req, res, next) => {
  try {
    if (!req.body.data) {
      res.status(400).json({ error: "data is missing" });
      return;
    }
    if (!req.body.data.email || !req.body.data.password) {
      res.status(400).json({ error: "wrong login or password" });
      return;
    }
    let emailValid = validator.emaileValidation(req.body.data.email);
    if (emailValid.error) {
      res.status(400).json({ error: emailValid.error });
      return;
    }
    if (await usr.getUserByEmail(req.body.data.email)) {
      res.status(400).json({ error: "user already exists" });
      return;
    }

    let data = {
      name: req.body.data.name ? req.body.data.name : null,
      email: req.body.data.email,
      password: md5(req.body.data.password),
      img: req.body.data.img ? req.body.data.img : null,
    };

    let result = await usr.createUser(data);

    if (result.error) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(200).json({ message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//delete user
router.delete("/", async (req, res, next) => {
  try {
    const token = User.getInstance().token;

    let result = await usr.deleteUser();
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//ONE by token
router.get("/", async (req, res, next) => {
  try {
    let user = User.getInstance().user;
    res.status(200).json({ data: user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//all by admin token
router.get("/all", async (req, res, next) => {
  try {
    let user = User.getInstance().user;

    if (user.role !== "admin") {
      res.status(400).json({ error: "access denied" });
    }
    let list = await usr.getAllUsers();

    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//login by email without token
router.post("/login", async (req, res, next) => {
  try {
    if (!req.body.data.email) {
      res.status(400).json({ error: "no login" });
      return;
    }
    if (!req.body.data.password) {
      res.status(400).json({ error: "no password" });
      return;
    }
    let emailValid = validator.emaileValidation(req.body.data.email);
    if (emailValid.error) {
      res.status(400).json({ error: emailValid.error });
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
    res.status(400).json({ error: error.message });
  }
});

//logout by token
router.delete("/logout", async (req, res, next) => {
  try {
    const token = User.getInstance().token;
    if (!token) {
      res.status(400).json({ error: "session is not found" });
      return;
    }
    const result = await usr.logout(token);
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//UPDATE BY token
router.patch("/", async (req, res, next) => {
  try {
    const userid = User.getInstance().user.id;
    var data = {
      name: req.body.data.name,
      img: req.body.data.img,
      email: req.body.data.email,
      password: req.body.data.password ? md5(req.body.data.password) : null,
    };

    let result = await usr.updateUser(userid, data);
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//UPDATE password BY admin token
router.patch("/password", async (req, res, next) => {
  try {
    let user = User.getInstance().user;

    if (user.role !== "admin") {
      res.status(400).json({ error: "access denied" });
    }
    const userid = req.body.data.userid;
    const p = req.body.data.password ? md5(req.body.data.password) : null;

    var data = {
      password: req.body.data.password ? md5(req.body.data.password) : null,
    };

    let result = await usr.updateUser(userid, data);
    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// module.exports = router;
export default router;
