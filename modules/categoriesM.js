import { db_run, db_get, db_all } from "../helpers/dbAsync.js";
import { getTagsForCollections } from "./collectionTagsM.js";
export const formatCategoriesCollection = (result, pub = false) => {
  if (result == []) return [];

  const formattedArray = [];
  const groupedMap = new Map();

  for (const row of result) {
    const {
      id,
      name,
      userid,
      collectionid,
      isFavorite,
      isPublic,
      collectionName,
      isMy,
      cardCount,
      tags,
      layout,
    } = row;
    let categoryName = name ? name.toLowerCase() : "No category";
    if (!groupedMap.has(categoryName)) {
      groupedMap.set(categoryName, {
        id: pub ? [] : id,
        name: categoryName,
        collections: [],
      });
    }

    if (collectionid !== null) {
      const collectionObj = {
        id: collectionid,
        name: collectionName,
        cardCount: cardCount ?? 0,
        tags: tags ?? [],
        layout: layout ?? null,
      };
      if (!pub) {
        collectionObj.isPublic = isPublic;
        collectionObj.isFavorite = isFavorite;
      } else collectionObj.isMy = isMy;
      let elem = groupedMap.get(categoryName);
      elem.collections.push(collectionObj);
      if (pub && !elem.id.includes(id)) elem.id.push(collectionid);
      else isFavorite;
    }
  }
  for (const group of groupedMap.values()) {
    formattedArray.push(group);
  }

  return formattedArray;
};
//all by admin
export const getAllCategories = async (isPublic = false) => {
  const query = isPublic
    ? `SELECT * FROM categories WHERE userid is NULL`
    : `SELECT * FROM categories WHERE userid != NULL`;
  return await db_get(query);
};

//get one by name
export const getCategoryByName = async (user, name, isPublic = false) => {
  let query = isPublic
    ? `SELECT * FROM categories WHERE name=? AND userid is NULL`
    : `SELECT * FROM categories WHERE name=? AND userid=?`;
  let params = [name];

  if (!isPublic) {
    const userid = user.id;
    params.push(userid);
  }
  return await db_get(query, params);
};
//get one by id
export const getCategoryById = async (user, id, isPublic = false) => {
  let query = isPublic
    ? `SELECT * FROM categories WHERE id=? AND userid is NULL`
    : `SELECT * FROM categories WHERE id=? AND userid=?`;
  let params = [id];

  if (!isPublic) {
    const userid = user.id;
    params.push(userid);
  }
  return await db_get(query, params);
};
//get ALL
export const getCategoryAll = async (user) => {
  let query = `SELECT categories.id, categories.name AS name, categories.userid as userid, COUNT(collections.id) AS collection_count
  FROM categories  
  LEFT JOIN collections  
  ON collections.categoryid = categories.id
   WHERE categories.userid=?  
   GROUP BY categories.id`;
  const userid = user.id;
  let params = [userid];

  return await db_all(query, params);
};
//get ALL public categories
export const getPubCategoryAll = async (isPublic = false) => {
  const rows = await db_all(
    `SELECT collections.id, collections.note, collections.name AS name, isPublic, isFavorite, collections.categoryid, isFavorite,
    categories.name AS category
    FROM collections  
    LEFT JOIN categories  
    ON collections.categoryid = categories.id
    WHERE collections.isPublic = ` + true
  );

  if (!rows) return [];
  const categoriesMap = rows.reduce((map, item) => {
    if (item.category) {
      if (!map.has(item.category)) {
        map.set(item.category, { name: item.category, id: [item.id] });
      } else {
        const categoryObj = map.get(item.category);
        categoryObj.id.push(item.id);
        map.set(item.category, categoryObj);
      }
    }
    return map;
  }, new Map());
  const uniqueCategories = Array.from(categoriesMap.values());
  return uniqueCategories;
};
//get ALL with collections list
export const getCategoryWithCollections = async (user, isPublic = false) => {
  let queryPart = "";
  let queryPart0 = "";
  const userid = user.id;
  if (isPublic) {
    queryPart += ` WHERE collections.isPublic=${true}`;
    queryPart0 += `, CASE WHEN collections.userid = ${userid} THEN 1 ELSE 0 END AS isMy`;
  } else queryPart += ` WHERE categories.userid=${userid}`;

  let query = `SELECT categories.id, categories.name AS name, categories.userid as userid,
              collections.id AS collectionid, collections.isFavorite, collections.isPublic as isPublic, collections.name as collectionName, collections.layout,
              COUNT(content.id) AS cardCount ${queryPart0}
  FROM collections 
  LEFT JOIN categories
  ON collections.categoryid = categories.id
  LEFT JOIN content
  ON content.collectionid = collections.id
  ${queryPart}
  GROUP BY collections.id
  ORDER BY name COLLATE NOCASE ASC, collections.name COLLATE NOCASE ASC;`;

  let params = [];
  const rows = await db_all(query, params);
  if (!rows) return [];
  if (!isPublic) {
    const tagsMap = await getTagsForCollections(user);
    return rows.map(row => ({ ...row, tags: tagsMap[row.collectionid] ?? [] }));
  }
  return rows;
};
//create (one for user and return new row's id )or (create one for public and return new row's id)
export const createUserCategory = async (user, name) => {
  const userid = user.id;
  let categ = await getCategoryByName(user, name);

  if (categ) return { id: categ.id };

  await db_run(`INSERT INTO categories (name, userid) VALUES (?,?)`, [name, userid]);
  return await getCategoryByName(user, name);
};

//edit category's name
export const editCategory = async (user, name, id, isPublic = false) => {
  let categ = await getCategoryByName(user, name, isPublic);

  if (categ && categ.id.toString() === id.toString()) return ""; //nothing have been changed
  if (categ) return { error: `category with name ${name} is already exist` };
  if (isPublic)
    return await db_run(
      `UPDATE categories set
      name = COALESCE(?,name)
                   WHERE id = ? AND userid IS NULL `,
      [name]
    );

  const userid = user.id;
  return await db_run(
    `UPDATE categories set
      name = COALESCE(?,name)
                   WHERE id = ? AND userid =? `,
    [name, id, userid]
  );
};
//delete users one category
export const deleteCategory = async (id) => {
  let res = await db_run(`DELETE FROM categories WHERE id = ${id}`);
  return res;
};

//delete users one categories by userid
export const deleteUsersAllCategory = async (user) => {
  const userid = user.id;

  let res = await db_run(`DELETE FROM categories WHERE userid = ${userid}`)
    .then(() => {
      return { message: "success" };
    })
    .catch((error) => {
      return { error: error };
    });
  return res;
};
