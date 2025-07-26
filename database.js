// var md5 = require("md5");

import sqlite from "sqlite3";
var sqlite3 = sqlite.verbose();
import md5 from "md5";
import { db_run } from "./helpers/dbAsync.js";
const isInTest = typeof global.it === "function";
const DBSOURCE = isInTest ? "./db_test.sqlite" : "./db.sqlite";

let db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    // Cannot open database

    throw err;
  } else {
    console.log("Connected to the SQLite database...." + DBSOURCE);
    db.run("PRAGMA foreign_keys=ON");
    db.run("PRAGMA encoding='UTF-8'");

    db.serialize(() => {
      //users
      db.run(
        `CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name text,
        email text UNIQUE,
        password text,
        img text,
        role text, 
        settings text,
        CONSTRAINT email_unique UNIQUE (email))`,
        (err) => {
          if (err) {
            // Table already created
          } else {
            //   Table just created, creating some rows
            let insert =
              "INSERT INTO users (name, email, password, img, role) VALUES (?,?,?,?,?)";
            db_run(insert, [
              "test user",
              "test@test.test",
              md5("1"),
              "https://firebasestorage.googleapis.com/v0/b/words-d2019.appspot.com/o/avatars%2Fav1.png?alt=media&token=d83bc75a-2744-49c2-b961-93c631c4351f",
              "user",
            ]);
            db_run(insert, [
              "my user",
              "my@test.test",
              md5("1"),
              "https://firebasestorage.googleapis.com/v0/b/words-d2019.appspot.com/o/avatars%2Fav1.png?alt=media&token=d83bc75a-2744-49c2-b961-93c631c4351f",
              "user",
            ]);
            db_run(insert, [
              "admin",
              "admin@admin.admin",
              md5("admin685032"),
              "",
              "admin",
            ]);
          }
        }
      );
      //sessions
      db.run(
        `CREATE TABLE sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token text,
          userid integer,
          FOREIGN KEY(userid) REFERENCES users(id)
          ON DELETE CASCADE  ON UPDATE NO ACTION)`,
        (err) => {}
      ); //resetToken
      db.run(
        `CREATE TABLE resettoken (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token text,
          userid integer,  
          expirationDate integer,
          FOREIGN KEY(userid) REFERENCES users(id)
          ON DELETE CASCADE  ON UPDATE NO ACTION)`,
        (err) => {}
      );
      //categories
      db.run(
        `CREATE TABLE categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name text NOT NULL ,
                userid integer,
                FOREIGN KEY(userid) REFERENCES users(id)
                ON DELETE CASCADE  ON UPDATE NO ACTION)`,
        (err) => {}
      );
      //labels
      db.run(
        `CREATE TABLE labels (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name text NOT NULL ,
                  userid integer,
                  FOREIGN KEY(userid) REFERENCES users(id)
                  ON DELETE CASCADE  ON UPDATE NO ACTION)`,
        (err) => {}
      );
      //expressions
      db.run(
        `CREATE TABLE expressions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          expression text,
          stage integer,
          phrase text,
          history text,
          nextDate integer,
          userid integer,
          categoryid integer,    
          labelid integer,       
          note text, 
          inQueue INTEGER DEFAULT 0,
          FOREIGN KEY(categoryid) REFERENCES categories(id)
          ON DELETE SET NULL ON UPDATE NO ACTION,
          FOREIGN KEY(labelid) REFERENCES labels(id) 
          ON DELETE SET NULL ON UPDATE NO ACTION,
          FOREIGN KEY(userid) REFERENCES users(id)
          ON DELETE CASCADE  ON UPDATE NO ACTION)`,
        (err) => {}
      );

      //collections
      db.run(
        `CREATE TABLE collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name text,
        note text,
        userid integer,
        categoryid integer,    
        isPublic BOOLEAN NOT NULL DEFAULT 0,    
        isFavorite BOOLEAN NOT NULL DEFAULT 0,  
        FOREIGN KEY(categoryid) REFERENCES categories(id) 
        ON DELETE SET NULL ON UPDATE NO ACTION,
        FOREIGN KEY(userid) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE NO ACTION)`,
        (err) => {}
      );
      //content
      db.run(
        `CREATE TABLE content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question text,
        answer text,
        note text,
        collectionid integer,  
        imgQ text,  
        imgA text,
        rate integer DEFAULT 0,        
        FOREIGN KEY(collectionid) REFERENCES collections(id)
        ON DELETE CASCADE ON UPDATE NO ACTION)`,
        (err) => {}
      );

      //results

      db.run(
        `CREATE TABLE gamesResult (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  contentid INTEGER,
                  userid INTEGER,
                  probability TEXT,
                  FOREIGN KEY(contentid) REFERENCES content(id)
                  ON DELETE CASCADE ON UPDATE NO ACTION, 
                  FOREIGN KEY(userid) REFERENCES users(id)  
                  ON DELETE CASCADE ON UPDATE NO ACTION)`,
        (err) => {}
      );

      db.run(
        `CREATE TABLE playlists (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name text NOT NULL,
                  userid integer,
                  FOREIGN KEY(userid) REFERENCES users(id)
                  ON DELETE CASCADE  ON UPDATE NO ACTION)`,
        (err) => {}
      );

      db.run(
        `CREATE TABLE playlistsItems (
                  playlistid INTEGER,
                  collectionid INTEGER,
                  FOREIGN KEY(playlistid) REFERENCES playlists(id)
                  ON DELETE CASCADE ON UPDATE NO ACTION,
                  FOREIGN KEY(collectionid) REFERENCES collections(id)
                  ON DELETE CASCADE ON UPDATE NO ACTION)`,
        (err) => {}
      );
    });

    //----------------------------------------------------------------------------
  }
});

// module.exports = db;
export default db;
