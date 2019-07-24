const BookmarksService = {
  getAllBookmarks(db) {
    return db('bookmarks').select('*');
  },

  getById(db, id) {
    return db('bookmarks').select('*').where('id', id)
      .catch(err => console.error(err.message))
      .finally( () => db.destroy());
  }
};

module.exports = BookmarksService;