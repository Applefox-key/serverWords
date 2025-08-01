import fs from "fs";
import { getOneWithContent } from "./commonM.js";
import { getOneContentItem } from "./contentM.js";
import { checkIsFolderExist } from "../helpers/multer.js";
import path from "path";
export const checkImgAndDelete = async (user, set) => {
  const userId = user.id;
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

export const deleteOneImgSet = (user, set) => {
  const userId = user.id;

  try {
    if (set.imgA)
      if (set.imgA !== "") {
        const filename = set.imgA;
        const pathUrl = "./content/" + userId + "/" + set.id + "/" + filename;
        fs.unlink(pathUrl, (err) => console.log(err));
      }
    if (set.imgQ)
      if (set.imgQ !== "") {
        const filename = set.imgQ;
        const pathUrl = "./content/" + userId + "/" + set.id + "/" + filename;
        fs.unlink(pathUrl, (err) => console.log(err));
      }
  } catch (error) {
    console.error(error);
  }
};
export const deleteImgs = async (user, id) => {
  const res = await getOneWithContent(user, id);
  if (!res) return;
  try {
    res.forEach((set) => deleteOneImgSet(req.user, set));
    const userId = user.id;
    //del collection folder
    const pathUrl = "./content/" + userId + "/" + id;
    fs.rmdir(pathUrl, (err) => console.log(err));
  } catch (error) {
    console.error(error);
  }
};
//
export const copyImg = async (user, set, fromUser, collToId) => {
  const userId = user.id.toString();
  let resultQ = "";
  let resultA = "";
  if (!set.imgA && !set.imgQ) return [resultQ, resultA];
  const fromFolderPath = path.join(
    "./",
    "content",
    fromUser.userFromId,
    fromUser.colFromId
  );
  checkIsFolderExist(["content", userId, collToId.toString()]);
  const toFolderPath = path.join("./", "content", userId, collToId.toString());

  try {
    if (set.imgA)
      if (set.imgA !== "" && set.imgA !== "null") {
        const filename = set.imgA;
        const fromPath = fromFolderPath + "/" + filename;
        const pathTo = toFolderPath + "/" + filename;
        fs.copyFile(fromPath, pathTo, (err) => {
          if (err) throw err;
          console.log("file was copied to destination");
        });
        resultA = filename;
      }
    if (set.imgQ)
      if (set.imgQ !== "" && set.imgQ !== "null") {
        const filename = set.imgQ;
        const fromPath = fromFolderPath + "/" + filename;
        const pathTo = toFolderPath + "/" + filename;
        fs.copyFile(fromPath, pathTo, (err) => {
          if (err) throw err;
          console.log("file was copied to destination");
        });
        resultQ = filename;
      }
  } catch (error) {
    console.error(error);
  }
  return [resultQ, resultA];
};
//save images
export const saveImg = async (
  user,
  set,
  images,
  tocollectionId,
  fromUser = ""
) => {
  let imageAUrl = set.imgA ? set.imgA : "";
  let imageQUrl = set.imgQ ? set.imgQ : "";
  //no new img files and is no from public return as it is
  if (!images && !fromUser) return [imageQUrl, imageAUrl];

  if (fromUser) {
    //copy from user public
    const [imageQUrl, imageAUrl] = await copyImg(
      user,
      set,
      fromUser,
      tocollectionId
    );

    return [imageQUrl, imageAUrl];
  } else {
    //check if img has been changed
    if (set.id !== "new") checkImgAndDelete(set);
  }

  if ("imgAfile" in images) imageAUrl = images.imgAfile[0].filename;
  if ("imgQfile" in images) imageQUrl = images.imgQfile[0].filename;

  return [imageQUrl, imageAUrl];
};
//replace to another collection
export const moveImgToNewCollection = (
  filename,
  userId,
  oldCollectionId,
  newCollectionId
) => {
  const oldPath = path.join(
    "content",
    userId.toString(),
    oldCollectionId.toString(),
    filename
  );
  const newFolderPath = path.join(
    "content",
    userId.toString(),
    newCollectionId.toString()
  );

  checkIsFolderExist([newFolderPath]);

  const newPath = path.join(newFolderPath, filename);

  fs.rename(oldPath, newPath, (err) => {
    if (err) throw err;
    console.log(`File moved from ${oldPath} to ${newPath}`);
  });
};
