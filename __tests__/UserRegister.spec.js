const request = require('supertest');
const app = require('../src/app');
const User = require('../src/user/User');
const nodemailerStub = require('nodemailer-stub');
const EmailService = require('../src/email/EmailService');

beforeEach(async () => {
  await User.deleteMany();
});

const validUser = {
  username: 'user1',
  email: 'user1@email.com',
  password: 'P4ssword',
};

const postUser = (user = validUser) => {
  return request(app).post('/api/1.0/users').send(user);
};
describe('User registration', () => {
  it('returns 200 OK when signup request is valid', async () => {
    const response = await postUser();
    expect(response.status).toBe(200);
  });

  it('returns success message when signup request is valid', async () => {
    const response = await postUser();
    expect(response.body.message).toBe('User created');
  });

  it('saves the user to database', async () => {
    await postUser();
    const counter = await User.countDocuments();
    expect(counter).toBe(1);
  });

  it('it saves the username and email to database', async () => {
    await postUser();
    const user = await User.findOne();
    expect(user.username).toBe('user1');
    expect(user.email).toBe('user1@email.com');
  });

  it('hashes the password in database', async () => {
    await postUser();
    const user = await User.findOne();
    expect(user.password).not.toBe('P4ssword');
  });

  it('returns 400 when username is null', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@email.com',
      password: 'P4ssword',
    });
    expect(response.status).toBe(400);
  });

  it('returns validationErrors field in response body when validation error occurs', async () => {
    const response = await postUser({
      username: null,
      email: 'user1@email.com',
      password: 'P4ssword',
    });
    const body = response.body;
    expect(body.validationErrors).not.toBeUndefined();
  });

  it('returns errors for both when username and email is null', async () => {
    const response = await postUser({
      username: null,
      email: null,
      password: 'P4ssword',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  it.each`
    field         | value              | expectedMessage
    ${'username'} | ${null}            | ${'Username cannot be null'}
    ${'username'} | ${'usr'}           | ${'Must have min 4 and max 32 characters'}
    ${'username'} | ${'a'.repeat(33)}  | ${'Must have min 4 and max 32 characters'}
    ${'email'}    | ${null}            | ${'Email cannot be null'}
    ${'email'}    | ${'mail.com'}      | ${'Email is not valid'}
    ${'email'}    | ${'user.mail.com'} | ${'Email is not valid'}
    ${'email'}    | ${'user@mail'}     | ${'Email is not valid'}
    ${'password'} | ${null}            | ${'Password cannot be null'}
    ${'password'} | ${'P4ssw'}         | ${'Password must be at least 6 characters'}
    ${'password'} | ${'alllowercase'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'ALLUPPERCASE'}  | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'5478394857'}    | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lowerand123'}   | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'lowerandUPPER'} | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
    ${'password'} | ${'UPPER1234'}     | ${'Password must have at least 1 uppercase, 1 lowercase letter and 1 number'}
  `(
    'returns $expectedMessage when $field is $value',
    async ({ field, expectedMessage, value }) => {
      const user = {
        username: 'user1',
        email: 'user1@mail.com',
        password: 'P4ssword',
      };
      user[field] = value;
      const response = await postUser(user);
      const body = response.body;
      expect(body.validationErrors[field]).toBe(expectedMessage);
    }
  );

  it('returns email in use when same email is already used', async () => {
    await User.create({ ...validUser });
    const response = await postUser();
    expect(response.body.validationErrors.email).toBe('Email in use');
  });
  it('returns errors for both username is null and email is in use', async () => {
    await User.create({ ...validUser });
    const response = await postUser({
      username: null,
      email: validUser.email,
      password: 'P4ssword',
    });
    const body = response.body;
    expect(Object.keys(body.validationErrors)).toEqual(['username', 'email']);
  });

  it('creates user in inactive mode', async () => {
    await postUser();
    const savedUser = await User.findOne();
    expect(savedUser.inactive).toBe(true);
  });

  it('creates user in inactive mode even the request body contains inactive as false', async () => {
    const newUser = { ...validUser, inactive: false };
    await postUser(newUser);
    const user = await User.findOne();
    expect(user.inactive).toBe(true);
  });

  it('creates an activation token for user', async () => {
    await postUser();
    const savedUser = await User.findOne();
    expect(savedUser.activationToken).toBeTruthy();
  });

  it('sends an account activation email with activation token', async () => {
    await postUser();
    const lastMail = nodemailerStub.interactsWithMail.lastMail();
    expect(lastMail.to[0]).toBe('user1@email.com');
    const savedUser = await User.findOne();
    expect(lastMail.content).toContain(savedUser.activationToken);
  });

  it('returns 502 Bad Gateway when sending email fails', async () => {
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to deliver email' });
    const response = await postUser();
    mockSendAccountActivation.mockRestore();
    expect(response.status).toBe(502);
  });

  it('returns email failure message when sending email fails', async () => {
    const mockSendAccountActivation = jest
      .spyOn(EmailService, 'sendAccountActivation')
      .mockRejectedValue({ message: 'Failed to deliver email' });
    const response = await postUser();
    mockSendAccountActivation.mockRestore();
    expect(response.body.message).toBe('Email failure');
  });
});

describe('Account activation', () => {
  it('activates the account when correct token is sent', async () => {
    await postUser();
    let savedUser = await User.findOne();
    const token = savedUser.activationToken;

    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    savedUser = await User.findOne();
    expect(savedUser.inactive).toBe(false);
  });

  it('removes the token from user table after successful activation', async () => {
    await postUser();
    let savedUser = await User.findOne();
    const token = savedUser.activationToken;

    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    savedUser = await User.findOne();
    expect(savedUser.activationToken).toBeFalsy();
  });

  it('does not activate account when token is wrong', async () => {
    await postUser();
    const token = 'invalid-token';

    await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    const savedUser = await User.findOne();
    expect(savedUser.inactive).toBe(true);
  });

  it('returns bad request when token is wrong', async () => {
    await postUser();
    const token = 'invalid-token';

    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    expect(response.status).toBe(400);
  });

  it('returns message when wrong token is sent', async () => {
    await postUser();
    const token = 'invalid-token';

    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    expect(response.body.message).toBe(
      'This account is either active or the token is invalid'
    );
  });

  it('returns successful message when correct token is sent', async () => {
    await postUser();
    let savedUser = await User.findOne();
    const token = savedUser.activationToken;

    const response = await request(app)
      .post('/api/1.0/users/token/' + token)
      .send();
    expect(response.body.message).toBe('Account is activated');
  });
});
