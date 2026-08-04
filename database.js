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
            let insert = "INSERT INTO users (name, email, password, img, role) VALUES (?,?,?,?,?)";
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
            db_run(insert, ["admin", "admin@admin.admin", md5("admin685032"), "", "admin"]);
          }
        },
      );
      //sessions
      db.run(
        `CREATE TABLE sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token text,
          userid integer,
          FOREIGN KEY(userid) REFERENCES users(id)
          ON DELETE CASCADE  ON UPDATE NO ACTION)`,
        (err) => {},
      ); //resetToken
      db.run(
        `CREATE TABLE resettoken (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token text,
          userid integer,  
          expirationDate integer,
          FOREIGN KEY(userid) REFERENCES users(id)
          ON DELETE CASCADE  ON UPDATE NO ACTION)`,
        (err) => {},
      );
      //categories
      db.run(
        `CREATE TABLE categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name text NOT NULL ,
                userid integer,
                FOREIGN KEY(userid) REFERENCES users(id)
                ON DELETE CASCADE  ON UPDATE NO ACTION)`,
        (err) => {},
      );
      //labels
      db.run(
        `CREATE TABLE labels (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name text NOT NULL ,
                  userid integer,
                  FOREIGN KEY(userid) REFERENCES users(id)
                  ON DELETE CASCADE  ON UPDATE NO ACTION)`,
        (err) => {},
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
        (err) => {},
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
        (err) => {},
      );
      db.run(
        `ALTER TABLE collections ADD COLUMN layout TEXT DEFAULT 'standard'`,
        (err) => {},
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
        (err) => {},
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
        (err) => {},
      );

      db.run(
        `CREATE TABLE playlists (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  name text NOT NULL,
                  userid integer,
                  FOREIGN KEY(userid) REFERENCES users(id)
                  ON DELETE CASCADE  ON UPDATE NO ACTION)`,
        (err) => {},
      );

      db.run(
        `CREATE TABLE playlistsItems (
                  playlistid INTEGER,
                  collectionid INTEGER,
                  FOREIGN KEY(playlistid) REFERENCES playlists(id)
                  ON DELETE CASCADE ON UPDATE NO ACTION,
                  FOREIGN KEY(collectionid) REFERENCES collections(id)
                  ON DELETE CASCADE ON UPDATE NO ACTION)`,
        (err) => {},
      );
      // entries
      db.run(
        `CREATE TABLE entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word text NOT NULL,
    explanation text,
    example text,
    category text CHECK(category IN ('word','phrase','grammar','idiom','note')),
    tags text DEFAULT '[]',
    rating integer DEFAULT 0,
    includeInPractice INTEGER DEFAULT 0,
    createdAt text,
    img TEXT DEFAULT NULL,
    userid integer,
    FOREIGN KEY(userid) REFERENCES users(id)
    ON DELETE CASCADE ON UPDATE NO ACTION)`,
        (err) => {},
      );

      // SR fields migration — silently ignored if columns already exist
      db.run(`ALTER TABLE entries ADD COLUMN ease_factor REAL DEFAULT 2.5`, () => {});
      db.run(`ALTER TABLE entries ADD COLUMN interval_days INTEGER DEFAULT 0`, () => {});
      db.run(`ALTER TABLE entries ADD COLUMN repetitions REAL DEFAULT 0`, () => {}); // REAL: weighted modes write fractional values
      db.run(`ALTER TABLE entries ADD COLUMN next_review_at TEXT DEFAULT NULL`, () => {});
      db.run(`ALTER TABLE entries ADD COLUMN last_reviewed_at TEXT DEFAULT NULL`, () => {});

      // SR data integrity fix: cap interval_days at 730 (2 years).
      // Without a ceiling on interval_days, the date overflows year 9999 and JS
      // serialises it as "+YYYYY-..." (extended ISO). SQLite compares TEXT dates
      // lexicographically: '+' < '2', so "+011278-..." sorts before "2026-..." and
      // the card always appears due. ease_factor is NOT capped here — capping it at
      // 2.5 would prevent mastery_level from ever reaching 5 (needs ease >= 2.6).
      db.run(`
        UPDATE entries
        SET
          interval_days  = 730,
          next_review_at = CASE
            WHEN last_reviewed_at IS NOT NULL
            THEN replace(datetime(substr(last_reviewed_at, 1, 19), '+730 days'), ' ', 'T') || '.000Z'
            ELSE NULL
          END
        WHERE interval_days > 730
      `, () => {});

      // Fix any next_review_at dates that were written with a space instead of 'T'
      // (SQLite datetime() uses space; JS toISOString() uses 'T'). Space < 'T' in
      // ASCII so "2027-08-01 ..." would incorrectly sort before "2027-08-01T..." on
      // same-day comparisons.
      db.run(`
        UPDATE entries
        SET next_review_at = replace(next_review_at, ' ', 'T')
        WHERE next_review_at LIKE '% %'
      `, () => {});

      // entries tags
      db.run(
        `CREATE TABLE entry_tags (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     userid INTEGER,
     FOREIGN KEY(userid) REFERENCES users(id)
     ON DELETE CASCADE ON UPDATE NO ACTION)`,
        (err) => {},
      );

      // entries to tags
      db.run(
        `CREATE TABLE entries_to_tags (
  entryid INTEGER,
  tagid INTEGER,
  FOREIGN KEY(entryid) REFERENCES entries(id)
  ON DELETE CASCADE ON UPDATE NO ACTION,
  FOREIGN KEY(tagid) REFERENCES entry_tags(id)
  ON DELETE CASCADE ON UPDATE NO ACTION,
  PRIMARY KEY(entryid, tagid)
)`,
        (err) => {},
      );

      // collections tags
      db.run(
        `CREATE TABLE collection_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  userid INTEGER,
  FOREIGN KEY(userid) REFERENCES users(id)
  ON DELETE CASCADE ON UPDATE NO ACTION)`,
        (err) => {},
      );

      // collections to tags
      db.run(
        `CREATE TABLE collections_to_tags (
  collectionid INTEGER,
  tagid INTEGER,
  FOREIGN KEY(collectionid) REFERENCES collections(id)
  ON DELETE CASCADE ON UPDATE NO ACTION,
  FOREIGN KEY(tagid) REFERENCES collection_tags(id)
  ON DELETE CASCADE ON UPDATE NO ACTION,
  PRIMARY KEY(collectionid, tagid)
)`,
        (err) => {},
      );

      // daily activity stats for bar chart
      db.run(`CREATE TABLE IF NOT EXISTS daily_activity (
        user_id       INTEGER NOT NULL,
        date          TEXT NOT NULL,
        entries_added INTEGER DEFAULT 0,
        reviews_count INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, date),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      )`, () => {});

      // migrations table for one-time operations
      db.run(`CREATE TABLE IF NOT EXISTS migrations (key TEXT PRIMARY KEY)`, () => {});

      // one-time: clear daily_activity so old UTC-date rows don't mix with new local-date rows
      db.run(
        `INSERT OR IGNORE INTO migrations (key) VALUES ('clear_daily_activity_v1')`,
        function () {
          if (this.changes > 0) db.run(`DELETE FROM daily_activity`);
        },
      );
    });

    //----------------------------------------------------------------------------
  }
});

// module.exports = db;
export default db;
