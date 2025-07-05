import express from "express";
import bodyParser from "body-parser";
const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
import { User } from "../classes/User.js";
import db from "../database.js";
import { db_all, db_run } from "../helpers/dbAsync.js";
// `CREATE TABLE gamesResult (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   contentid INTEGER,
//   userid INTEGER,
//   probability TEXT,
//   FOREIGN KEY(contentid) REFERENCES content(id)
//   ON DELETE CASCADE ON UPDATE NO ACTION,
//   FOREIGN KEY(userid) REFERENCES users(id)
//   ON DELETE CASCADE ON UPDATE NO ACTION)`,
const getListByIds = async (listIds) => {
  //`SELECT * FROM gamesResult WHERE userid = ? AND AND id IN (${placeholders})`,
  const userid = User.getInstance().user.id;
  // SELECT by ids
  const query = `SELECT * FROM gamesResult WHERE userid = ? AND contentid IN (${listIds})`;
  const params = [userid];
  let result = await db_all(query, params);

  return result;
};

const getListByIdsAndGame = async (listIds, game = "") => {
  //`SELECT * FROM gamesResult WHERE userid = ? AND AND id IN (${placeholders})`,
  // SELECT by ids
  let resultIds = await getListByIds(listIds);
  if (!game) return resultIds;
  const probabilitiesObject = {};
  resultIds.forEach((row) => {
    const contentid = row.contentid;
    const probabilityObj = JSON.parse(row.probability);
    // const probabilityObj = row.probability;

    if (!probabilitiesObject[contentid]) {
      probabilitiesObject[contentid] = 10;
    }

    if (probabilityObj[game] !== undefined) {
      probabilitiesObject[contentid] = probabilityObj[game];
    }
  });

  return probabilitiesObject;
};

const createNew = async (id, prob, userid) => {
  const query = `
    INSERT INTO gamesResult (contentid, userid,probability)  VALUES (?, ?,?) 
  `;
  const params = [parseInt(id), userid, JSON.stringify(prob)];
  const result = await db_run(query, params);
  return result;
};

const editProb = async (id, prob, userid) => {
  // Update the probability in the gamesResult table
  const query = `
  UPDATE gamesResult SET probability = COALESCE(?, probability) WHERE contentid = ? AND userid = ?
  `;
  const params = [JSON.stringify(prob), parseInt(id), userid];
  const result = await db_run(query, params);
  return result;
};

router.get("/get", async (req, res) => {
  let listid = req.body.data.listid;
  let game = req.body.data.game;
  try {
    let list = await getListByIdsAndGame(listid, game);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  let newProb = JSON.parse(req.body.data.newProb);
  const userid = User.getInstance().user.id;
  let errorOccurred = false;

  const rowArr = await getListByIds(Object.keys(newProb));

  for (const element of rowArr) {
    let contentid = element.contentid;
    let newPr = {
      ...JSON.parse(element.probability),
      ...newProb[element.contentid],
    };
    const resultUpd = await editProb(contentid, newPr, userid);
    delete newProb[contentid];
    if (resultUpd.error) {
      console.error(resultUpd.error.message);
      db.run("ROLLBACK");
      errorOccurred = true;
      return;
    }
  }

  for (const contid of Object.keys(newProb)) {
    let contentid = contid;
    let resultNew = await createNew(contentid, newProb[contentid], userid);
    if (resultNew.error) {
      console.error(resultNew.error.message);
      db.run("ROLLBACK");
      errorOccurred = true;
      return;
    }
  }

  console.log(errorOccurred);

  if (errorOccurred) {
    res.status(400).json({ error: "An error occurred" });
  } else
    res
      .status(200)
      .json({ message: "Probabilities updated/created successfully" });
});
export default router;
