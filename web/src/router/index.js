import { createRouter, createWebHistory } from 'vue-router';

const pages = import.meta.glob('@/views/*.vue');
const routes = Object.keys(pages).map((k) => {
  let name = formatComponentName(k.match(/views\/(.*).vue$/)[1]);
  return {
    path: name === '/home' ? '/' : name,
    component: pages[k],
  };
});
const router = createRouter({
  routes,
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});
/**
 * 组件名转化Home->/home, ArticleDetail->/article_detail
 * @param {String} name 组件名
 * @returns
 */
function formatComponentName(name) {
  return (
    '/' +
    name
      .replace(/[A-Z]/g, (val) => {
        return `_${val.toLowerCase()}`;
      })
      .replace(/^(_)/, '')
  );
}

export default router;
