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
  // beforeEach('clean the table', () => db('bookmarks').truncate());

  describe('GET /bookmarks', () => {
    context('Given no bookmarks', () => {
      it.only('responds with 200 and an empty list', () => {
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
          .expect(404, { error:{ message: 'Card Not Found' } });
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
            expect(bookmark.body).to.be.an('object'));
      });
    });
  });

  describe('POST /bookmarks', () => {
    it('creates a bookmark, responding with 201 and the new bookmark', () => {
      const newBookmark = {
        title: 'test',
        url: 'https://test.com',
        description: 'This is bookmark test',
        rating: 3
      };
      return supertest(app)
        .post('/bookmarks')
        .set('Authorization', 'bearer ' + process.env.API_TOKEN)
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
        })
        .then(postRes => {
          supertest(app)
            .get(`/bookmarks/${postRes.body.id}`)
            .expect(201);
        });
    });
  });

  describe('DELETE /bookmarks/:id', () => {
    context('Given no bookmarks', () => {
      it('responds with 404', () => {
        const bookmarkId = '123';
        return supertest(app)
          .delete(`/articles/${bookmarkId}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(404, {});
      });
    });
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      this.beforeEach('insert bookmarks', () => {
        return db
          .into('bookmarks')
          .insert(testBookmarks);
      });

      it('removes the bookmark', () => {
        const bookmarkId = '1aaca0ef-1594-4cb7-b26e-dc60fc7afceb';
        const expectedBookmark = testBookmarks.filter(bookmark => bookmark.id !== bookmarkId);
        return supertest(app)
          .delete(`/bookmarks/${bookmarkId}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(204)
          .then(() =>
            supertest(app)
              .get('/bookmarks')
              .set('Authorization', 'bearer ' + process.env.API_TOKEN)
              .expect(expectedBookmark));
      });
    });
  });
});