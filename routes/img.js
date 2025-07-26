import express from "express";
import bodyParser from "body-parser";
const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { getByID_forImg } from "../modules/collectionsM.js";
import { sendError } from "../helpers/responseHelpers.js";

router.get("/", async (req, res) => {
  const userId = req.user.id;
  const colid = req.query.col;

  //user by collection
  const collect = await getByID_forImg(colid);

  if (userId !== collect.userid && !collect.isPublic)
    sendError(res, "collection is not public");
  const filename = req.query.img;
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const userFolderPath = path.join(
    path.join(__dirname, ".."),
    "content",
    collect.userid.toString(),
    colid,
    filename.toString()
  );

  res.sendFile(userFolderPath);
});
router.get("/avatars", (req, res) => {
  const userId = req.user.id;
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
