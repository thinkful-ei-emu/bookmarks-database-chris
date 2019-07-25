const BookmarksService = {
  getAllBookmarks(db) {
    return db('bookmarks').select('*');
  },
  getById(db, id) {
    return db('bookmarks').select('*').where('id', id).first();
  },
  insertBookmark(db, newBookmark) {
    return db('bookmarks')
      .insert(newBookmark)
      .returning('*')
      .then(res => res[0]);
  },
  deleteBookmark(db, id) {
    return db('bookmarks')
      .where({ id })
      .delete();
  },
  updateBookmark(db, id, newBookmarkFields) {
    return db('bookmarks')
      .where({ id })
      .update(newBookmarkFields);
  }
};

module.exports = BookmarksService;