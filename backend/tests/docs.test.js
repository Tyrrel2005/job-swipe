const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');

test('OpenAPI documentation exposes the backend routes', async () => {
  const response = await request(app).get('/api-docs.json');

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.openapi, '3.0.3');
  assert.ok(response.body.components.securitySchemes.bearerAuth);
  assert.ok(response.body.paths['/api/auth/login']);
  assert.ok(response.body.paths['/api/jobs']);
  assert.ok(response.body.paths['/api/conversations/{id}/messages']);
  assert.ok(response.body.paths['/api/conversations/{id}/unread']);
  assert.ok(response.body.paths['/api/conversations/{id}/read']);
  assert.ok(response.body.paths['/api/notifications']);
  assert.ok(response.body.paths['/api/notifications/read-all']);
  assert.ok(response.body.paths['/api/notifications/{id}/read']);
});
