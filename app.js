import express from "express";
import cors from "cors";
import userRouter from "./routes/users.js";
import phraseRouter from "./routes/expressions.js";
import collectionsRouter from "./routes/collections.js";
import contentRouter from "./routes/content.js";
import pbcollectionsRouter from "./routes/pbcollections.js";
import resetpasswordRouter from "./routes/resetpassword.js";
import categoriesRouter from "./routes/categories.js";
import imgRouter from "./routes/img.js";
import labelsRouter from "./routes/labels.js";
import * as usr from "./modules/usersM.js";
import { User } from "./classes/User.js";

export const app = express();
// const port = 9002;
const port = 8000;
process.env.TZ = "Etc/Universal"; // UTC +00:00
app.use(cors());
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
    "PATCH/resetpassword"
  )
);

app.get("/", (req, res, next) => {
  res.status(200).json({ message: "Ok" });
});
app.get("/Home", (req, res, next) => {
  res.status(200).json({ message: "Ok" });
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
// Default response for any other request
app.use(function (req, res) {
  res.status(404).json({ error: "bad request" });
});

export async function autorisation(req, res, next) {
  let token;
  if (!req.headers.authorization && !req.query.token) {
    return res
      .status(403)
      .json({ error: "No credentials sent! Please relogin!" });
  } else
    token = req.headers.authorization
      ? req.headers.authorization.split(" ")[1]
      : req.query.token;

  let userRow = await usr.getUserByToken(token);
  if (!userRow)
    return res.status(403).json({ error: "User not found. Please relogin!" });

  let user = User.getInstance();

  user.setToken(token);
  user.setUser(userRow);

  next();
}
export function unless(middleware, ...paths) {
  return async function (req, res, next) {
    try {
      console.log(
        "___________________________________________________REQUEST " +
          req.method +
          req.path
      );
      if (req.body.data && Object.keys(req.body.data).length)
        console.log("________ data", req.body.data);
      if (req.params && Object.keys(req.params).length)
        console.log("________ params", req.params);
      if (req.query && Object.keys(req.query).length)
        console.log("________ query", req.query);
    } catch (error) {}

    const pathCheck = paths.some((path) => path === req.method + req.path);
    pathCheck ? next() : await middleware(req, res, next);
  };
}
export default app;
