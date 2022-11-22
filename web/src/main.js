import { createApp } from 'vue';
import 'normalize.css/normalize.css';
import '@/styles/common.scss';
import 'lib-flexible/flexible.js';
import App from './App.vue';
import router from '@/router';
import { createPinia } from 'pinia';
// 引入vant样式
import 'vant/lib/index.css';
// 加载初始化脚本
import init from './utils/init.js';

createApp(App).use(router).use(createPinia()).mount('#app');
// 开始初始化
init();
