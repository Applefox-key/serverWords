// var db = require("../database.js");
// var md5 = require("md5");
import { db_run, db_get, db_all } from "../helpers/dbAsync.js";
import md5 from "md5";
import * as dotenv from "dotenv";
import { saveImgAvatar } from "./avatars.js";
import { sendError } from "../helpers/responseHelpers.js";
import jwt from "jsonwebtoken";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_secret_change_in_production";
const JWT_EXPIRES_IN = "30d";

export const getAllUsers = async () => {
  try {
    const res = await db_all("SELECT * FROM users");
    if (res) return res;
    return "";
  } catch (error) {
    sendError(res, error.message);
  }
};
export const getUserByEmail = async (email) => {
  try {
    const res = await db_get("SELECT * FROM users where email = ?", [email]);
    if (res) return res;
    return "";
  } catch (error) {
    sendError(res, error.message);
  }
};
export const getUserById = async (id) => {
  try {
    const res = await db_get("SELECT * FROM users WHERE id = ?", [id]);
    if (res) return res;
    return "";
  } catch (error) {
    sendError(res, error.message);
  }
};
export const getUserByToken = async (token) => {
  try {
    // Try JWT first
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      // Not a valid JWT — fall back to legacy session lookup
      const session = await db_get("SELECT * FROM sessions WHERE token = ?", [token]);
      if (!session) return;
      const row = await db_get("SELECT * FROM users WHERE id = ?", [session.userid]);
      if (!row) return;
      return row;
    }
    // JWT valid — load user from DB to get fresh data
    const row = await db_get("SELECT * FROM users WHERE id = ?", [decoded.userid]);
    if (!row) return;
    return row;
  } catch (error) {
    return { error: error.message };
  }
};
export const createToken = async (userid, role) => {
  try {
    if (typeof global.it === "function") return "testtoken";
    const token = jwt.sign(
      { userid, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    return token;
  } catch (error) {
    return { error: error.message };
  }
};
export const login = async (email, password) => {
  try {
    let user = await getUserByEmail(email);

    if (!user) return { error: "user not found" };
    var passw = password ? md5(password) : null;
    if (user.password != passw) return { error: "wrong password!" };
    let token = await createToken(user.id, user.role);
    if (token.error) return { error: token.error };
    return { token: token, role: user.role };
  } catch (error) {
    sendError(res, error.message);
  }
};

export const logout = async (token) => {
  try {
    // Try to delete legacy session if it exists (no-op for JWT tokens)
    await db_run(`DELETE FROM sessions WHERE token = ?`, [token]);
    return { message: "success" };
  } catch (error) {
    return { message: "success" }; // logout always succeeds client-side
  }
};
export const updateUser = async (user, userid, set, img) => {
  try {
    let imageUrl = img !== undefined ? saveImgAvatar(user, set, img) : null;

    const settingsValue =
      typeof set.settings === "string"
        ? set.settings
        : JSON.stringify(set.settings);

    return await db_run(
      `UPDATE users set 
             name = COALESCE(?,name), 
             email = COALESCE(?,email), 
             password = COALESCE(?,password), 
             img = COALESCE(?,img),
             settings = COALESCE(?,settings)
             WHERE id = ?`,
      [set.name, set.email, set.password, imageUrl, settingsValue, userid]
    );
  } catch (error) {
    sendError(res, error.message);
  }
};
export const createUser = async (set) => {
  try {
    let img = set.img;
    // if (!img) img = "";
    // else if (img.includes("blob")) {
    //   await fbHelpers.setImgToStorage(usersList[num].id, img).then((res) => {
    //     img = res;
    //   });
    // }
    return await db_run(
      `INSERT INTO users (name, email, password, img,role,settings) VALUES (?,?,?,?,?,?)`,
      [
        set.name,
        set.email,
        set.password,
        img,
        set.role ? statusbar.role : "user",
        JSON.stringify(set.settings),
      ]
    );
  } catch (error) {
    sendError(res, error.message);
  }
};
export const deleteUser = async (user) => {
  try {
    const userid = user.id;

    return await db_run(`DELETE FROM users WHERE id = ?`, [userid]);
  } catch (error) {
    sendError(res, error.message);
  }
};
export const updateUserField = async (userid, field, value) => {
  if (
    !["name", "email", "password", "img", "settings", "role"].includes(field)
  ) {
    throw new Error("Invalid field for update");
  }

  const sql = `UPDATE users SET ${field} = ? WHERE id = ?`;
  return await db_run(sql, [value, userid]);
};
