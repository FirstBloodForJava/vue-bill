import { createRouter, createWebHistory } from 'vue-router'
import BillIndex from '../components/BillIndex.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: BillIndex,
    },
    {
      path: '/save',
      name: 'save',
      component: () => import('../components/SaveBillIndex.vue'),
    },
  ],
})

export default router
