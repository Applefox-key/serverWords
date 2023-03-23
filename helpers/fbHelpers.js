// import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.3/firebase-app.js";
import { initializeApp } from "firebase/app";
// import * as Storage from "https://www.gstatic.com/firebasejs/9.8.3/firebase-storage.js";
import {
  getStorage,
  ref,
  listAll,
  getDownloadURL,
  uploadBytesResumable,
} from "firebase/storage";
// } from "https://www.gstatic.com/firebasejs/9.8.3/firebase-storage.js";

export function firebaseInit() {
  const firebaseConfig = {
    storageBucket: "gs://words-d2019.appspot.com/",
  };
  initializeApp(firebaseConfig);
}

export async function getAvatarsFromStore() {
  firebaseInit();
  let imgarr = [];
  const storage = await getStorage();
  //const storageData = await Storage.ref(storage, "avatars/");
  const listRef = await ref(storage, "avatars");

  try {
    let res = await listAll(listRef);

    res.prefixes.forEach((folderRef) => {
      // All the prefixes under listRef.
      // You may call listAll() recursively on them.
    });
    res.items.forEach((itemRef, i) => {
      getDownloadURL(itemRef).then((url) => {
        imgarr.push({ name: itemRef.name, url: url });
        if (imgarr.length === res.items.length) {
          localStorage.setItem("avatars", JSON.stringify(imgarr));
        }
      });
    });
    return imgarr;
  } catch (error) {}
}

export async function setImgToStorage(userKey, file) {
  // let img = document.getElementById("fileName");
  // const [file] = img.files;
  firebaseInit();
  if (file) {
    const storage = await getStorage();
    const storageData = await ref(storage, "usersAvatars/" + userKey);
    let task = await uploadBytesResumable(storageData, file, {
      contentType: file.type,
    });
    if (task) {
      let curl = await getDownloadURL(task.task.snapshot.ref);
      if (curl) return curl;
    }
  }
  return "";
}
