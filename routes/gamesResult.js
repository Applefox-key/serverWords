import express from "express";
import bodyParser from "body-parser";
const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
import db from "../database.js";
import { db_all, db_run } from "../helpers/dbAsync.js";
import { sendError, sendOk } from "../helpers/responseHelpers.js";
// `CREATE TABLE gamesResult (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   contentid INTEGER,
//   userid INTEGER,
//   probability TEXT,
//   FOREIGN KEY(contentid) REFERENCES content(id)
//   ON DELETE CASCADE ON UPDATE NO ACTION,
//   FOREIGN KEY(userid) REFERENCES users(id)
//   ON DELETE CASCADE ON UPDATE NO ACTION)`,
const getListByIds = async (listIds, userid) => {
  const query = `SELECT * FROM gamesResult WHERE userid = ? AND contentid IN (${listIds})`;
  const params = [userid];
  let result = await db_all(query, params);

  return result;
};

const getListByIdsAndGame = async (listIds, game = "", userid) => {
  let resultIds = await getListByIds(listIds, userid);
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

router.get("/collection/:collectionid", async (req, res) => {
  const collectionid = parseInt(req.params.collectionid);
  const userid = req.user.id;
  try {
    const contentRows = await db_all(
      "SELECT id FROM content WHERE collectionid = ?",
      [collectionid]
    );
    if (!contentRows.length) return res.status(200).json({ data: {} });
    const ids = contentRows.map((r) => r.id).join(",");
    const rows = await db_all(
      `SELECT contentid, probability FROM gamesResult WHERE userid = ? AND contentid IN (${ids})`,
      [userid]
    );
    const result = {};
    rows.forEach((row) => {
      try {
        result[row.contentid] = JSON.parse(row.probability);
      } catch {
        result[row.contentid] = {};
      }
    });
    res.status(200).json({ data: result });
  } catch (error) {
    sendError(res, error.message);
  }
});

router.post("/get", async (req, res) => {
  let listid = req.body.data.listid;
  let game = req.body.data.game;
  const userid = req.user.id;
  try {
    let list = await getListByIdsAndGame(listid, game, userid);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    sendError(res, error.message);
  }
});

router.post("/", async (req, res) => {
  try {
    const rawProb = req.body.data.newProb;
    let newProb = typeof rawProb === "string" ? JSON.parse(rawProb) : rawProb;
    const userid = req.user.id;
    let errorOccurred = false;

    const rowArr = await getListByIds(Object.keys(newProb), userid);

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
        break;
      }
    }

    for (const contid of Object.keys(newProb)) {
      let resultNew = await createNew(contid, newProb[contid], userid);
      if (resultNew.error) {
        console.error(resultNew.error.message);
        db.run("ROLLBACK");
        errorOccurred = true;
        break;
      }
    }

    if (errorOccurred) {
      sendError(res, "An error occurred");
    } else sendOk(res, "Probabilities updated/created successfully");
  } catch (error) {
    sendError(res, error.message);
  }
});
// DELETE /collection/:collectionid — reset all stats for entire collection
router.delete("/collection/:collectionid", async (req, res) => {
  const collectionid = parseInt(req.params.collectionid);
  const userid = req.user.id;
  try {
    const contentRows = await db_all(
      "SELECT id FROM content WHERE collectionid = ?",
      [collectionid]
    );
    if (!contentRows.length) return sendOk(res, "Nothing to reset");
    const ids = contentRows.map((r) => r.id).join(",");
    await db_run(
      `DELETE FROM gamesResult WHERE userid = ? AND contentid IN (${ids})`,
      [userid]
    );
    sendOk(res, "Statistics reset");
  } catch (error) {
    sendError(res, error.message);
  }
});

// DELETE /collection/:collectionid/mode/:mode — reset specific game mode for collection
router.delete("/collection/:collectionid/mode/:mode", async (req, res) => {
  const collectionid = parseInt(req.params.collectionid);
  const mode = req.params.mode;
  const userid = req.user.id;
  try {
    const contentRows = await db_all(
      "SELECT id FROM content WHERE collectionid = ?",
      [collectionid]
    );
    if (!contentRows.length) return sendOk(res, "Nothing to reset");
    const ids = contentRows.map((r) => r.id).join(",");
    const rows = await db_all(
      `SELECT contentid, probability FROM gamesResult WHERE userid = ? AND contentid IN (${ids})`,
      [userid]
    );
    for (const row of rows) {
      const prob = JSON.parse(row.probability);
      delete prob[mode];
      if (Object.keys(prob).length === 0) {
        await db_run(
          `DELETE FROM gamesResult WHERE contentid = ? AND userid = ?`,
          [row.contentid, userid]
        );
      } else {
        await db_run(
          `UPDATE gamesResult SET probability = ? WHERE contentid = ? AND userid = ?`,
          [JSON.stringify(prob), row.contentid, userid]
        );
      }
    }
    sendOk(res, "Statistics reset");
  } catch (error) {
    sendError(res, error.message);
  }
});

// DELETE /card/:contentid — reset all stats for a single card
router.delete("/card/:contentid", async (req, res) => {
  const contentid = parseInt(req.params.contentid);
  const userid = req.user.id;
  try {
    await db_run(
      `DELETE FROM gamesResult WHERE contentid = ? AND userid = ?`,
      [contentid, userid]
    );
    sendOk(res, "Statistics reset");
  } catch (error) {
    sendError(res, error.message);
  }
});

// DELETE /card/:contentid/mode/:mode — reset specific game mode for a single card
router.delete("/card/:contentid/mode/:mode", async (req, res) => {
  const contentid = parseInt(req.params.contentid);
  const mode = req.params.mode;
  const userid = req.user.id;
  try {
    const rows = await db_all(
      `SELECT probability FROM gamesResult WHERE contentid = ? AND userid = ?`,
      [contentid, userid]
    );
    if (!rows.length) return sendOk(res, "Nothing to reset");
    const prob = JSON.parse(rows[0].probability);
    delete prob[mode];
    if (Object.keys(prob).length === 0) {
      await db_run(
        `DELETE FROM gamesResult WHERE contentid = ? AND userid = ?`,
        [contentid, userid]
      );
    } else {
      await db_run(
        `UPDATE gamesResult SET probability = ? WHERE contentid = ? AND userid = ?`,
        [JSON.stringify(prob), contentid, userid]
      );
    }
    sendOk(res, "Statistics reset");
  } catch (error) {
    sendError(res, error.message);
  }
});

export default router;
