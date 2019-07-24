const express = require('express');
const uuid = require('uuid/v4');

const logger = require('../logger');
const { bookmarks } = require('../store');
const BookmarksService = require('../bookmarks-service');

const bookmarksRouter = express.Router();

bookmarksRouter
  .route('/')
  .get((req, res) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => res.json(bookmarks));
  })
  .post((req,res) => {
    const { title, url, description = '', rating } = req.body;

    if (!title) {
      logger.error('Title is reqired');
      return res
        .status(404)
        .send('Invalid data');
    }
    if(!url) {
      logger.error('Url is reqired');
      return res
        .status(404)
        .status('Invalid data');
    }
    if(!rating){
      logger.error('Rating is reqired');
      return res
        .status(404)
        .send('Invalid data');
    }
    if (rating < 1 || rating > 5) {
      logger.error('Rating isn\'t between 1 and 5');
      return res
        .status(404)
        .send('Invalid data');
    }

    const id = uuid();

    const bookmark = {
      id,
      title,
      url,
      description,
      rating
    };
    
    bookmarks.push(bookmark);

    logger.info(`Bookmark with id ${id} created`);
    
    res.status(201).location(`http://localhost:8000/card/${id}`)
      .json(bookmark);
  });

bookmarksRouter
  .route('/:id')
  .get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(b => b.id === id);

    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not fount`);
      return res
        .status(404)
        .send('Card Not Fount');
    }

    res.json(bookmark);
  })
  .delete((req, res) => {
    const { id } = req.params;

    const bookmarkIndex = bookmarks.findIndex(b => b.id === id);

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res
        .status(404)
        .send('Not Found');
    }

    bookmarks.splice(bookmarkIndex, 1);

    logger.info(`Bookmark with id ${id} deleted.`);
    res
      .send(204)
      .end();
  });

module.exports = bookmarksRouter;