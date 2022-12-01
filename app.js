import express from "express";
import cors from "cors";
import userRouter from "./routes/users.js";
import phraseRouter from "./routes/expressions.js";
import collectionsRouter from "./routes/collections.js";
import contentRouter from "./routes/content.js";
import pbcollectionsRouter from "./routes/pbcollections.js";
import categoriesRouter from "./routes/categories.js";
import * as usr from "./models/usersM.js";
import { User } from "./classes/User.js";
//const express = require("express");
export const app = express();
const port = 8000;
process.env.TZ = "Etc/Universal"; // UTC +00:00
// var cors = require("cors");
app.use(cors());
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(unless(autorisation, "POST/users/login", "POST/users"));

app.get("/", (req, res, next) => {
  res.json({ message: "Ok" });
});
app.use("/users", userRouter);
app.use("/expressions", phraseRouter);
app.use("/collections", collectionsRouter);
app.use("/content", contentRouter);
app.use("/pbcollections", pbcollectionsRouter);
app.use("/categories", categoriesRouter);
// Default response for any other request
app.use(function (req, res) {
  res.status(404).json({ error: "bad request" });
});

export async function autorisation(req, res, next) {
  if (!req.headers.authorization) {
    return res
      .status(403)
      .json({ error: "No credentials sent! Please relogin!" });
  }
  const token = req.headers.authorization.split(" ")[1];
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
    console.log(req.method + req.path);
    console.log(req.body.data);
    const pathCheck = paths.some((path) => path === req.method + req.path);
    pathCheck ? next() : await middleware(req, res, next);
  };
}
export default app;
