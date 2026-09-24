const test = require('node:test');
const assert = require('node:assert/strict');

const { generateToken, verifyToken } = require('../src/utils/token');

test('generateToken and verifyToken round-trip correctly', () => {
  const user = {
    _id: { toString: () => '64ec0bd6a9cf5bd0bd85d9fa' },
    email: 'alexandre@example.com',
    role: 'candidate',
  };

  const token = generateToken(user);
  const payload = verifyToken(token);

  assert.equal(payload.email, 'alexandre@example.com');
  assert.equal(payload.role, 'candidate');
  assert.equal(payload.id, '64ec0bd6a9cf5bd0bd85d9fa');
});
