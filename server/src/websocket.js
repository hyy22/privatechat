import { WebSocketServer } from 'ws';

// 客户端列表map
const clientsMap = new Map();
/**
 * 发送消息
 * @param {*} socket 
 * @param {*} data 
 */
function sendMessage(socket, data, isBinary) {
  if (socket) {
    socket.send(JSON.stringify(data), { isBinary });
  }
}
/**
 * 按用户id发送消息
 * @param {*} uid 
 * @param {*} data 
 */
export function sendMessageByUserId(uid, data, isBinary) {
  const client = clientsMap.get(uid);
  sendMessage(client, data, isBinary);
}

const wss = new WebSocketServer({ noServer: true });
// 监听连接
wss.on('connection', (ws, request, client) => {
  if (!client) return;
  // 每个用户只保留最新一个socket
  const { userId, uuid } = client;
  const curClient = clientsMap.get(userId);
  if (curClient && curClient.uuid !== uuid) {
    sendMessage(curClient, {
      type: 'KICKED_OUT',
      content: '当前账号已在其他设备上登录，当前设备已下线',
    });
    curClient.terminate();
  }
  clientsMap.set(userId, Object.assign(ws, { uuid }));
  console.log('用户%s已上线', userId);
  ws.on('message', data => {
    console.log('received message: %s from uid %d', data, userId);
  });
  // 心跳检测
  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });
});
// 每20s发送一个心跳包
const interval = setInterval(() => {
  clientsMap.forEach((ws, key) => {
    if (ws.isAlive === false) {
      clientsMap.delete(key);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 20000);
// 服务断开
wss.on('close', () => {
  clearInterval(interval);
});

export default wss;