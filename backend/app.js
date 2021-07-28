'use strict';

const Koa = require('koa');
const cors = require('@koa/cors');
const Router = require('@koa/router');
const body = require('koa-body');
const serve = require('koa-static');
const User = require('./user');
const packageJson = require('./package.json');

// Create express instance
const app = new Koa();
const router = new Router();

const handler = async (ctx, next) => {
  try {
    ctx.body = {
      code: undefined,
      data: undefined,
      message: '',
    };
    await next();
    ctx.body.code = ctx.body.code || ctx.status;
    if (ctx.body.data?.message) {
      ctx.body.message = ctx.body.data.message;
      ctx.body.data.message = undefined;
    }
  } catch (err) {
    console.log(err);
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = {
      code: err.status || err.statusCode || 500,
      message: err.message,
    };
  }
};

app.use(serve('static'));
app.use(cors());
app.use(handler);
app.use(router.routes()).use(router.allowedMethods());

router.get('/api/status', (ctx) => {
  ctx.body = {
    code: 200,
    data: {
      version: packageJson.version,
    },
    message: 'Ninja is already.',
  };
});

router.get('/api/info', async (ctx) => {
  const data = await User.getPoolInfo();
  ctx.body.data = data;
});

router.get('/api/qrcode', async (ctx) => {
  const user = new User({});
  await user.getQRConfig();
  ctx.body.data = {
    token: user.token,
    okl_token: user.okl_token,
    cookies: user.cookies,
    QRCode: user.QRCode,
  };
});

router.post('/api/check', body(), async (ctx) => {
  const body = ctx.request.body;
  const user = new User(body);
  const data = await user.checkQRLogin();
  ctx.body.data = data;
});

router.post('/api/cklogin', body(), async (ctx) => {
  const body = ctx.request.body;
  const user = new User(body);
  const data = await user.CKLogin();
  ctx.body.data = data;
});

router.get('/api/userinfo', async (ctx) => {
  const query = ctx.query;
  const eid = query.eid;
  const user = new User({ eid });
  const data = await user.getUserInfoByEid();
  ctx.body.data = data;
});

router.post('/api/delaccount', body(), async (ctx) => {
  const body = ctx.request.body;
  const eid = body.eid;
  const user = new User({ eid });
  const data = await user.delUserByEid();
  ctx.body.data = data;
});

router.post('/api/update/remark', body(), async (ctx) => {
  const body = ctx.request.body;
  const eid = body.eid;
  const remark = body.remark;
  const user = new User({ eid, remark });
  const data = await user.updateRemark();
  ctx.body.data = data;
});

router.get('/api/users', async (ctx) => {
  if (ctx.host.startsWith('localhost')) {
    const data = await User.getUsers();
    ctx.body.data = data;
  } else {
    ctx.body = {
      code: 401,
      message: '该接口仅能通过 localhost 访问',
    };
  }
});

const port = process.env.PORT || 5701;
console.log('Start Ninja success! listening port: ' + port);
app.listen(port);
