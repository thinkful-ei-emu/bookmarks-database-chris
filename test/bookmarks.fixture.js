function makeBookmarksArray() {
  return [{
    id: 'ab42f1a2-13d2-443d-a0d2-f2eb7e4cc77e',
    title: 'Thinkful',
    url: 'https://thinkful.com',
    description: 'This is bookmark one',
    rating: 4
  },
  {
    id: '1aaca0ef-1594-4cb7-b26e-dc60fc7afceb',
    title: 'Google',
    url: 'https://google.com',
    description: 'This is bookmark two',
    rating: 4
  }];
}

function makeMaliciousBookmark() {
  return [{
    id: 'db42f1a2-13d2-443d-a0d2-f2eb7e4cc77e',
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: 'https://thinkful.com',
    description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
    rating: 4
  }];
}
  
module.exports = { makeBookmarksArray, makeMaliciousBookmark };