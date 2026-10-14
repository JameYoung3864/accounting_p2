import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '仪表盘' } },
  { path: '/add', name: 'add', component: () => import('../views/AddBill.vue'), meta: { title: '记一笔' } },
  { path: '/bills', name: 'bills', component: () => import('../views/BillList.vue'), meta: { title: '账单列表' } },
  { path: '/stats', name: 'stats', component: () => import('../views/Stats.vue'), meta: { title: '统计分析' } },
  { path: '/budget', name: 'budget', component: () => import('../views/Budget.vue'), meta: { title: '预算设置' } },
  { path: '/about', name: 'about', component: () => import('../views/About.vue'), meta: { title: '关于' } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.afterEach((to) => {
  const title = to.meta.title as string
  if (title) document.title = `${title} · 个人记账与预算管理`
})

export default router
