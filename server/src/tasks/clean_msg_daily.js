import schedule from 'node-schedule';
import { logger } from '../logger.js';

export default function (db) {
  const rule = '0 0 0 * * *';
  schedule.scheduleJob(rule, () => {
    db.Message.removeReceivedMessages();
    logger.info('每日清理消息任务已执行');
  });
}