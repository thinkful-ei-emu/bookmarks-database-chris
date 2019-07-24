const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixture');

describe('Bookmarks Endpoints', function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });
    
  after('disconect from db', () => db.destroy());
  before('clean the table', () => db('bookmarks').truncate());
  afterEach('cleanup', () => db('bookmarks').truncate());

  describe('GET /bookmarks', () => {
    context('Given no bookmarks', () => {
      it('responds with 200 and an empty list', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200, []);
      });
    });

    context('Given there are bookmarks in the table', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200, testBookmarks);
      });
    });
  });

  describe('GET /bookmarks/:id', () => {
    context('Given no bookmarks', () => {
      it('returns a 404', () => {
        return supertest(app)
          .get('/bookmarks/1aaca0ef-1594-4cb7-b26e-dc60fc7afceb')
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(404, 'Card Not Fount');
      });
    });

    context('Given there are bookmarks in the table', () => {
      const testBookmarks = makeBookmarksArray();
  
      beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });
  
      it('responds with 200 and the bookmark', () => {
        const expectedBookmark = testBookmarks[1];
        return supertest(app)
          .get(`/bookmarks/${expectedBookmark.id}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200)
          .then(bookmark =>
            expect(bookmark.body).to.be.an('array'));
      });
    });
  });
});