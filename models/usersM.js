// var db = require("../database.js");
// var md5 = require("md5");
import { db_run, db_get } from "../helpers/dbAsync.js";
import md5 from "md5";
import * as dotenv from "dotenv";
import { User } from "../classes/User.js";
dotenv.config();

export const getUserByEmail = async (email) => {
  const res = await db_get("select * from users where email = ?", [email]);

  if (res) return res;
  return "";
};
export const getUserById = async (id) => {
  const res = await db_get("select * from users where id = ?", [id]);
  if (res) return res;
  return;
};
export const getUserByToken = async (token) => {
  const session = await db_get("select * from sessions where token = ?", [
    token,
  ]);
  if (!session) return;
  const row = await db_get("select * from users where id = ?", [
    session.userid,
  ]);
  if (!row) return;
  return row;
};
export const createToken = async (userid) => {
  let token =
    typeof global.it === "function"
      ? "testtoken"
      : Number(new Date()).toString() + userid;
  let res = await db_run("INSERT INTO sessions (token, userid) VALUES (?,?)", [
    token,
    userid,
  ]);

  return res.error ? { error: err } : token;
};
export const login = async (email, password) => {
  let user = await getUserByEmail(email);

  if (!user) return { error: "user not found" };
  var passw = password ? md5(password) : null;
  if (user.password != passw) return { error: "wrong password!" };
  let token = await createToken(user.id);
  if (token.error) return { error: token.error };
  return { token: token, role: user.role };
};

export const logout = async (token) => {
  return await db_run(`DELETE FROM sessions WHERE token = ?`, [token]);
};
export const updateUser = async (userid, set) => {
  let img = set.img;
  if (!img) img = "";
  else if (img.includes("blob")) {
    await fbHelpers.setImgToStorage(usersList[num].id, img).then((res) => {
      img = res;
    });
  }

  return await db_run(
    `UPDATE users set 
             name = COALESCE(?,name), 
             email = COALESCE(?,email), 
             password = COALESCE(?,password), 
             img = COALESCE(?,img)
             WHERE id = ?`,
    [set.name, set.email, set.password, img, userid]
  );
};
export const createUser = async (set) => {
  let img = set.img;
  if (!img) img = "";
  else if (img.includes("blob")) {
    await fbHelpers.setImgToStorage(usersList[num].id, img).then((res) => {
      img = res;
    });
  }
  return await db_run(
    `INSERT INTO users (name, email, password, img,role) VALUES (?,?,?,?,?)`,
    [set.name, set.email, set.password, img, set.role ? statusbar.role : "user"]
  );
};
export const deleteUser = async () => {
  const userid = User.getInstance().user.id;

  return await db_run(`DELETE FROM users WHERE id = ?`, [userid]);
};
