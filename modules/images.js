import fs from "fs";
import { getOneWithContent } from "./commonM.js";
import { User } from "../classes/User.js";
import { getOneContentItem } from "./contentM.js";
import { checkIsFolderExist } from "../helpers/multer.js";

export const checkImgAndDelete = async (set) => {
  const userId = User.getInstance().user.id;
  const res = await getOneContentItem(set.id);

  if (!res) return;
  if (!Object.keys(res).length) return;
  try {
    if (set.imgA)
      if (set.imgA !== res.imgA && res.imgA !== "") {
        const filename = res.imgA;
        const pathUrl =
          "./content/" + userId + "/" + set.collectionid + "/" + filename;
        fs.unlink(pathUrl, (err) => console.log(err));
      }
    if (set.imgQ)
      if (set.imgQ !== res.imgQ && res.imgQ !== "") {
        const filename = res.imgQ;
        const pathUrl =
          "./content/" + userId + "/" + set.collectionid + "/" + filename;
        fs.unlink(pathUrl, (err) => console.log(err));
      }
  } catch (error) {
    console.error(error);
  }
};

export const deleteOneImgSet = (set) => {
  const userId = User.getInstance().user.id;

  try {
    if (set.imgA)
      if (set.imgA !== "") {
        const filename = set.imgA;
        const pathUrl = "./content/" + userId + "/" + set.id + "/" + filename;
        fs.unlink(pathUrl, (err) => console.log(err));
      }
    if (set.imgQ)
      if (set.imgQ !== "") {
        console.log("delQ");
        const filename = set.imgQ;
        const pathUrl = "./content/" + userId + "/" + set.id + "/" + filename;
        fs.unlink(pathUrl, (err) => console.log(err));
      }
  } catch (error) {
    console.error(error);
  }
};
export const deleteImgs = async (id) => {
  const res = await getOneWithContent(id);
  if (!res) return;
  try {
    res.forEach((set) => deleteOneImgSet(set));
    const userId = User.getInstance().user.id;
    //del collection folder
    const pathUrl = "./content/" + userId + "/" + id;
    fs.rmdir(pathUrl, (err) => console.log(err));
  } catch (error) {
    console.error(error);
  }
};
//
export const copyImg = async (set, fromUser, collToId) => {
  const userId = User.getInstance().user.id.toString();
  let resultQ = "";
  let resultA = "";
  const fromFolderPath = path.join(
    "./",
    "content",
    fromUser.userFromId,
    fromUser.colFromId
  );
  checkIsFolderExist("content", userId, collToId.toString());
  const toFolderPath = path.join("./", "content", userId, collToId.toString());

  try {
    if (set.imgA)
      if (res.imgA !== "" && res.imgA !== "null") {
        const filename = res.imgA;
        const fromPath = fromFolderPath + "/" + filename;
        const pathTo = toFolderPath + "/" + filename;
        fs.copyFile(fromPath, pathTo, (err) => {
          if (err) throw err;
          console.log("file was copied to destination");
        });
        resultA = pathTo;
      }
    if (set.imgQ)
      if (res.imgQ !== "" && res.imgQ !== "null") {
        const filename = res.imgQ;
        const fromPath = fromFolderPath + "/" + filename;
        const pathTo = toFolderPath + "/" + filename;
        fs.copyFile(fromPath, pathTo, (err) => {
          if (err) throw err;
          console.log("file was copied to destination");
        });
        resultQ = pathTo;
      }
  } catch (error) {
    console.error(error);
  }
  return [resultQ, resultA];
};
//save images
export const saveImg = (set, images, tocollectionId, fromUser = "") => {
  let imageAUrl = set.imgA ? set.imgA : "";
  let imageQUrl = set.imgQ ? set.imgQ : "";
  //no new img files and is no from public return as it is
  if (!images && !fromUser) return [imageQUrl, imageAUrl];
  if (fromUser) {
    //copy from user public
    [imageQUrl, imageAUrl] = copyImg(set, fromUser, tocollectionId);
    return [imageQUrl, imageAUrl];
  } else {
    //check if img has been changed
    if (set.id !== "new") checkImgAndDelete(set);
  }

  if ("imgAfile" in images) imageAUrl = images.imgAfile[0].filename;
  if ("imgQfile" in images) imageQUrl = images.imgQfile[0].filename;

  return [imageQUrl, imageAUrl];
};
