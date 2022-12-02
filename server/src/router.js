import Router from '@koa/router';
import auth from './middlewares/auth.js';
import upload from './services/upload.js';
import * as user from './services/user.js';
import * as friend from './services/friend.js';
import * as message from './services/message.js';

const router = new Router();
/**
 * 上传
 */
router.post('/upload', upload);
/**
 * 用户
 */
// 注册
router.post('/register', user.register);
// 登录
router.post('/login', user.login);
// 获取用户信息
router.post('/get_user_info', auth, user.getUserInfo);
// 同步公钥
router.post('/sync_public_key', auth, user.syncPublicKey);
// 更新用户信息
router.post('/update_user_info', auth, user.updateUserInfo);

/**
 * 好友
 */
// 获取好友列表
router.post('/get_friend_list', auth, friend.getFriendList);
// 删除好友
router.post('/remove_friend', auth, friend.removeFriend);
// 拒绝好友请求
router.post('/reject_friend', auth, friend.rejectFriend);

/**
 * 消息
 */
// 查看未接收到消息列表
router.post('/get_message_list', auth, message.getNewMessageList);
// 发送消息
router.post('/send_message', auth, message.sendMessage);
// 消息接收回执
router.post('/report_receive_message', auth, message.reportReceiveMessage);

export default router;