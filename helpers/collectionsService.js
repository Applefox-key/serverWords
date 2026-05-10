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
          tags: el.collectionTags ?? [],
        },
        content: [],
        _preStats: el.stats_avgRate !== undefined
          ? { avgRate: el.stats_avgRate, toLearn: el.stats_toLearn, inProgress: el.stats_inProgress, learned: el.stats_learned }
          : null,
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

  return [...map.values()].map(({ _preStats, ...item }) => {
    const stats = _preStats ?? (() => {
      const cards = item.content;
      const rates = cards.map((c) => c.rate).filter((r) => r != null);
      return {
        avgRate: rates.length
          ? Math.round((rates.reduce((a, b) => a + b, 0) / rates.length) * 100) / 100
          : null,
        toLearn: cards.filter((c) => c.rate != null && c.rate <= 1).length,
        inProgress: cards.filter((c) => c.rate != null && c.rate >= 2 && c.rate <= 3).length,
        learned: cards.filter((c) => c.rate != null && c.rate >= 4).length,
      };
    })();
    return { ...item, collection: { ...item.collection, stats } };
  });
};
