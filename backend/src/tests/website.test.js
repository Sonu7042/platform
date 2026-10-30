import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { prisma } from '../config/db.js';

const app = createApp();
const ownerEmail = `owner-${Date.now()}@example.com`;
const intruderEmail = `intruder-${Date.now()}@example.com`;

let ownerToken;
let intruderToken;
let websiteId;

before(async () => {
  await prisma.$connect();

  const ownerRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Owner', email: ownerEmail, password: 'Password123!' });
  ownerToken = ownerRes.body.data.token;

  const intruderRes = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Intruder', email: intruderEmail, password: 'Password123!' });
  intruderToken = intruderRes.body.data.token;
});

after(async () => {
  await prisma.websiteProject.deleteMany({ where: { owner: { email: { in: [ownerEmail, intruderEmail] } } } });
  await prisma.user.deleteMany({ where: { email: { in: [ownerEmail, intruderEmail] } } });
  await prisma.$disconnect();
});

test('creates a website project for the authenticated owner', async () => {
  const res = await request(app)
    .post('/api/websites')
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ name: 'Test Diner', category: 'Restaurant', description: 'A test site' });

  assert.equal(res.status, 201);
  assert.equal(res.body.data.name, 'Test Diner');
  assert.ok(res.body.data.slug);
  websiteId = res.body.data.id;
});

test('rejects website creation without auth', async () => {
  const res = await request(app).post('/api/websites').send({ name: 'No Auth', category: 'Restaurant' });
  assert.equal(res.status, 401);
});

test('lists only the owner\'s websites', async () => {
  const res = await request(app).get('/api/websites').set('Authorization', `Bearer ${ownerToken}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.data.some((w) => w.id === websiteId));
});

test('prevents another user from reading someone else\'s website', async () => {
  const res = await request(app).get(`/api/websites/${websiteId}`).set('Authorization', `Bearer ${intruderToken}`);
  assert.equal(res.status, 403);
});

test('allows the owner to update their website', async () => {
  const res = await request(app)
    .patch(`/api/websites/${websiteId}`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ status: 'PUBLISHED' });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, 'PUBLISHED');
});

test('prevents another user from deleting someone else\'s website', async () => {
  const res = await request(app).delete(`/api/websites/${websiteId}`).set('Authorization', `Bearer ${intruderToken}`);
  assert.equal(res.status, 403);
});

test('allows the owner to delete their website', async () => {
  const res = await request(app).delete(`/api/websites/${websiteId}`).set('Authorization', `Bearer ${ownerToken}`);
  assert.equal(res.status, 204);
});
