import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  routes: [
    {
      path: '/',
      component: () => import('@/components/Layout.vue'),
      redirect: '/home',
      children: [
        {
          name: 'home',
          path: 'home',
          component: () => import('@/views/Home.vue'),
        },
        {
          name: 'setting',
          path: 'setting',
          component: () => import('@/views/Setting.vue'),
        },
      ],
    },
    {
      name: 'chat',
      path: '/chat',
      component: () => import('@/views/Chat.vue'),
    },
    {
      name: 'login',
      path: '/login',
      component: () => import('@/views/Login.vue'),
    },
    {
      name: 'register',
      path: '/register',
      component: () => import('@/views/Register.vue'),
    },
    {
      name: 'notfound',
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/NotFound.vue'),
    },
  ],
  history: createWebHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

export default router;
