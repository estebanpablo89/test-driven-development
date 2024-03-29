const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');

beforeEach(async () => {
  await User.deleteMany();
});

const getUsers = () => {
  return request(app).get('/api/1.0/users');
};

const addUsers = async (activeUserCount, inactiveUserCount = 0) => {
  for (let i = 0; i < activeUserCount + inactiveUserCount; i++) {
    await User.create({
      username: `user${i + 1}`,
      email: `user${i + 1}@mail.com`,
      password: `P4ssword`,
      inactive: i >= activeUserCount,
    });
  }
};

describe('Listing users', () => {
  it('returns 200 ok when there are no users in database', async () => {
    const response = await request(app).get('/api/1.0/users/');
    expect(response.status).toBe(200);
  });

  it('returns page object as response body', async () => {
    const response = await getUsers();
    expect(response.body).toEqual({
      content: [],
      page: 0,
      size: 10,
      totalPages: 0,
    });
  });

  it('returns 10 users in page content when there are 11 users in database', async () => {
    await addUsers(11);
    const response = await getUsers();
    expect(response.body.content.length).toBe(10);
  });

  it('returns 6 active users when there are 6 active users and 5 inactive users in database', async () => {
    await addUsers(6, 5);
    const response = await getUsers();
    expect(response.body.content.length).toBe(6);
  });

  it('returns only id, username and email in content array for each user', async () => {
    await addUsers(3);
    const response = await getUsers();
    const user = response.body.content[0];
    expect(Object.keys(user)).toEqual(['_id', 'username', 'email']);
  });

  it('returns 2 pages when there are 15 active and 7 inactive users', async () => {
    await addUsers(15, 7);
    const response = await getUsers();
    expect(response.body.totalPages).toBe(2);
  });

  it('returns second page users and page indicator when page is set as 1 in request parameter', async () => {
    await addUsers(11);
    const response = await getUsers().query({ page: 1 });
    expect(response.body.content[0].username).toBe('user11');
    expect(response.body.page).toBe(1);
  });

  it('returns first page when page is set below 0 as request paremeter', async () => {
    await addUsers(11);
    const response = await getUsers().query({ page: -5 });
    expect(response.body.page).toBe(0);
  });

  it('returns 5 users and corresponding size indicator when size is set as 5 in request parameter', async () => {
    await addUsers(11);
    const response = await getUsers().query({ size: 5 });
    expect(response.body.content.length).toBe(5);
    expect(response.body.size).toBe(5);
  });

  it('returns 10 users and corresponding size indicator when size is set as 1000', async () => {
    await addUsers(11);
    const response = await getUsers().query({ size: 1000 });
    expect(response.body.content.length).toBe(10);
    expect(response.body.size).toBe(10);
  });

  it('returns 10 users and corresponding size indicator when size is set as 0', async () => {
    await addUsers(11);
    const response = await getUsers().query({ size: 0 });
    expect(response.body.content.length).toBe(10);
    expect(response.body.size).toBe(10);
  });

  it('returns page as zero and size as 10 when non numeric query params provided for both', async () => {
    await addUsers(11);
    const response = await getUsers().query({ size: 'size', page: 'page' });
    expect(response.body.page).toBe(0);
    expect(response.body.size).toBe(10);
  });
});

describe('Get user', () => {
  const getUser = (id = 5) => {
    return (response = request(app).get('/api/1.0/users/' + id));
  };
  it('returns 404 when user not found', async () => {
    const response = await getUser();
    expect(response.status).toBe(404);
  });

  it('returns User not found message for unknown user', async () => {
    const response = await getUser();
    expect(response.body.message).toBe('User not found');
  });

  it('returns proper error body when user not found', async () => {
    const nowInMillis = new Date().getTime();
    const response = await getUser();
    const error = response.body;
    expect(error.path).toBe('/api/1.0/users/5');
    expect(error.timestamp).toBeGreaterThan(nowInMillis);
    expect(Object.keys(error)).toEqual(['path', 'timestamp', 'message']);
  });

  it('returns 200 ok when an active user exist', async () => {
    const user = await User.create({
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
      inactive: false,
    });
    const response = await getUser(user._id);
    expect(response.status).toBe(200);
  });

  it('returns id, username and email in response body when an active user exist', async () => {
    const user = await User.create({
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
      inactive: false,
    });
    const response = await getUser(user._id);
    expect(Object.keys(response.body)).toEqual(['_id', 'username', 'email']);
  });

  it('returns 404 when the user is inactive', async () => {
    const user = await User.create({
      username: 'user1',
      email: 'user1@mail.com',
      password: 'P4ssword',
      inactive: true,
    });
    const response = await getUser(user._id);
    expect(response.status).toBe(404);
  });
});
