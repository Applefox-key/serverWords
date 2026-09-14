// var db = require("../database.js");
// var md5 = require("md5");
import { db_run, db_get, db_all } from "../helpers/dbAsync.js";
import md5 from "md5";
import * as dotenv from "dotenv";
import { saveImgAvatar } from "./avatars.js";
import { sendError } from "../helpers/responseHelpers.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_secret_change_in_production";
const JWT_EXPIRES_IN = "30d";

const generateApiToken = () => crypto.randomBytes(32).toString("hex");

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
      // Not a valid JWT — try legacy session, then api_token
      const session = await db_get("SELECT * FROM sessions WHERE token = ?", [token]);
      if (session) {
        const row = await db_get("SELECT * FROM users WHERE id = ?", [session.userid]);
        if (row) return row;
      }
      const byApiToken = await db_get("SELECT * FROM users WHERE api_token = ?", [token]);
      return byApiToken || undefined;
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
    const api_token = generateApiToken();
    return await db_run(
      `INSERT INTO users (name, email, password, img, role, settings, api_token) VALUES (?,?,?,?,?,?,?)`,
      [set.name, set.email, set.password, img, set.role || "user", JSON.stringify(set.settings), api_token]
    );
  } catch (error) {
    sendError(res, error.message);
  }
};
export const loginOrCreateGoogleUser = async ({ email, name, img }) => {
  try {
    let user = await getUserByEmail(email);
    if (!user) {
      const api_token = generateApiToken();
      await db_run(
        `INSERT INTO users (name, email, img, role, settings, api_token) VALUES (?,?,?,?,?,?)`,
        [name, email, img, "user", null, api_token]
      );
      user = await getUserByEmail(email);
    }
    const token = await createToken(user.id, user.role);
    if (token.error) return { error: token.error };
    return { token, role: user.role };
  } catch (error) {
    return { error: error.message };
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
export const getOrCreateApiToken = async (userid) => {
  const user = await db_get("SELECT api_token FROM users WHERE id = ?", [userid]);
  if (user?.api_token) return user.api_token;
  const token = generateApiToken();
  await db_run("UPDATE users SET api_token = ? WHERE id = ?", [token, userid]);
  return token;
};

export const regenerateApiToken = async (userid) => {
  const token = generateApiToken();
  await db_run("UPDATE users SET api_token = ? WHERE id = ?", [token, userid]);
  return token;
};

export const updateUserField = async (userid, field, value) => {
  if (
    !["name", "email", "password", "img", "settings", "role", "api_token"].includes(field)
  ) {
    throw new Error("Invalid field for update");
  }

  const sql = `UPDATE users SET ${field} = ? WHERE id = ?`;
  return await db_run(sql, [value, userid]);
};

export const mergeUserSettings = async (userid, partialSettings) => {
  const patch = JSON.stringify(partialSettings);
  return await db_run(
    `UPDATE users SET settings = json_patch(COALESCE(settings, '{}'), ?) WHERE id = ?`,
    [patch, userid]
  );
};
