import { User } from "../classes/User.js";
import fs from "fs";
import path from "path";
export const checkAvatarAndDelete = async (set) => {
  try {
    if (set.img.includes("static/media")) return set.img;
    const userId = User.getInstance().user.id;
    const userOldImg = User.getInstance().user.img;

    if (set.img !== userOldImg) {
      const filename = userOldImg;
      const pathUrl = "./content/" + userId + "/avatars/" + filename;
      fs.unlink(pathUrl, (err) => console.log(err));
    }
  } catch (error) {
    console.error(error);
  }
};
//save images
export const saveImgAvatar = (set, images) => {
  let img = set.img ? set.img : "";

  //no new img files
  if (!images && img) return img;
  //check if img has been changed
  if (img) checkAvatarAndDelete(set);

  if (images) img = images.filename;

  return img;
};
