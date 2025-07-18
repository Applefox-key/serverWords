import * as col from "../modules/collectionsM.js";
import * as pb from "../modules/pbcollectionsM.js";
import * as common from "../modules/commonM.js";
import express from "express";
import bodyParser from "body-parser";
import { User } from "../classes/User.js";
import {
  createUserCategory,
  getCategoryByName,
} from "../modules/categoriesM.js";
import { upload } from "../helpers/multer.js";

const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// getOneWithContentAdmin
//all by admin token
router.get("/all", async (req, res, next) => {
  try {
    let user = User.getInstance().user;
    if (user.role !== "admin") {
      res.status(400).json({ error: "access denied" });
    }

    let list = await col.getAllUsersCollections();
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//one by admin token
router.get("/:id/admin", async (req, res, next) => {
  try {
    let user = User.getInstance().user;
    if (user.role !== "admin") {
      res.status(400).json({ error: "access denied" });
    }

    let list = await common.getOneWithContentAdmin();
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//Create new
router.post("/", async (req, res, next) => {
  try {
    let result = await col.createCollection({ ...req.body.data });
    res
      .status(result.error ? 400 : 200)
      .json(
        result.error
          ? { error: result.error }
          : { message: "success", id: result }
      );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//Create new with content
router.post("/content", async (req, res, next) => {
  try {
    const fromPub = req.body.data.fromPub;

    let catid;
    //add from file with category id
    if (req.body.data.categoryid) {
      catid = req.body.data.categoryid;
    } else if (req.body.data.categoryName) {
      //add from public collection -> get appropriate user's category
      //trying to get cutegory by name
      let catid = await getCategoryByName(req.body.data.categoryName);
      //there is no such category ? -> add and get it's id
      if (!catid) catid = await createUserCategory(req.body.data.categoryName);
    }

    //create collection
    let resp = await col.createCollection({
      name: req.body.data.name,
      categoryid: catid,
      note: req.body.data.note,
    });

    if (!resp || resp.error) {
      res.status(400).json({ error: resp ? resp.error : "error" });
      return;
    }

    //create content
    let list = req.body.data.content;
    if (!Array.isArray(list)) {
      res.status(400).json({ error: "content is not an Array" });
      return;
    }
    let err = false;

    list.forEach(async (element, i) => {
      let result = await common.createCollectionContent(element, resp.id);
      if (result.error) {
        err = true;
        res.status(400).json({ error: result.error });
        return;
      }
    });
    if (!err) res.status(200).json({ message: "success", id: resp });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//Create new from shared content
router.post("/copy", async (req, res, next) => {
  try {
    const userId = User.getInstance().user.id;
    const collectionFrom = await pb.getOneWithContent(req.body.data.colId);

    let cat = collectionFrom[0].category;
    let fromUser = {
      userFromId: collectionFrom[0].userid.toString(),
      colFromId: collectionFrom[0].id.toString(),
    };

    if (fromUser.userFromId === userId.toString()) {
      res
        .status(200)
        .json({ message: "This collection is already in your list" });
      return;
    }

    let catid;
    if (cat) {
      //add from public collection -> get appropriate user's category
      //trying to get cutegory by name
      catid = await getCategoryByName(cat);
      //there is no such category ? -> add and get it's id
      if (!catid) catid = await createUserCategory(cat);
    }

    //create collection
    let newCol = await col.createCollection({
      name: collectionFrom[0].name,
      categoryid: catid ? catid.id : null,
      note: collectionFrom[0].note,
    });

    if (!newCol || newCol.error) {
      res.status(400).json({ error: newCol ? newCol.error : "error" });
      return;
    }

    //create content
    let list = collectionFrom;

    if (!Array.isArray(list)) {
      res.status(400).json({ error: "content is not an Array" });
      return;
    }
    let err = false;

    // list.forEach(async (element, i) => {
    for (const item of list) {
      let result = await common.createCollectionContent(
        item,
        newCol.id,
        fromUser
      );
      if (result.error) {
        err = true;
        res.status(400).json({ error: result.error });
        return;
      }
    }
    if (!err)
      res
        .status(200)
        .json({ message: "the collection has been added to your list" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Get user's all collections
router.get("/", async (req, res, next) => {
  try {
    let list = await col.getAll();
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Get user's all collections
router.get("/favorite", async (req, res, next) => {
  let prop = { isFavorite: true };
  if (req.query.hasOwnProperty("isPublic")) prop.isPublic = "1";
  try {
    let result = await common.getAllWithContent(prop);
    let resArr = common.formatCollectionContent(result);
    res
      .status(!resArr ? 400 : 200)
      .json(!resArr ? { error: "session not found" } : { data: resArr });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//Delete user's all collections
router.delete("/", async (req, res, next) => {
  try {
    let list = await col.deleteAll();
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//BY ID
//Get user's one collection by id
router.get("/:id", async (req, res, next) => {
  try {
    let list = await col.getOne(req.params.id);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
//Edit collection by id
router.patch("/share/:id", async (req, res, next) => {
  try {
    let list = await col.switchIsPublic(req.body.data.isPublic, req.params.id);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { message: "success" });
  } catch (error) {
    console.log(error.message);

    res.status(400).json({ error: error.message });
  }
});
//Edit collection by id
router.patch("/:id", async (req, res, next) => {
  try {
    let list = await col.editCollection(req.body.data, req.params.id);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { message: "success" });
  } catch (error) {
    console.log(error.message);

    res.status(400).json({ error: error.message });
  }
});

// Delete  collection with content by id
router.delete("/:id", async (req, res, next) => {
  try {
    let result = await col.deleteCollection(req.params.id);

    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Get user's one collections with content by collection id
router.get("/:id/content", async (req, res, next) => {
  try {
    let result = await common.getOneWithContent(req.params.id);
    if (!result) {
      res.status(400).json({ error: "bad request" });
      return;
    }
    let resArr = common.formatCollectionContent(result);
    res.status(200).json({ data: resArr });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create new content by collection id
router.post(
  "/:id/content",
  upload.fields([{ name: "imgAfile" }, { name: "imgQfile" }]),
  async (req, res, next) => {
    let isOneItem = false;
    try {
      let list = req.body.data.list;
      if (!Array.isArray(list)) {
        list = [req.body.data];
        isOneItem = true;
      }

      let err = false;
      list.forEach(async (element, i) => {
        let result = await common.createCollectionContent(
          { ...element },
          req.params.id,
          "",
          isOneItem ? req.files : ""
        );
        if (result.error) {
          res.status(400).json({ error: result.error });
          err = true;
          return;
        }
      });

      if (!err) res.status(200).json({ message: "success" });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);
// Delete content by collection id
router.delete("/:id/content", async (req, res, next) => {
  try {
    let result = await common.deleteItemsByColId(req.params.id);

    res
      .status(result.error ? 400 : 200)
      .json(result.error ? { error: result.error } : { message: "success" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
