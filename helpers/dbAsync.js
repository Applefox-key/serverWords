import db from "../database.js";

export const db_get = async (query, param) => {
  return new Promise((resolve, reject) => {
    db.get(query, param, (err, rows) => {
      if (err) {
        console.log(err.message);
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
        console.log(err.message);
        reject(err.error ? err : { error: err.message });
      }
      resolve(rows);
    });
  });
};
export const db_run = async (query, param) => {
  try {
    return await new Promise((resolve, reject) => {
      db.run(query, param, (err) => {
        if (err) {
          console.log(err.message);
          reject(err.error ? err : { error: err.message });
        }
        resolve({ message: "success" });
      });
    });
  } catch (error) {
    return { error: error.message };
  }
};
