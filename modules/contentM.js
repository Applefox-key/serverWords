import { db_run, db_get, db_all } from "../helpers/dbAsync.js";
import md5 from "md5";
import { User } from "../classes/User.js";
import { moveImgToNewCollection, saveImg } from "./images.js";

//get users one content item by id
export const getOneContentItem = async (id) => {
  // const userid = User.getInstance().user.id;
  const row = await db_get("SELECT * FROM content WHERE id = ? ", [id]);
  if (!row) return {};
  return row;
};
//get users one content item by id
export const getOnePbContentItem = async (id) => {
  // const userid = User.getInstance().user.id;
  const row = await db_get("SELECT * FROM content WHERE id = ? ", [id]);

  if (!row) return {};
  return row;
};
export const editContent = async (set, imges) => {
  let [imageQUrl, imageAUrl] = await saveImg(set, imges, set.collectionid);

  return await db_run(
    `UPDATE content set
      question = COALESCE(?,question),
      answer = COALESCE(?,answer),
      note = COALESCE(?,note),
      rate = COALESCE(?,rate),
      imgQ = ?,
      imgA = ?
      WHERE id = ?`,
    [set.question, set.answer, set.note, set.rate, imageQUrl, imageAUrl, set.id]
  );
};

export const deleteItem = async (id) => {
  return await db_run(`DELETE FROM content WHERE id = ${id}`);
};

export const moveContentToNewCollection = async (
  contentIds,
  newCollectionId
) => {
  const userId = User.getInstance().user.id;

  for (const contentId of contentIds) {
    const contentItem = await getOneContentItem(contentId);

    if (contentItem) {
      if (contentItem.imgA) {
        moveImgToNewCollection(
          contentItem.imgA,
          userId,
          contentItem.collectionid,
          newCollectionId
        );
      }
      if (contentItem.imgQ) {
        moveImgToNewCollection(
          contentItem.imgQ,
          userId,
          contentItem.collectionid,
          newCollectionId
        );
      }

      await db_run(`UPDATE content SET collectionid = ? WHERE id = ?`, [
        newCollectionId,
        contentId,
      ]);
    }
  }
};
