import express from "express";
import bodyParser from "body-parser";
const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { User } from "../classes/User.js";

router.get("/", (req, res) => {
  const userId = User.getInstance().user.id;
  const colid = req.query.col;
  const filename = req.query.img;
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const userFolderPath = path.join(
    path.join(__dirname, ".."),
    "content",
    userId.toString(),
    colid,
    filename.toString()
  );

  res.sendFile(userFolderPath);
});
router.get("/avatars", (req, res) => {
  const userId = User.getInstance().user.id;
  const filename = req.query.img;
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const userFolderPath = path.join(
    path.join(__dirname, ".."),
    "content",
    userId.toString(),
    "avatars",
    filename.toString()
  );

  res.sendFile(userFolderPath);
});
export default router;
