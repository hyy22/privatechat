import { Toast } from 'vant';
import { isType } from '.';
import config from '../config';
import { useUserStore } from '@/stores/user';
import router from '@/router';

// 请求队列
const requestQueue = [];
// loading请求个数
let loadingCount = 0;

/**
 * 创建loading
 * @param {String} text 内容
 * @returns
 */
function showLoading(text = 'loading...') {
  Toast.loading({
    duration: 0,
    forbidClick: true,
    message: text,
  });
}
/**
 * 关闭loading
 */
function closeLoading() {
  loadingCount--;
  if (loadingCount <= 0) {
    Toast.clear();
  }
}

/**
 * 从请求队列移除
 * @param {String} paramString 请求json
 */
function removeRequestFromQueue(paramString) {
  const index = requestQueue.findIndex((v) => v === paramString);
  if (index > -1) {
    requestQueue.splice(index, 1);
  }
}

// 退出登录
function logout() {
  useUserStore().removeToken();
  router.push('/login');
}

/**
 * 请求封装
 * @param {Object} params 请求体
 * @returns
 */
export default async function (params) {
  const {
    url,
    data,
    headers = {},
    method = 'POST',
    single = true,
    loading = false,
  } = params;
  const reqUrl = url.startsWith('/') ? config.BASE_URL + url : url;
  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };
  // 设置token
  if (useUserStore().token) {
    reqHeaders.Authorization = `Bearer ${useUserStore().token}`;
  }
  // 如果是formdata删除类型，让浏览器自行设置
  if (isType(data, 'FormData')) {
    delete reqHeaders['Content-Type'];
  }
  // 拦截重复请求
  const paramString = JSON.stringify(params);
  if (single && requestQueue.indexOf(paramString) > -1) {
    console.error('请求频率过快...', paramString);
    return;
  }
  requestQueue.push(paramString);
  // 添加loading
  if (loading) {
    loadingCount++;
    showLoading();
  }
  return fetch(reqUrl, {
    method,
    headers: reqHeaders,
    body:
      reqHeaders['Content-Type'] === 'application/json' &&
      isType(data, 'object')
        ? JSON.stringify(data)
        : data,
    mode: 'cors',
    credentials: 'include',
  })
    .then((resp) => {
      removeRequestFromQueue(paramString);
      if (loading) closeLoading();
      const result = resp.json();
      return result;
    })
    .then((result) => {
      // 错误码处理
      if ([-400, -401].includes(result.code)) {
        logout();
      }
      // token续签
      if (result.newToken) {
        useUserStore().setToken(result.newToken);
      }
      return result;
    })
    .catch((error) => {
      removeRequestFromQueue(paramString);
      if (loading) closeLoading();
      throw error;
    });
}
