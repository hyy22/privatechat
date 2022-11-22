import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import router from './router.js';
import staticServer from 'koa-static';
import config from './config.js';
import handle from './middlewares/handle.js';

const app = new Koa();
/**
 * 中间件
 */
app.use(cors({ credentials: true }));
app.use(staticServer(config.upload.dir));
app.use(bodyParser({ jsonLimit: '500mb' })); // limit 500mb
app.use(handle);
app.use(router.routes());

export default app;