import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../config/db.js';

const app = createApp();
const testEmail = `test-${Date.now()}@example.com`;

before(async () => {
  await prisma.$connect();
});

after(async () => {
  await prisma.user.deleteMany({ where: { email: testEmail } });
  await prisma.$disconnect();
});

test('registers a new user and returns a token', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test User', email: testEmail, password: 'Password123!' });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.token);
  assert.equal(res.body.data.user.email, testEmail);
});

test('rejects duplicate registration', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test User', email: testEmail, password: 'Password123!' });

  assert.equal(res.status, 409);
});

test('logs in with correct credentials', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: testEmail, password: 'Password123!' });

  assert.equal(res.status, 200);
  assert.ok(res.body.data.token);
});

test('rejects login with wrong password', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: testEmail, password: 'WrongPassword!' });

  assert.equal(res.status, 401);
});

test('rejects malformed registration payload', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'A', email: 'not-an-email', password: '123' });

  assert.equal(res.status, 400);
});
