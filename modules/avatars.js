import fs from "fs";
import path from "path";
export const checkAvatarAndDelete = async (user, set) => {
  try {
    if (set.img.includes("static/media")) return set.img;
    const userId = user.id;
    const userOldImg = user.img;

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
export const saveImgAvatar = (user, set, images) => {
  let imgFromSet = set.img ? set.img : "";

  //no new img files
  if (!images && imgFromSet) return imgFromSet;
  //check if img has been changed
  if (imgFromSet) checkAvatarAndDelete(user, set);

  if (images) imgFromSet = images.filename;

  return imgFromSet;
};
