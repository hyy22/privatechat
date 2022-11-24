import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const {
  MYSQL_HOST,
  MYSQL_PORT,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
  JWT_AUTH_SECRET
} = process.env;

export default {
  port: 9000,
  auth: {
    secret: JWT_AUTH_SECRET || 'abc123456',
    exp: 604800000, // 有效期7天
  },
  upload: {
    dir: resolve(__dirname, '../upload'),
    maxFileSize: 2 * 1024 * 1024,
    maxFiles: 20,
  },
  db: {
    name: MYSQL_DATABASE || 'private_chat',
    user: MYSQL_USER || 'root',
    password: MYSQL_PASSWORD || '123456',
    host: MYSQL_HOST || 'localhost',
    port: MYSQL_PORT || 33060
  }
};