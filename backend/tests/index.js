import http from 'http';
import assert from 'assert';

import '../lib/index';

describe('Example Node Server', () => {
  it('should return 200', (done) => {
    http.get('http://127.0.0.1:4000/api/ping', (res) => {
      assert.equal(200, res.statusCode);
      done();
    });
  });
});
