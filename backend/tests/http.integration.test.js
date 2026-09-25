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

async function createRecruiter() {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      email: 'recruiter.integration@example.com',
      password: 'Password123!',
      role: 'recruiter',
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
      desiredContractTypes: ['CDI'],
      educations: [{ diploma: 'Master Informatique', school: 'Universite de Paris', graduationYear: 2024 }],
    });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.user.email, 'candidate.integration@example.com');
  assert.equal(response.body.user.role, 'candidate');
  assert.ok(response.body.token);
  assert.equal(response.body.user.passwordHash, undefined);
  assert.deepEqual(response.body.user.candidateProfile.desiredContractTypes, ['CDI']);
  assert.equal(response.body.user.candidateProfile.educations[0].school, 'Universite de Paris');

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
      desiredContractTypes: ['CDI', 'Freelance'],
      educations: [
        { diploma: 'Master Informatique', school: 'Universite de Paris', graduationYear: 2024 },
        { diploma: 'Licence Web', school: 'IUT de Lyon', graduationYear: 2022 },
      ],
      skills: ['JavaScript', 'MongoDB', 'Node.js'],
    });

  assert.equal(updateResponse.statusCode, 200);
  assert.equal(updateResponse.body.user.profile.firstName, 'Alexandre');
  assert.equal(updateResponse.body.user.profile.location, 'Lyon');
  assert.deepEqual(updateResponse.body.user.profile.desiredContractTypes, ['CDI', 'Freelance']);
  assert.equal(updateResponse.body.user.profile.educations.length, 2);
  assert.ok(updateResponse.body.user.profileCompletion > 0);

  const profileResponse = await request(app)
    .get('/api/profile')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(profileResponse.statusCode, 200);
  assert.deepEqual(profileResponse.body.user.profile.skills, ['JavaScript', 'MongoDB', 'Node.js']);
});

test('protected profile access rejects a missing token', async () => {
  const response = await request(app).get('/api/profile');

  assert.equal(response.statusCode, 401);
});

test('recruiter profile stores response preferences and completion', async () => {
  const token = await createRecruiter();

  const response = await request(app)
    .patch('/api/profile')
    .set('Authorization', `Bearer ${token}`)
    .send({
      companyName: 'Tech Solutions',
      companySector: 'Technologie',
      companySize: '50-100',
      companyCity: 'Paris',
      recruiterName: 'Sophie Bernard',
      recruiterPosition: 'Responsable recrutement',
      responseTime: 'within24Hours',
    });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.user.profile.responseTime, 'within24Hours');
  assert.equal(response.body.user.profileCompletion, 100);
});

test('candidate photo and recruiter company logo can be managed', async () => {
  const candidateToken = await createCandidate();
  const recruiterToken = await createRecruiter();
  const imageBuffer = Buffer.from('fake-image-content');

  const photoUpload = await request(app)
    .post('/api/profile/photo')
    .set('Authorization', `Bearer ${candidateToken}`)
    .attach('photo', imageBuffer, { filename: 'photo.png', contentType: 'image/png' });

  assert.equal(photoUpload.statusCode, 201);

  const photoResponse = await request(app)
    .get('/api/profile/photo')
    .set('Authorization', `Bearer ${candidateToken}`);

  assert.equal(photoResponse.statusCode, 200);
  assert.equal(photoResponse.headers['content-type'], 'image/png');

  const logoUpload = await request(app)
    .post('/api/profile/company-logo')
    .set('Authorization', `Bearer ${recruiterToken}`)
    .attach('logo', Buffer.from('<svg></svg>'), { filename: 'logo.svg', contentType: 'image/svg+xml' });

  assert.equal(logoUpload.statusCode, 201);

  const logoResponse = await request(app)
    .get('/api/profile/company-logo')
    .set('Authorization', `Bearer ${recruiterToken}`);

  assert.equal(logoResponse.statusCode, 200);
  assert.equal(logoResponse.headers['content-type'], 'image/svg+xml');

  const deletePhoto = await request(app)
    .delete('/api/profile/photo')
    .set('Authorization', `Bearer ${candidateToken}`);
  const deleteLogo = await request(app)
    .delete('/api/profile/company-logo')
    .set('Authorization', `Bearer ${recruiterToken}`);

  assert.equal(deletePhoto.statusCode, 204);
  assert.equal(deleteLogo.statusCode, 204);
});
