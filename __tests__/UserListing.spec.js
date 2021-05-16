const { interactsWithMail } = require('nodemailer-stub');
const request = require('supertest');
const app = require('../src/app');

describe('Listing users', () => {
  it('returns 200 ok when there are no users in database', async () => {
    const response = await request(app).get('/api/1.0/users');
    expect(response.status).toBe(200);
  });
});