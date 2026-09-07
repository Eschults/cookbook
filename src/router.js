import { createRouter, createWebHashHistory } from 'vue-router'
import RecipeIndexView from './views/RecipeIndexView.vue'
import RecipeShowView from './views/RecipeShowView.vue'
import ShoppingListView from './views/ShoppingListView.vue'
import MenuView from './views/MenuView.vue'

export const routes = [
  { path: '/', name: 'recipes', component: RecipeIndexView },
  { path: '/r/:slug', name: 'recipe', component: RecipeShowView },
  { path: '/shopping-list', name: 'shopping', component: ShoppingListView },
  { path: '/menu', name: 'menu', component: MenuView }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  // Land at the top of the new page so its title and CTA are above the fold,
  // except when returning via back/forward, where the prior scroll position
  // is more useful than the top.
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})