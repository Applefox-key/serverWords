import * as usr from "../modules/usersM.js";
import * as validator from "../helpers/validator.js";
import express from "express";
import bodyParser from "body-parser";
import md5 from "md5";
import { uploadUserAvatar } from "../helpers/multer.js";
import { sendError, sendResponse, sendResult } from "../helpers/responseHelpers.js";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

const getOAuthClient = () =>
  new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);

const ALLOWED_REDIRECTS = [
  "https://phrasely.learnypie.com",
  "https://flashcards.learnypie.com",
  "https://phrases.learnypie.com",
  "https://tracker.learnypie.com",
  "https://learnypie.com",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:8080",
];

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

    if (!result.error) {
      const isProd = process.env.NODE_ENV === "production";
      res.cookie("learnapp_token", result.token, {
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        domain: isProd ? ".learnypie.com" : undefined,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { token: result.token, role: result.role });
  } catch (error) {
    sendError(res, error.message);
  }
});

//logout by token
router.delete("/logout", async (req, res, next) => {
  try {
    const token = req.token;
    const result = await usr.logout(token);

    // Clear the shared cookie
    const isProd = process.env.NODE_ENV === "production";
    res.clearCookie("learnapp_token", {
      domain: isProd ? ".learnypie.com" : undefined,
    });

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
    res.status(result.error ? 400 : 200).json(result.error ? { error: result.error } : { message: "success" });
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
router.get("/auth/google", (req, res) => {
  const redirect = (req.query.redirect || process.env.FRONTEND_URL || ALLOWED_REDIRECTS[0]).replace(/\/$/, "");
  if (!ALLOWED_REDIRECTS.includes(redirect)) {
    return res.status(400).json({ error: "invalid redirect" });
  }
  const client = getOAuthClient();
  const url = client.generateAuthUrl({
    access_type: "online",
    scope: ["email", "profile"],
    state: Buffer.from(redirect).toString("base64"),
  });
  res.redirect(url);
});

router.get("/auth/google/callback", async (req, res) => {
  console.log("Google callback hit", req.query);
  const fallback = process.env.FRONTEND_URL || "http://localhost:5173";
  const redirectTo = req.query.state ? Buffer.from(req.query.state, "base64").toString() : fallback;

  try {
    const { code } = req.query;
    if (!code) return res.redirect(`${redirectTo}?error=no_code`);

    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const { data } = await google.oauth2({ version: "v2", auth: client }).userinfo.get();

    const result = await usr.loginOrCreateGoogleUser({
      email: data.email,
      name: data.name,
      img: data.picture,
    });

    if (result.error) return res.redirect(`${redirectTo}?error=${result.error}`);

    const isProd = process.env.NODE_ENV === "production";
    res.cookie("learnapp_token", result.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      domain: isProd ? ".learnypie.com" : undefined,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.redirect(redirectTo);
  } catch (error) {
    console.error("Google auth error:", error.message);
    res.redirect(`${redirectTo}?error=google_auth_failed`);
  }
});

// module.exports = router;
export default router;
