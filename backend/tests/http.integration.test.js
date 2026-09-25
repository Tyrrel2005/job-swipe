const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');

const app = require('../src/app');
const { User } = require('../src/models');

const mongoUri = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/job-swipe-test-auth';

async function createCandidate() {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      email: 'candidate.integration@example.com',
      password: 'Password123!',
      role: 'candidate',
    });

  assert.equal(response.statusCode, 201);
  return response.body.token;
}

test.before(async () => {
  await mongoose.connect(mongoUri);
});

test.beforeEach(async () => {
  await User.deleteMany({});
});

test.after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('signup creates a candidate without exposing the password hash', async () => {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      email: 'candidate.integration@example.com',
      password: 'Password123!',
      role: 'candidate',
      firstName: 'Alex',
      skills: ['Node.js'],
    });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.user.email, 'candidate.integration@example.com');
  assert.equal(response.body.user.role, 'candidate');
  assert.ok(response.body.token);
  assert.equal(response.body.user.passwordHash, undefined);

  const user = await User.findOne({ email: 'candidate.integration@example.com' });
  assert.ok(user.passwordHash);
  assert.notEqual(user.passwordHash, 'Password123!');
});

test('login returns a token and /me identifies the authenticated user', async () => {
  await createCandidate();

  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'candidate.integration@example.com',
      password: 'Password123!',
    });

  assert.equal(loginResponse.statusCode, 200);
  assert.ok(loginResponse.body.token);

  const meResponse = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${loginResponse.body.token}`);

  assert.equal(meResponse.statusCode, 200);
  assert.equal(meResponse.body.user.email, 'candidate.integration@example.com');
});

test('profile update persists only allowed profile fields', async () => {
  const token = await createCandidate();

  const updateResponse = await request(app)
    .patch('/api/profile')
    .set('Authorization', `Bearer ${token}`)
    .send({
      firstName: 'Alexandre',
      location: 'Lyon',
      skills: ['JavaScript', 'MongoDB'],
    });

  assert.equal(updateResponse.statusCode, 200);
  assert.equal(updateResponse.body.user.profile.firstName, 'Alexandre');
  assert.equal(updateResponse.body.user.profile.location, 'Lyon');

  const profileResponse = await request(app)
    .get('/api/profile')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(profileResponse.statusCode, 200);
  assert.deepEqual(profileResponse.body.user.profile.skills, ['JavaScript', 'MongoDB']);
});

test('protected profile access rejects a missing token', async () => {
  const response = await request(app).get('/api/profile');

  assert.equal(response.statusCode, 401);
});
