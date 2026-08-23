import { createRouter, createWebHashHistory } from 'vue-router'
import RecipeIndexView from './views/RecipeIndexView.vue'
import RecipeShowView from './views/RecipeShowView.vue'
import ShoppingListView from './views/ShoppingListView.vue'
import MenuView from './views/MenuView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'recipes', component: RecipeIndexView },
    { path: '/recipes/:slug', name: 'recipe', component: RecipeShowView },
    { path: '/shopping-list', name: 'shopping', component: ShoppingListView },
    { path: '/menu', name: 'menu', component: MenuView }
  ]
})