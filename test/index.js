// import { expect } from 'chai';
import request from 'supertest';
import remote from 'dude-remote';
import sms from '../build';

const LONG_TIMEOUT = 5000;
const config = {
  remote: {
    server: {
      hostname: '127.0.0.1',
      port: 3000,
    },
    auth: {
      key: 'token',
      value: '123',
    },
  },
  sms: {
    request: {
      type: 'get',
      path: '/message',
    },
    params: {
      from: 'from',
      to: 'to',
      message: 'text',
    },
    validator: msg =>
      msg.message === 'valid' || msg.from === '989999999999',
    modifier: msg => {
      const message = `ADMIN: ${msg.message}`;
      return { from: msg.from, message };
    },
  },
};

const users = [
  {
    id: 102030,
    profile: {
      phone: '989999999999',
    },
  },
  {
    profile: {},
  },
];

const ims = [
  {
    user: 102030,
    id: 'U102030',
  },
  {
    user: 102040,
    id: 'U102040',
  },
];

describe('dude-sms', () => {
  let bot;
  before(() => {
    bot = {
      config,
      users,
      ims,
      inject() {},
    };
    bot = remote(bot);
    bot = sms(bot);
  });
  describe('sms webhooks', function functions() {
    this.timeout(LONG_TIMEOUT);

    it('should return 404 status for not found users', done => {
      request(bot.remote)
        .get(`${config.sms.request.path}?${config.remote.auth.key}=${config.remote.auth.value}&${config.sms.params.message}=valid`) // eslint-disable-line
        .expect(404, done);
    });

    it('shoud return 403 for invalid requests that doesn\'t pass by validator', done => {
      request(bot.remote)
        .get(`${config.sms.request.path}?${config.remote.auth.key}=${config.remote.auth.value}&from=${bot.users[0].profile.phone.replace(/98/, '0')}`) // eslint-disable-line
        .expect(403, done);
    });

    it('should return 200 status for valid & right requests', done => {
      request(bot.remote)
        .get(`${config.sms.request.path}?${config.remote.auth.key}=${config.remote.auth.value}&from=${bot.users[0].profile.phone}&${config.sms.params.message}=valid`) // eslint-disable-line
        .expect(200, done);
    });

    it('should have working modifiers that can modify the message as expected', done => {
      request(bot.remote)
        .get(`${config.sms.request.path}?${config.remote.auth.key}=${config.remote.auth.value}&from=${bot.users[0].profile.phone}&${config.sms.params.message}=valid`) // eslint-disable-line
        .expect(200, {
          text: 'ADMIN: valid',
          user: users[0].id,
          channel: ims[0].id,
        }, done);
    });
  });
});
