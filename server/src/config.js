import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default {
  port: 7890,
  auth: {
    secret: 'abc123456_',
    exp: 604800000, // 有效期7天
  },
  upload: {
    dir: resolve(__dirname, '../upload'),
    maxFileSize: 2 * 1024 * 1024,
    maxFiles: 20,
  },
  db: {
    name: 'private_chat',
    user: 'root',
    password: '123456',
    host: '0.0.0.0',
    port: 33060
  }
};