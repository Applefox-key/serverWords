export const formatCollectionContent = (user, data, addIsMy = false) => {
  if (data == []) return [];
  const userid = user.id;
  const map = new Map();
  data.forEach((el) => {
    if (!map.has(el.id))
      map.set(el.id, {
        collection: {
          id: el.id,
          name: el.name,
          note: el.note,
          categoryid: el.categoryid,
          category: el.category,
          isPublic: el.isPublic,
          isFavorite: el.isFavorite,
        },
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
        ...(el.rate !== undefined ? { rate: el.rate } : {}),
      });
      if (addIsMy) val.isMy = userid === el.userid;
      map.set(el.id, val);
    }
  });

  return [...map.values()];
};
