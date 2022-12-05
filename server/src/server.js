import { createServer } from 'http';
import fetch from 'node-fetch';
import app from './app.js';
import wss, { sendMessageByUserId } from './websocket.js';
import jwt from 'jsonwebtoken';
import config from './config.js';
import errorCode from './errorCode.js';
import initDB from './models/index.js';
import * as utils from './utils.js';
import { logger } from './logger.js';

/**
 * ws鉴权
 * @param {*} request 
 * @param {*} cb 
 * @returns 
 */
function authenticate(request, cb) {
  const query = request.url.replace(/^([^?]+\?)/, '');
  const qs = new URLSearchParams(query);
  const token = qs.get('tk');
  if (!token) {
    cb(new Error('require token'));
    return;
  }
  try {
    cb(null, jwt.verify(token, config.auth.secret));
  } catch (e) {
    cb(e);
  }
}

(async function() {
  const server = createServer(app.callback());
  // 升级websocket协议
  server.on('upgrade', (request, socket, head) => {
    authenticate(request, function(err, payload) {
      if (err || !payload) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      wss.handleUpgrade(request, socket, head, function(ws) {
        wss.emit('connection', ws, request, payload);
      });
    });
  });

  // 初始化数据库
  const db = await initDB(config.db);

  // 给app ctx注入方法
  Object.assign(app.context, {
    sendMessageByUserId,
    db,
    config,
    logger,
    errorCode,
    fetch,
    ...utils,
  });

  server.listen(config.port, () => {
    console.log(`server running at port ${config.port}`);
  });
})();
