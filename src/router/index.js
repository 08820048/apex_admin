import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { authUtils } from '@/api/auth'
import { ElMessage } from 'element-plus'

// 布局组件
import Layout from '@/components/Layout.vue'

// 页面组件
import Dashboard from '@/views/Dashboard.vue'
import Login from '@/views/Login.vue'

// 文章管理
import ArticleList from '@/views/articles/ArticleList.vue'
import ArticleEdit from '@/views/articles/ArticleEdit.vue'

// 分类管理
import CategoryList from '@/views/categories/CategoryList.vue'

// 标签管理
import TagList from '@/views/tags/TagList.vue'

// 作品集管理
import PortfolioList from '@/views/portfolios/PortfolioList.vue'

// 友链管理
import FriendLinkList from '@/views/friend-links/FriendLinkList.vue'

// 订阅管理
import SubscriberList from '@/views/subscribers/SubscriberList.vue'

// 统计页面
import Stats from '@/views/Stats.vue'

// 个人信息页面
import Profile from '@/views/Profile.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '仪表盘' }
      },
      {
        path: 'articles',
        name: 'ArticleList',
        component: ArticleList,
        meta: { title: '文章管理' }
      },
      {
        path: 'articles/new',
        name: 'ArticleNew',
        component: ArticleEdit,
        meta: { title: '新建文章' }
      },
      {
        path: 'articles/:id/edit',
        name: 'ArticleEdit',
        component: ArticleEdit,
        meta: { title: '编辑文章' }
      },
      {
        path: 'categories',
        name: 'CategoryList',
        component: CategoryList,
        meta: { title: '分类管理' }
      },
      {
        path: 'tags',
        name: 'TagList',
        component: TagList,
        meta: { title: '标签管理' }
      },
      {
        path: 'portfolios',
        name: 'PortfolioList',
        component: PortfolioList,
        meta: { title: '作品集管理' }
      },
      {
        path: 'friend-links',
        name: 'FriendLinkList',
        component: FriendLinkList,
        meta: { title: '友链管理' }
      },
      {
        path: 'subscribers',
        name: 'SubscriberList',
        component: SubscriberList,
        meta: { title: '订阅管理' }
      },
      {
        path: 'stats',
        name: 'Stats',
        component: Stats,
        meta: { title: '访问统计' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: Profile,
        meta: { title: '个人信息' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 增强的路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // 检查是否需要认证
  if (to.meta.requiresAuth !== false) {
    // 检查是否已登录
    if (!userStore.isLoggedIn) {
      ElMessage.error('请先登录')
      next('/login')
      return
    }

    // 检查token是否过期
    if (authUtils.isTokenExpired()) {
      ElMessage.error('登录已过期，请重新登录')
      userStore.logout()
      next('/login')
      return
    }

    // 检查token是否即将过期（提醒用户）
    if (authUtils.isTokenExpiringSoon()) {
      ElMessage.warning({
        message: `登录将在${authUtils.formatRemainingTime()}后过期，请及时保存数据`,
        duration: 5000
      })
    }
  }

  // 如果已登录用户访问登录页，重定向到仪表盘
  if (to.path === '/login' && userStore.isLoggedIn && !authUtils.isTokenExpired()) {
    next('/dashboard')
    return
  }

  next()
})

export default router
