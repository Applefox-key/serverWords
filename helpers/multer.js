import multer from "multer";
import path from "path";
import fs from "fs";

export const checkIsFolderExist = (foldArr) => {
  let mainPath = ["./"];
  foldArr.forEach((element) => {
    mainPath.push(element);
    if (!fs.existsSync(path.join(...mainPath))) {
      fs.mkdirSync(path.join(...mainPath));
    }
  });
};
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user.id;
    const collectionId = req.body.data.collectionid;
    checkIsFolderExist(["content", userId.toString(), collectionId.toString()]);
    const userFolderPath = path.join(
      "./",
      "content",
      userId.toString(),
      collectionId.toString()
    );
    cb(null, userFolderPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const storageAVATARS = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user.id;
    checkIsFolderExist(["content", userId.toString(), "avatars"]);
    const userFolderPath = path.join(
      "./",
      "content",
      userId.toString(),
      "avatars"
    );
    cb(null, userFolderPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

export const upload = multer({ storage: storage });
export const uploadUserAvatar = multer({ storage: storageAVATARS });
