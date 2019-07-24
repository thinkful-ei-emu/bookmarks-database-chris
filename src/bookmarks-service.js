const BookmarksService = {
  getAllBookmarks(db) {
    return db('bookmarks').select('*');
  }
};

module.exports = BookmarksService;