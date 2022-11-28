const { host, protocol } = window.location;

export default {
  PROJECT_NAME: 'PRVCHAT', // 项目名称
  BASE_URL: '/api', // fetch baseUrl
  WS_BASE_URL: `${protocol === 'https:' ? 'wss' : 'ws'}://${host}/api/`, // ws baseUrl
  DEFAULT_AVATAR_URL: '', // 默认头像
};
