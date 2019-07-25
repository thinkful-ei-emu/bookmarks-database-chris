const express = require('express');
const uuid = require('uuid/v4');
const xss = require('xss');

const logger = require('../logger');
const BookmarksService = require('../bookmarks-service');

const bookmarksRouter = express.Router();
const jsonParser = express.json();

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: xss(bookmark.url),
  description: xss(bookmark.description),
  rating: bookmark.rating
});

bookmarksRouter
  .route('/')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => res.json(bookmarks.map(serializeBookmark)))
      .catch(next);
  })
  .post(jsonParser, (req,res, next) => {
    const { title, url, description = '', rating } = req.body;
    console.log(title, url, description, rating);
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
        .send('Invalid data');
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
    
    BookmarksService.insertBookmark(
      req.app.get('db'),
      bookmark
    )
      .then(bookmark => {
        logger.info(`Bookmark with id ${id} created`);
        res
          .status(201)
          .location(`/bookmarks/${bookmark.id}`)
          .json(serializeBookmark(bookmark));
      })
      .catch(next);
  });

bookmarksRouter
  .route('/:id')
  .all((req, res, next) => {
    BookmarksService.getById(
      req.app.get('db'),
      req.params.id
    )
      .then(bookmark => {
        if(!bookmark) {
          logger.error(`Bookmark with id ${req.params.id} not found`);
          return res.status(404).json({
            error: { message: 'Card Not Found' }
          });
        }
        res.bookmark = bookmark;

        next();
      })
      .catch(next);
  })
  .get((req, res) => {
    res.json(serializeBookmark(res.bookmark));
  })
  .delete((req, res, next) => {
    const { id } = req.params;
    BookmarksService.deleteBookmark(
      req.app.get('db'),
      id
    )
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarksRouter;