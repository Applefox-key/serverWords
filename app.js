import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRouter from "./routes/users.js";
import phraseRouter from "./routes/expressions.js";
import collectionsRouter from "./routes/collections.js";
import contentRouter from "./routes/content.js";
import pbcollectionsRouter from "./routes/pbcollections.js";
import resetpasswordRouter from "./routes/resetpassword.js";
import categoriesRouter from "./routes/categories.js";
import imgRouter from "./routes/img.js";
import labelsRouter from "./routes/labels.js";
import entriesRouter from "./routes/entries.js";
import playlistsRouter from "./routes/playlists.js";
import gamesResultRouter from "./routes/gamesResult.js";
import collectionTagsRouter from "./routes/collectionTags.js";
import entryTagsRouter from "./routes/entryTags.js";
import * as usr from "./modules/usersM.js";
import { runDailyQueueUpdate } from "./helpers/runDailyQueueUpdate.js";
import { sendError, sendOk } from "./helpers/responseHelpers.js";

export const app = express();
// const port = 9002;
const port = 8000;
process.env.TZ = "Etc/Universal"; // UTC +00:00
app.use(
  cors({
    origin: [
      "https://flashcards.learnypie.com",
      "https://flashcardsold.learnypie.com",
      "https://phrases.learnypie.com",
      "https://phrasely.learnypie.com",
      "https://tracker.learnypie.com",
      "https://learnypie.com",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "http://localhost:8080",
    ],
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.static("public"));
app.use("/images", express.static("public/images"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  unless(
    autorisation,
    "POST/users/login",
    "POST/users",
    "GET/Home",
    "POST/resetpassword",
    "GET/resetpassword",
    "PATCH/resetpassword",
    "GET/users/auth/google",
    "GET/users/auth/google/callback",
    "GET/img/avatars",
  ),
);

app.get("/", (req, res, next) => {
  sendOk(res);
});
app.get("/Home", (req, res, next) => {
  sendOk(res);
});
app.use("/users", userRouter);
app.use("/expressions", phraseRouter);
app.use("/collections", collectionsRouter);
app.use("/content", contentRouter);
app.use("/pbcollections", pbcollectionsRouter);
app.use("/categories", categoriesRouter);
app.use("/resetpassword", resetpasswordRouter);
app.use("/img", imgRouter);
app.use("/labels", labelsRouter);
app.use("/playlists", playlistsRouter);
app.use("/gamesresult", gamesResultRouter);
app.use("/entries", entriesRouter);
app.use("/collection-tags", collectionTagsRouter);
app.use("/entry-tags", entryTagsRouter);
// Default response for any other request
app.use(function (req, res) {
  sendError(res, "bad request", 404);
});

export async function autorisation(req, res, next) {
  let token;

  if (req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.query.token) {
    token = req.query.token;
  } else if (req.cookies?.learnapp_token) {
    token = req.cookies.learnapp_token;
  } else {
    return res.status(403).json({ error: "No credentials sent! Please relogin!" });
  }

  let userRow = await usr.getUserByToken(token);

  if (!userRow) return sendError(res, "User's not found. Please relogin!", 403);
  req.user = userRow;
  req.token = token;
  if (req.user && req.user.role !== "admin") await runDailyQueueUpdate(userRow);
  next();
}
export function unless(middleware, ...paths) {
  return async function (req, res, next) {
    try {
      console.log("___________________________________________________REQUEST " + req.method + req.path);
      if (req.body.data && Object.keys(req.body.data).length) console.log("________ data", req.body.data);
      if (req.params && Object.keys(req.params).length) console.log("________ params", req.params);
      if (req.query && Object.keys(req.query).length) console.log("________ query", req.query);
    } catch (error) {}

    const pathCheck = paths.some((path) => path === req.method + req.path);
    pathCheck ? next() : await middleware(req, res, next);
  };
}
export default app;
