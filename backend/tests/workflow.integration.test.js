const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const mongoose = require('mongoose');
const request = require('supertest');
const { Server: SocketServer } = require('socket.io');
const { io: createSocket } = require('socket.io-client');

const app = require('../src/app');
const { registerSocketHandlers } = require('../src/sockets/socket');
const {
  Conversation,
  JobOffer,
  Match,
  Message,
  User,
} = require('../src/models');

const mongoUri = process.env.MONGODB_WORKFLOW_TEST_URI
  || 'mongodb://127.0.0.1:27017/job-swipe-test-workflow';

async function signup(email, role) {
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      email,
      password: 'Password123!',
      role,
    });

  assert.equal(response.statusCode, 201);
  return response.body.token;
}

async function createOffer(recruiterToken) {
  const response = await request(app)
    .post('/api/jobs')
    .set('Authorization', `Bearer ${recruiterToken}`)
    .send({
      title: 'Developpeur Node.js',
      contractType: 'CDI',
      city: 'Paris',
      remoteMode: 'hybrid',
      requiredSkills: ['Node.js', 'MongoDB'],
      description: 'Developpement d API REST.',
    });

  assert.equal(response.statusCode, 201);
  return response.body.jobOffer._id;
}

async function createAcceptedConversation() {
  const candidateToken = await signup('candidate.workflow@example.com', 'candidate');
  const recruiterToken = await signup('recruiter.workflow@example.com', 'recruiter');
  const jobOfferId = await createOffer(recruiterToken);

  const matchResponse = await request(app)
    .post(`/api/matches/offers/${jobOfferId}`)
    .set('Authorization', `Bearer ${candidateToken}`);

  assert.equal(matchResponse.statusCode, 201);

  const acceptResponse = await request(app)
    .patch(`/api/matches/${matchResponse.body.match._id}/status`)
    .set('Authorization', `Bearer ${recruiterToken}`)
    .send({ status: 'accepted' });

  assert.equal(acceptResponse.statusCode, 200);

  return {
    candidateToken,
    recruiterToken,
    conversationId: acceptResponse.body.conversation._id,
    matchId: matchResponse.body.match._id,
  };
}

async function startSocketServer() {
  const httpServer = http.createServer(app);
  const ioServer = new SocketServer(httpServer, { cors: { origin: '*' } });
  registerSocketHandlers(ioServer);

  await new Promise((resolve) => httpServer.listen(0, resolve));

  return {
    ioServer,
    httpServer,
    url: `http://127.0.0.1:${httpServer.address().port}`,
  };
}

async function closeSocketServer(ioServer, httpServer) {
  ioServer.close();
  await new Promise((resolve) => httpServer.close(resolve));
}

test.before(async () => {
  await mongoose.connect(mongoUri);
});

test.beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    JobOffer.deleteMany({}),
    Match.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
  ]);
});

test.after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test('recruiter creates an offer and candidate can list it', async () => {
  const recruiterToken = await signup('recruiter.offer@example.com', 'recruiter');
  const candidateToken = await signup('candidate.offer@example.com', 'candidate');
  await createOffer(recruiterToken);

  const response = await request(app)
    .get('/api/jobs')
    .set('Authorization', `Bearer ${candidateToken}`);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.jobOffers.length, 1);
  assert.equal(response.body.jobOffers[0].status, 'published');
});

test('candidate likes an offer and recruiter reviews profile before accepting', async () => {
  const candidateToken = await signup('candidate.match@example.com', 'candidate');
  const recruiterToken = await signup('recruiter.match@example.com', 'recruiter');
  const jobOfferId = await createOffer(recruiterToken);

  const matchResponse = await request(app)
    .post(`/api/matches/offers/${jobOfferId}`)
    .set('Authorization', `Bearer ${candidateToken}`);

  assert.equal(matchResponse.statusCode, 201);
  assert.equal(matchResponse.body.match.status, 'pending');

  const matchId = matchResponse.body.match._id;
  const profileResponse = await request(app)
    .get(`/api/matches/${matchId}/candidate-profile`)
    .set('Authorization', `Bearer ${recruiterToken}`);

  assert.equal(profileResponse.statusCode, 200);
  assert.equal(profileResponse.body.status, 'pending');
  assert.equal(profileResponse.body.candidate.role, 'candidate');

  const acceptResponse = await request(app)
    .patch(`/api/matches/${matchId}/status`)
    .set('Authorization', `Bearer ${recruiterToken}`)
    .send({ status: 'accepted' });

  assert.equal(acceptResponse.statusCode, 200);
  assert.ok(acceptResponse.body.conversation._id);
});

test('participants can exchange messages through HTTP', async () => {
  const { candidateToken, recruiterToken, conversationId } = await createAcceptedConversation();

  const sendResponse = await request(app)
    .post(`/api/conversations/${conversationId}/messages`)
    .set('Authorization', `Bearer ${candidateToken}`)
    .send({ content: 'Bonjour, votre offre m interesse.' });

  assert.equal(sendResponse.statusCode, 201);

  const messagesResponse = await request(app)
    .get(`/api/conversations/${conversationId}/messages`)
    .set('Authorization', `Bearer ${recruiterToken}`);

  assert.equal(messagesResponse.statusCode, 200);
  assert.equal(messagesResponse.body.messages.length, 1);
  assert.equal(messagesResponse.body.messages[0].content, 'Bonjour, votre offre m interesse.');
});

test('candidate CV is uploaded, downloaded and deleted', async () => {
  const candidateToken = await signup('candidate.cv@example.com', 'candidate');
  const pdfBuffer = Buffer.from('%PDF-1.4\nJob Swipe test CV\n%%EOF');

  const uploadResponse = await request(app)
    .post('/api/profile/cv')
    .set('Authorization', `Bearer ${candidateToken}`)
    .attach('cv', pdfBuffer, {
      filename: 'cv.pdf',
      contentType: 'application/pdf',
    });

  assert.equal(uploadResponse.statusCode, 201);

  const downloadResponse = await request(app)
    .get('/api/profile/cv')
    .set('Authorization', `Bearer ${candidateToken}`);

  assert.equal(downloadResponse.statusCode, 200);
  assert.equal(downloadResponse.headers['content-type'], 'application/pdf');

  const deleteResponse = await request(app)
    .delete('/api/profile/cv')
    .set('Authorization', `Bearer ${candidateToken}`);

  assert.equal(deleteResponse.statusCode, 204);
});

test('Socket.IO authenticates participants and broadcasts a message', async () => {
  const { candidateToken, conversationId } = await createAcceptedConversation();
  const { ioServer, httpServer, url } = await startSocketServer();
  const socket = createSocket(url, {
    auth: { token: candidateToken },
    transports: ['websocket'],
  });

  try {
    await new Promise((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
    });

    const joinResponse = await new Promise((resolve) => {
      socket.emit('conversation:join', { conversationId }, resolve);
    });

    assert.equal(joinResponse.success, true);

    const messagePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('message:new non recu')), 3000);
      socket.once('message:new', (message) => {
        clearTimeout(timeout);
        resolve(message);
      });
    });

    socket.emit('message:send', {
      conversationId,
      content: 'Message temps reel',
    });

    const message = await messagePromise;
    assert.equal(message.content, 'Message temps reel');
    assert.equal(message.senderRole, 'candidate');
  } finally {
    socket.close();
    await closeSocketServer(ioServer, httpServer);
  }
});