import db from "../database.js";

export const db_get = async (query, param) => {
  return new Promise((resolve, reject) => {
    db.get(query, param, (err, rows) => {
      if (err) {
        reject(err.error ? err : { error: err.message });
      }
      resolve(rows);
    });
  });
};
export const db_all = async (query, param) => {
  return await new Promise((resolve, reject) => {
    db.all(query, param, (err, rows) => {
      if (err) {
        reject(err.error ? err : { error: err.message });
      }
      console.log(rows);

      resolve(rows);
    });
  });
};
export const db_run = async (query, param) => {
  try {
    return await new Promise((resolve, reject) => {
      db.run(query, param, (err) => {
        if (err) {
          reject(err.error ? err : { error: err.message });
        }
        resolve({ message: "success" });
      });
    });
  } catch (error) {
    return { error: error.message };
  }
};

// db.run(
//   `CREATE TABLE users (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   name text,
//   email text UNIQUE,
//   password text,
//   img text,
//   role text,
//   CONSTRAINT email_unique UNIQUE (email))`,
//   async (err) => {
//     if (err) {
//       // Table already created
//     } else {
//       //   Table just created, creating some rows
//       let insert =
//         "INSERT INTO users (name, email, password, img, role) VALUES (?,?,?,?,?)";
//       await db_run(insert, [
//         "test user",
//         "test@test.test",
//         md5("1"),
//         "https://firebasestorage.googleapis.com/v0/b/words-d2019.appspot.com/o/avatars%2Fav1.png?alt=media&token=d83bc75a-2744-49c2-b961-93c631c4351f",
//         "user",
//       ]);
//       await db_run(insert, [
//         "my user",
//         "my@test.test",
//         md5("1"),
//         "https://firebasestorage.googleapis.com/v0/b/words-d2019.appspot.com/o/avatars%2Fav1.png?alt=media&token=d83bc75a-2744-49c2-b961-93c631c4351f",
//         "user",
//       ]);
//       await db_run(insert, [
//         "admin",
//         "admin@admin.admin",
//         md5("admin685032"),
//         "",
//         "admin",
//       ]);
//     }
//   }
// );

// export const db_create = async (params) => {
//   let err = await new Promise((resolve, reject) => {
//     db.run(params.queryCreate, "", (err) => {
//       if (err) {
//         reject(err);
//       }
//       resolve();
//     });

//     // if (!err) {
//     //   paramInsert.forEach(async (element) => {
//     //     await new Promise((resolve, reject) => {
//     //       db.run(queryInsert, paramInsert, (err) => {
//     //         if (err) {
//     //           reject(err);
//     //         }
//     //         resolve();
//     //       });
//     //     });
//     //   });
//     // }
//   });
// };
