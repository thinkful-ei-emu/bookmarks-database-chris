const knex = require('knex');
const app = require('../src/app');

const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixture');

describe('Bookmarks endpoint', () => {
  let db;
  before('set up knex', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
    return db;
  });
  
  after('destroy', () => db.destroy());
  before('clean', () => db('bookmarks').truncate());
  afterEach('clean', () => db('bookmarks').truncate());

  describe('GET /bookmarks',() => {
    context('no data', () => {
      it('returns a 200 and []', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200, []);
      });
    });

    context('with data', () => {
      let testBookmarks = makeBookmarksArray();

      beforeEach('insert array', () => {
        return db
          .insert(testBookmarks)
          .into('bookmarks');
      });
      it('should return testBookmarks', () => {
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

    context('Given an XSS attack bookmark', () => {
      const maliciousBookmark = makeMaliciousBookmark();
      beforeEach('insert malicious article', () => {
        return db
          .into('bookmarks')
          .insert(maliciousBookmark);
      });

      it('removes XSS atach content', () => {
        return supertest(app)
          .get(`/bookmarks/${maliciousBookmark[0].id}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;');
            expect(res.body.description).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.');
          });
      });
    });

    context('Given an XSS attack bookmark', () => {
      const maliciousBookmark = makeMaliciousBookmark();
      beforeEach('insert malicious article', () => {
        return db
          .into('bookmarks')
          .insert(maliciousBookmark);
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/bookmarks/${maliciousBookmark[0].id}`)
          .set('Authorization', 'bearer ' + process.env.API_TOKEN)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;');
            expect(res.body.description).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.');
          });
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
          return supertest(app)
            .get(`/bookmarks/${postRes.body.id}`)
            .set('Authorization', 'bearer ' + process.env.API_TOKEN)
            .expect(200)
            .expect(res => {
              expect(res.body).to.have.all.keys('id', 'title', 'url', 'rating', 'description');
            });
        });
    });

    context('Errors out for required fields', () => {
      const requiredFields = ['title', 'url', 'rating'];
      requiredFields.forEach(field => {
        const newBookmark = {
          title: 'Test title',
          url: 'http://www.test.com',
          rating: 4
        };

        it(`responds ith a 400 and error message when the '${field}' is missing`, () => {
          delete newBookmark[field];

          return supertest(app)
            .post('/bookmarks')
            .set('Authorization', 'bearer ' + process.env.API_TOKEN)
            .send(newBookmark)
            .expect(404, 'Invalid data');
        });
      });
    });

    it('removes XSS attack content from response', () => {
      const maliciousBookmark = makeMaliciousBookmark();
      return supertest(app)
        .post('/bookmarks')
        .set('Authorization', 'bearer ' + process.env.API_TOKEN)
        .send(maliciousBookmark[0])
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;');
          expect(res.body.description).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.');
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

      beforeEach('insert bookmarks', () => {
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