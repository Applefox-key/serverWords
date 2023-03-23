import { gmailConfig } from "../configMail.js";
import { db_all, db_get, db_run } from "../helpers/dbAsync.js";
import { getUserByEmail } from "./usersM.js";
import nodemailer from "nodemailer";
import { google } from "googleapis";

// resettoken (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     token text,
//     userid integer,
//     expirationDate integer,
//     FOREIGN KEY(userid) REFERENCES users(id)
//     ON DELETE CASCADE  ON UPDATE NO ACTION)`,

const sendEmail = async (userEmail, pageUrl) => {
  const OAuth2_client = new google.auth.OAuth2(
    gmailConfig.client_id,
    gmailConfig.client_secret,
    gmailConfig.redirect_uris
  );
  OAuth2_client.setCredentials({
    refresh_token: gmailConfig.refresh_token,
  });
  const accessToken = await OAuth2_client.getAccessToken();

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: gmailConfig.email,
        clientId: gmailConfig.client_id,
        clientSecret: gmailConfig.client_secret,
        refreshToken: gmailConfig.refresh_token,
        accessToken: accessToken,
        accessUrl: "https://accounts.google.com/o/oauth2/token",
      },
    });

    let mailOptions = {
      from: gmailConfig.email,
      to: userEmail,
      subject: "reset password LEARNAPP",
      text: "Hello, this is a link to the reset page! " + pageUrl,
    };

    const result = await transporter.sendMail(mailOptions);

    return result;
  } catch (error) {
    return error;
  }
};

//create new token
export const createResetToken = async (userid) => {
  try {
    let resetToken =
      typeof global.it === "function"
        ? "testtoken"
        : //   : crypto.randomUUID();
          Number(new Date()).toString() + userid;

    // let CurrentTime = new Date();
    // CurrentTime.setMinutes(CurrentTime.getMinutes() + 15);
    // let expirationDate = CurrentTime.getTime();
    let exdays = 1;
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    let expirationDate = d.getTime();

    let res = await db_run(
      "INSERT INTO resettoken (token, userid, expirationDate) VALUES (?,?,?)",
      [resetToken, userid, expirationDate]
    );

    return res.error ? { error: err } : resetToken;
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
//delet reset token
export const deleteResetToken = async (resetToken) => {
  let res = await db_run(`DELETE FROM resettoken WHERE token =?`, [resetToken]);
  return res;
};
//findValidToken
export const findValidToken = async (userid) => {
  const tm = new Date().getTime();

  try {
    const resetRow = await db_all(
      `SELECT *
          FROM resettoken 
          WHERE userid = ?  
          AND  expirationDate > ?`,
      [userid, tm]
    );

    if (!resetRow) return { error: error.message };

    return resetRow[0].token;
  } catch (error) {
    return { error: error.message };
  }

  return res;
};
//mail with reset token
export const resetQuery = async (email, page) => {
  try {
    let user = await getUserByEmail(email);

    if (!user) return { error: "user not found" };
    let token = await findValidToken(user.id);
    if (token.error) token = await createResetToken(user.id);
    if (token.error) return { error: token.error };

    sendEmail(email, page + token);

    return { token: token, role: user.role };
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
//reset token validation
export const resetTokenValidation = async (resetToken) => {
  const tm = new Date().getTime();
  try {
    const resetRow = await db_get(
      `SELECT *
          FROM resettoken 
          WHERE token = ?  
          AND  expirationDate > ?`,
      [resetToken, tm]
    );
    if (!resetRow)
      return {
        error:
          "the link's expiration date has expired " + resetToken + " " + tm,
      };
    return resetRow;
  } catch (error) {
    return {
      error: "error the link's expiration date has expired " + error.message,
    };
  }
};

export const updateUserPassword = async (userid, password) => {
  try {
    return await db_run(
      `UPDATE users set 
               name = COALESCE(?,name), 
               email = COALESCE(?,email), 
               password = COALESCE(?,password), 
               img = COALESCE(?,img)
               WHERE id = ?`,
      [null, null, password, null, userid]
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteAllUnvalid = async () => {
  const tm = new Date().getTime();
  try {
    const resetRow = await db_all(
      `SELECT *
            FROM resettoken 
            WHERE expirationDate < ?`,
      [tm]
    );
    resetRow.forEach(async (element) => {
      await deleteResetToken(element.token);
    });
  } catch (error) {
    return { error: error.message };
  }
};
export const getAllResetTokens = async () => {
  const tm = new Date().getTime();
  try {
    const resetRow = await db_all(`SELECT * FROM resettoken `);
    return resetRow;
  } catch (error) {
    return { error: error.message };
  }
};
