import { createRouter, createWebHashHistory } from 'vue-router'
import RecipeIndexView from './views/RecipeIndexView.vue'
import RecipeShowView from './views/RecipeShowView.vue'
import ShoppingListView from './views/ShoppingListView.vue'
import MenuView from './views/MenuView.vue'

export const routes = [
  { path: '/', name: 'recipes', component: RecipeIndexView },
  { path: '/r/:slug', name: 'recipe', component: RecipeShowView },
  // Links to the old, longer path were shareable, so they keep working.
  { path: '/recipes/:slug', redirect: to => `/r/${to.params.slug}` },
  { path: '/shopping-list', name: 'shopping', component: ShoppingListView },
  { path: '/menu', name: 'menu', component: MenuView }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})