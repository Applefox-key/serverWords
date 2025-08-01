import { db_run, db_get, db_all } from "../helpers/dbAsync.js";

// playlists
// id INTEGER PRIMARY KEY AUTOINCREMENT,
// name text NOT NULL,
// userid integer,
// collectionsid string,

export const formatPlayListWithCollections = (data) => {
  if (data == []) return [];

  const map = new Map();
  data.forEach((el) => {
    if (!map.has(el.id))
      map.set(el.id, {
        id: el.id,
        name: el.name,
        content: [],
      });
    if (el.id_cont) {
      let val = map.get(el.id);
      val.content.push({
        id: el.id_cont,
        question: el.question,
        answer: el.answer,
        note: el.note_cont,
        imgA: el.imgA,
        imgQ: el.imgQ,
        collectionid: el.id,
      });
      map.set(el.id, val);
    }
  });

  return [...map.values()];
};

//all by admin
export const getAllAdmin = async () => {
  const query = `SELECT * FROM playlists`;
  return await db_get(query);
};

//get one by id
export const getById = async (user, id) => {
  let query = `SELECT * FROM playlists WHERE id=? AND userid=?`;
  let params = [id];

  const userid = user.id;
  params.push(userid);
  return await db_get(query, params);
};

export const getAll = async (user) => {
  const query = `
    SELECT playlists.id AS playlist_id, playlists.name AS playlist_name, playlists.userid AS playlist_userid,
           IFNULL(JSON_GROUP_ARRAY(JSON_OBJECT('id', collections.id, 
                                              'name', collections.name,
                                              'isMy', CASE WHEN collections.userid = ? THEN 1 ELSE 0 END)),
                                              '[]') AS collections
    FROM playlists
    LEFT JOIN playlistsItems ON playlistsItems.playlistid = playlists.id
    LEFT JOIN collections ON collections.id = playlistsItems.collectionid
    WHERE playlists.userid = ?
    GROUP BY playlists.id, playlists.name
    `;
  // AND (collections.userid = ? OR collections.ispublic = 1)
  const userid = user.id;
  const params = [userid, userid];

  const result = await db_all(query, params);
  const resultArr = result.map((row) => {
    const collections = JSON.parse(row.collections);
    return {
      id: row.playlist_id,
      name: row.playlist_name,
      collections: collections[0].id === null ? [] : collections,
    };
  });

  return resultArr;
};
export const getOneById = async (user, id) => {
  const query = `
    SELECT playlists.id AS playlist_id, playlists.name AS playlist_name, playlists.userid AS playlist_userid,
           IFNULL(JSON_GROUP_ARRAY(JSON_OBJECT('id', collections.id, 
                                              'name', collections.name,
                                              'isMy', CASE WHEN collections.userid = ? THEN 1 ELSE 0 END)),
                                              '[]') AS collections
    FROM playlists
    LEFT JOIN playlistsItems ON playlistsItems.playlistid = playlists.id
    LEFT JOIN collections ON collections.id = playlistsItems.collectionid
    WHERE playlists.userid = ? AND playlists.id = ?
    `;
  // AND (collections.userid = ? OR collections.ispublic = 1)
  const userid = user.id;
  const params = [userid, userid, id];

  const result = await db_all(query, params);
  const resultArr = result.map((row) => {
    const collections = JSON.parse(row.collections);
    return {
      id: row.playlist_id,
      name: row.playlist_name,
      collections: collections[0].id === null ? [] : collections,
    };
  });

  return resultArr;
};
//get ALL playlists list
export const getListAll = async (user) => {
  let query = `SELECT * FROM playlists WHERE userid=?`;

  const userid = user.id;
  let params = [userid];

  return await db_all(query, params);
};

export const getContentById = async (user, id) => {
  const query = `
    SELECT c.id, c.question, c.answer, c.note, c.imgA, c.imgQ
    FROM content c
    JOIN collections col ON c.collectionid = col.id
    JOIN playlistsItems pi ON col.id = pi.collectionid
    JOIN playlists p ON pi.playlistid = p.id
    WHERE p.id = ? AND (col.userid = p.userid OR col.ispublic = 1)
  `;

  const userid = user.id;
  let params = [id];

  let result = await db_all(query, params);

  return result;
};

export const createNew = async (user, name, collectionIds = null) => {
  const userId = user.id;

  // Insert into the playlists table
  const playlistQuery = `
    INSERT INTO playlists (name, userid) VALUES (?, ?) RETURNING id
  `;
  const playlistParams = [name, userId];
  const playlistResult = await db_get(playlistQuery, playlistParams);

  // Get the inserted playlist ID
  const playlistId = playlistResult.id; //.lastID;

  // Insert into the playlistsItems table
  if (collectionIds !== null) {
    const collections = collectionIds.split(",").map(Number);
    const playlistItemsQuery = `
      INSERT INTO playlistsItems (playlistid, collectionid)
      VALUES ${collections.map(() => "(?, ?)").join(", ")}
    `;
    const playlistItemsParams = collections.reduce((params, collectionId) => {
      params.push(playlistId, collectionId);
      return params;
    }, []);
    await db_run(playlistItemsQuery, playlistItemsParams);
  }

  return playlistId;
};

export const edit = async (user, name, listIds = null, id) => {
  const userid = user.id;

  // Update the playlist in the playlists table
  await db_run(
    `UPDATE playlists SET name = COALESCE(?, name) WHERE id = ? AND userid = ?`,
    [name, id, userid]
  );

  // Delete existing playlist items for the given playlist
  await db_run(`DELETE FROM playlistsItems WHERE playlistid = ?`, [id]);

  if (listIds !== null) {
    // Insert new playlist items into the playlistItems table
    const playlistItems = listIds.split(",").map((collectionId) => ({
      playlistid: id,
      collectionid: parseInt(collectionId.trim()),
    }));

    if (playlistItems.length > 0) {
      const placeholders = playlistItems.map(() => "(?, ?)").join(",");
      const values = playlistItems.flatMap((item) => [
        item.playlistid,
        item.collectionid,
      ]);

      await db_run(
        `INSERT INTO playlistsItems (playlistid, collectionid) VALUES ${placeholders}`,
        values
      );
    }
  }

  return;
};
//delete users one playlist
export const deleteOne = async (id) => {
  let res = await db_run(`DELETE FROM playlists WHERE id =?`, [id]);
  return res;
};
