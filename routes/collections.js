import * as col from "../modules/collectionsM.js";
import * as pb from "../modules/pbcollectionsM.js";
import * as common from "../modules/commonM.js";
import express from "express";
import bodyParser from "body-parser";
import {
  createUserCategory,
  getCategoryByName,
} from "../modules/categoriesM.js";
import { upload } from "../helpers/multer.js";
import { formatCollectionContent } from "../helpers/collectionsService.js";
import {
  sendError,
  sendOk,
  sendResponse,
  sendResult,
} from "../helpers/responseHelpers.js";

const router = express.Router();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// getOneWithContentAdmin
//all by admin token
router.get("/all", async (req, res, next) => {
  try {
    let user = req.user;
    if (user.role !== "admin") {
      sendError(res, "access denied");
    }

    let list = await col.getAllUsersCollections();
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    sendError(res, error.message);
  }
});
//one by admin token
router.get("/:id/admin", async (req, res, next) => {
  try {
    let user = req.user;
    if (user.role !== "admin") {
      sendError(res, "access denied");
    }

    let list = await common.getOneWithContentAdmin();
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    sendError(res, error.message);
  }
});
//Create new
router.post("/", async (req, res, next) => {
  try {
    let result = await col.createCollection(req.user, { ...req.body.data });
    res
      .status(result.error ? 400 : 200)
      .json(
        result.error
          ? { error: result.error }
          : { message: "success", id: result }
      );
  } catch (error) {
    sendError(res, error.message);
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
      let catid = await getCategoryByName(req.user, req.body.data.categoryName);
      //there is no such category ? -> add and get it's id
      if (!catid)
        catid = await createUserCategory(req.user, req.body.data.categoryName);
    }

    //create collection
    let resp = await col.createCollection(req.user, {
      name: req.body.data.name,
      categoryid: catid,
      note: req.body.data.note,
    });

    if (!resp || resp.error) {
      return sendError(res, resp ? resp.error : "error");
    }

    //create content
    let list = req.body.data.content;
    if (!Array.isArray(list)) {
      sendError(res, "content is not an Array");
      return;
    }
    let err = false;

    for (const element of list) {
      let result = await common.createCollectionContent(
        req.user,
        element,
        resp.id
      );

      if (result.error) {
        err = true;
        sendError(res, result.error);
        break;
      }
    }
    if (!err) sendResponse(res, { message: "success", id: resp });
    sendResult(res, resp);
  } catch (error) {
    sendError(res, error.message);
  }
});
//Create new from shared content
router.post("/copy", async (req, res, next) => {
  try {
    const userId = req.user.id;
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
      catid = await getCategoryByName(req.user, cat);
      //there is no such category ? -> add and get it's id
      if (!catid) catid = await createUserCategory(req.user, cat);
    }

    //create collection
    let newCol = await col.createCollection(req.user, {
      name: collectionFrom[0].name,
      categoryid: catid ? catid.id : null,
      note: collectionFrom[0].note,
    });

    if (!newCol || newCol.error) {
      return sendError(res, newCol?.error || "error");
    }

    //create content
    let list = collectionFrom;

    if (!Array.isArray(list)) return sendError(res, "content is not an Array");

    let err = false;

    for (const item of list) {
      let result = await common.createCollectionContent(
        req.user,
        item,
        newCol.id,
        fromUser
      );
      if (result.error) {
        err = true;
        return sendError(res, result.error);
      }
    }

    if (!err) sendOk(res, "the collection has been added to your list");
  } catch (error) {
    sendError(res, error.message);
  }
});

//Get user's all collections
router.get("/", async (req, res, next) => {
  try {
    let list = await col.getAll(req.user);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    sendError(res, error.message);
  }
});

//Get user's all collections
router.get("/favorite", async (req, res, next) => {
  let prop = { isFavorite: true };
  if (req.query.hasOwnProperty("isPublic")) prop.isPublic = "1";
  try {
    let result = await common.getAllWithContent(req.user, prop);
    let resArr = formatCollectionContent(req.user, result);
    res
      .status(!resArr ? 400 : 200)
      .json(!resArr ? { error: "session not found" } : { data: resArr });
  } catch (error) {
    sendError(res, error.message);
  }
});
//Delete user's all collections
router.delete("/", async (req, res, next) => {
  try {
    let list = await col.deleteAll(req.user);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    sendError(res, error.message);
  }
});

//BY ID
//Get user's one collection by id
router.get("/:id", async (req, res, next) => {
  try {
    let list = await col.getOne(req.user, req.params.id);
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { data: list });
  } catch (error) {
    sendError(res, error.message);
  }
});
//Edit collection by id
router.patch("/share/:id", async (req, res, next) => {
  try {
    let list = await col.switchIsPublic(
      req.user,
      req.body.data.isPublic,
      req.params.id
    );
    res
      .status(!list ? 400 : 200)
      .json(!list ? { error: "session not found" } : { message: "success" });
  } catch (error) {
    console.log(error.message);

    sendError(res, error.message);
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

    sendError(res, error.message);
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
    sendError(res, error.message);
  }
});

//Get user's one collections with content by collection id
router.get("/:id/content", async (req, res, next) => {
  try {
    let result = await common.getOneWithContent(req.user, req.params.id);
    if (!result) return sendError(res, "bad request");

    let resArr = formatCollectionContent(req.user, result);
    sendResponse(res, resArr);
  } catch (error) {
    sendError(res, error.message);
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

      for (const element of list) {
        const result = await common.createCollectionContent(
          req.user,
          { ...element },
          req.params.id,
          "",
          isOneItem ? req.files : ""
        );

        if (result.error) {
          sendError(res, result.error);
          err = true;
          break;
        }
      }

      if (!err) sendOk(res, "success");
    } catch (error) {
      sendError(res, error.message);
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
    sendError(res, error.message);
  }
});

export default router;
